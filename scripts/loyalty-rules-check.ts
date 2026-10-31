/**
 * Runtime check for lib/loyalty (no test runner in this repo yet).
 * Run:  npx tsx scripts/loyalty-rules-check.ts
 * Exits with code 1 if any check fails.
 */
import {
  availableOffers, cancelClaim, cardProgress, claimReward, claimView,
  deleteMember, emptyLoyaltyState, ensureMember, issueCounterCode,
  issueMemberCode, loyaltyStats, markEmailVerified, normalizeProgram,
  redeemReward, saveOffer, setOfferActive, setProgram, stampWithCounterCode,
  stampWithMemberCode, voidStamp, activityLog, type LoyaltyState, type Rng,
} from "../lib/loyalty/rules";
import { addStaff, identifyStaff } from "../lib/loyalty/pin";

let passed = 0;
let finished = false;
let failed = 0;
function check(name: string, condition: boolean, extra?: unknown) {
  if (condition) passed++;
  else { failed++; console.error("FAIL:", name, extra ?? ""); }
}

// Deterministic rng so runs are repeatable.
let seed = 12345;
const rng: Rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

const T0 = new Date("2026-10-10T08:00:00Z");
const at = (mins: number) => new Date(T0.getTime() + mins * 60_000);

async function main() {
  let s: LoyaltyState = emptyLoyaltyState();
  s = setProgram(s, { stamps_required: 3, min_gap_hours: 4, daily_cap: 1, reward_valid_days: 30, stamp_mode: "both" });
  s = setProgram(s, { daily_cap: 3 });

  // --- program clamping
  const wild = normalizeProgram({ stamps_required: 9999, min_gap_hours: -5, daily_cap: 0, reward_valid_days: 1, stamp_mode: "x" as never });
  check("clamp stamps max", wild.stamps_required === 20);
  check("clamp gap min", wild.min_gap_hours === 0);
  check("clamp cap min", wild.daily_cap === 1);
  check("clamp days min", wild.reward_valid_days === 7);
  check("bad mode falls back", wild.stamp_mode === "both");

  // --- offers: max 5 active
  for (let i = 1; i <= 5; i++) {
    const r = saveOffer(s, { title: `Reward ${i}`, description: "d", kind: "free_item", monthly_limit: null, active: true }, rng);
    check(`offer ${i} saved`, r.ok);
    if (r.ok) s = r.state;
  }
  const sixth = saveOffer(s, { title: "Reward 6", description: "", kind: "free_item", monthly_limit: null, active: true }, rng);
  check("6th active offer refused", !sixth.ok && sixth.code === "limit_reached");
  const sixthPaused = saveOffer(s, { title: "Reward 6", description: "", kind: "custom", monthly_limit: null, active: false }, rng);
  check("6th paused offer allowed", sixthPaused.ok);
  if (sixthPaused.ok) s = sixthPaused.state;
  check("bad title refused", !saveOffer(s, { title: "x", description: "", kind: "free_item", monthly_limit: null, active: false }, rng).ok);
  check("bad monthly limit refused", !saveOffer(s, { title: "Okay", description: "", kind: "free_item", monthly_limit: 0, active: false }, rng).ok);
  check("bad kind refused", !saveOffer(s, { title: "Okay", description: "", kind: "nope" as never, monthly_limit: null, active: false }, rng).ok);
  const paused6 = s.offers[5];
  check("activate 6th refused", !setOfferActive(s, paused6.id, true).ok);

  // --- staff + PIN
  const st1 = await addStaff(s, { name: "Riya", pin: "1234" }, T0, rng);
  check("staff added", st1.ok);
  if (!st1.ok) return;
  s = st1.state;
  const dup = await addStaff(s, { name: "Amit", pin: "1234" }, T0, rng);
  check("duplicate PIN refused", !dup.ok);
  check("short PIN refused", !(await addStaff(s, { name: "Amit", pin: "12" }, T0, rng)).ok);
  check("non-digit PIN refused", !(await addStaff(s, { name: "Amit", pin: "12ab" }, T0, rng)).ok);
  const st2 = await addStaff(s, { name: "Amit", pin: "5678" }, T0, rng);
  check("second staff added", st2.ok);
  if (!st2.ok) return;
  s = st2.state;
  check("PIN not stored in clear", !JSON.stringify(s.staff).includes("1234") && !JSON.stringify(s.staff).includes("5678"));
  const riya = st1.staff.id;

  // --- PIN lockout
  let lockState = s;
  for (let i = 0; i < 4; i++) {
    const r = await identifyStaff(lockState, "0000", at(0));
    check(`wrong pin ${i + 1} not locked`, !r.ok && !r.locked);
    lockState = r.state;
  }
  const fifth = await identifyStaff(lockState, "0000", at(0));
  check("5th wrong PIN locks", !fifth.ok && fifth.locked);
  const duringLock = await identifyStaff(fifth.state, "1234", at(2));
  check("correct PIN refused while locked", !duringLock.ok && duringLock.locked);
  const afterLock = await identifyStaff(fifth.state, "1234", at(6));
  check("correct PIN works after lock", afterLock.ok);
  check("success resets failures", afterLock.ok && afterLock.state.pin_lock.failures === 0);

  // --- member must verify email
  const ens = ensureMember(s, "  Aarav@Example.COM ", T0, rng);
  s = ens.state;
  const mem = ens.member;
  check("email normalised", mem.email === "aarav@example.com");
  check("same email reuses member", ensureMember(s, "aarav@example.com", T0, rng).member.id === mem.id);
  const unverifiedCode = issueMemberCode(s, mem.id, at(0), rng);
  check("unverified member gets no code", !unverifiedCode.ok && unverifiedCode.code === "email_not_verified");
  const ver = markEmailVerified(s, mem.id, T0);
  check("verify ok", ver.ok);
  if (!ver.ok) return;
  s = ver.state;

  // --- Mode A: member code
  const c1 = issueMemberCode(s, mem.id, at(0), rng);
  check("member code issued", c1.ok);
  if (!c1.ok) return;
  s = c1.state;
  check("code is 6 digits", /^\d{6}$/.test(c1.token.code));
  check("wrong code rejected", !stampWithMemberCode(s, { code: "000000", staffId: riya }, at(1)).ok || c1.token.code === "000000");
  check("no staff rejected", !stampWithMemberCode(s, { code: c1.token.code, staffId: "nobody" }, at(1)).ok);
  const expired = stampWithMemberCode(s, { code: c1.token.code, staffId: riya }, at(2));
  check("code expired after 60s", !expired.ok && expired.code === "invalid_code");
  // new code
  const c1b = issueMemberCode(s, mem.id, at(10), rng);
  if (!c1b.ok) return;
  s = c1b.state;
  check("old code replaced", !stampWithMemberCode(s, { code: c1.token.code, staffId: riya }, at(10)).ok || c1.token.code === c1b.token.code);
  const st = stampWithMemberCode(s, { code: ` ${c1b.token.code.slice(0, 3)} ${c1b.token.code.slice(3)} `, staffId: riya }, at(10));
  check("stamp 1 given (spaces ignored)", st.ok);
  if (!st.ok) return;
  s = st.state;
  check("stamp records staff", st.stamp.staff_id === riya && st.stamp.method === "member_code");
  check("progress 1/3", cardProgress(s, mem.id).current === 1);
  const replay = stampWithMemberCode(s, { code: c1b.token.code, staffId: riya }, at(10));
  check("code cannot be reused", !replay.ok && replay.code === "invalid_code");

  // --- cooldown (4h) + not burned
  const c2 = issueMemberCode(s, mem.id, at(30), rng);
  if (!c2.ok) return;
  s = c2.state;
  const tooSoon = stampWithMemberCode(s, { code: c2.token.code, staffId: riya }, at(30));
  check("cooldown blocks stamp", !tooSoon.ok && tooSoon.code === "too_soon");
  // code was not burned: valid again after 4h only if still live; issue fresh after 4h
  const c3 = issueMemberCode(s, mem.id, at(10 + 241), rng);
  if (!c3.ok) return;
  s = c3.state;
  const st2a = stampWithMemberCode(s, { code: c3.token.code, staffId: riya }, at(10 + 241));
  check("stamp 2 after cooldown", st2a.ok);
  if (!st2a.ok) return;
  s = st2a.state;

  // --- daily cap: set gap 0, cap 1 -> second same-day refused
  let capState = setProgram(s, { min_gap_hours: 0, daily_cap: 2 });
  const cc = issueMemberCode(capState, mem.id, at(10 + 245), rng);
  if (!cc.ok) return;
  capState = cc.state;
  const cap = stampWithMemberCode(capState, { code: cc.token.code, staffId: riya }, at(10 + 245));
  check("daily cap blocks", !cap.ok && cap.code === "daily_cap");

  // --- Mode B: counter code
  s = setProgram(s, { min_gap_hours: 4, daily_cap: 3 });
  const other = ensureMember(s, "other@example.com", T0, rng);
  s = other.state;
  const ver2 = markEmailVerified(s, other.member.id, T0);
  if (!ver2.ok) return;
  s = ver2.state;
  const counter = issueCounterCode(s, at(600), rng);
  if (!counter.ok) return;
  s = counter.state;
  const b1 = stampWithCounterCode(s, { code: counter.token.code, memberId: mem.id }, at(600));
  check("counter code stamps (member 1)", b1.ok);
  if (!b1.ok) return;
  s = b1.state;
  check("counter stamp has no staff", b1.stamp.staff_id === null && b1.stamp.method === "counter_code");
  const b2 = stampWithCounterCode(s, { code: counter.token.code, memberId: other.member.id }, at(600));
  check("counter code single use (member 2 refused)", !b2.ok && b2.code === "invalid_code");
  const counter2 = issueCounterCode(s, at(601), rng);
  if (!counter2.ok) return;
  s = counter2.state;
  const oldCounter = stampWithCounterCode(s, { code: counter.token.code, memberId: other.member.id }, at(601));
  check("old counter code dead after rotation", !oldCounter.ok || counter.token.code === counter2.token.code);
  const late = stampWithCounterCode(s, { code: counter2.token.code, memberId: other.member.id }, at(603));
  check("counter code expires", !late.ok && late.code === "invalid_code");
  const member_code_as_counter = stampWithCounterCode(s, { code: "123456", memberId: mem.id }, at(601));
  check("random counter code rejected", !member_code_as_counter.ok);

  // --- completion, pending reward
  const prog = cardProgress(s, mem.id);
  check("card complete after 3 stamps", prog.total === 3 && prog.pending === 1 && prog.current === 3, prog);

  // --- mode restrictions
  const modeA = setProgram(s, { stamp_mode: "member_code" });
  check("counter code off in member-only mode", !issueCounterCode(modeA, at(700), rng).ok);
  const modeB = setProgram(s, { stamp_mode: "counter_code" });
  check("member code off in counter-only mode", !issueMemberCode(modeB, mem.id, at(700), rng).ok);

  // --- program paused
  const off = setProgram(s, { enabled: false });
  check("paused program blocks codes", !issueMemberCode(off, mem.id, at(700), rng).ok);
  check("paused program blocks claim", !claimReward(off, { memberId: mem.id, offerId: s.offers[0].id }, at(700), rng).ok);

  // --- claim
  check("other member cannot claim (no full card)", !claimReward(s, { memberId: other.member.id, offerId: s.offers[0].id }, at(700), rng).ok);
  check("paused offer not choosable", !claimReward(s, { memberId: mem.id, offerId: paused6.id }, at(700), rng).ok);
  check("unknown offer not choosable", !claimReward(s, { memberId: mem.id, offerId: "nope" }, at(700), rng).ok);
  const offer1 = s.offers[0];
  const cl = claimReward(s, { memberId: mem.id, offerId: offer1.id }, at(700), rng);
  check("reward claimed", cl.ok);
  if (!cl.ok) return;
  s = cl.state;
  check("claim copies title", cl.claim.title === offer1.title);
  check("claim code format", /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cl.claim.code));
  check("card resets after claim", cardProgress(s, mem.id).pending === 0 && cardProgress(s, mem.id).current === 0);
  check("cannot claim twice", !claimReward(s, { memberId: mem.id, offerId: offer1.id }, at(701), rng).ok);

  // offer edit/delete does not change an earned reward
  const edited = saveOffer(s, { id: offer1.id, title: "Totally different", description: "x", kind: "custom", monthly_limit: null, active: true }, rng);
  if (edited.ok) s = edited.state;
  check("claim keeps original title after edit", s.claims[0].title === offer1.title);

  // --- redeem
  check("redeem needs staff", !redeemReward(s, { code: cl.claim.code, staffId: "nobody" }, at(702)).ok);
  check("wrong reward code", !redeemReward(s, { code: "AAAA-AAAA", staffId: riya }, at(702)).ok || cl.claim.code === "AAAA-AAAA");
  const rd = redeemReward(s, { code: cl.claim.code.toLowerCase().replace("-", " "), staffId: riya }, at(702));
  check("reward redeemed (lowercase/space ok)", rd.ok);
  if (!rd.ok) return;
  const afterRedeem = rd.state;
  check("redeem records staff", rd.claim.redeemed_by === riya);
  const twice = redeemReward(afterRedeem, { code: cl.claim.code, staffId: riya }, at(703));
  check("redeem twice refused", !twice.ok && twice.code === "reward_used");

  // --- expiry
  const farFuture = new Date(T0.getTime() + 40 * 86_400_000);
  const exp = redeemReward(s, { code: cl.claim.code, staffId: riya }, farFuture);
  check("expired reward refused", !exp.ok && exp.code === "reward_expired");
  check("claimView expired", claimView(s.claims[0], farFuture) === "expired");

  // --- cancel
  const cn = cancelClaim(s, cl.claim.id, "Mistake", at(710));
  check("cancel unused reward", cn.ok);
  if (cn.ok) {
    check("cancelled reward cannot be redeemed", !redeemReward(cn.state, { code: cl.claim.code, staffId: riya }, at(711)).ok);
    check("cancel does not restore stamps", cardProgress(cn.state, mem.id).total === 3);
  }
  check("cannot cancel a used reward", !cancelClaim(afterRedeem, cl.claim.id, "x", at(711)).ok);

  // --- monthly limit
  let lim = emptyLoyaltyState();
  lim = setProgram(lim, { stamps_required: 3, min_gap_hours: 0, daily_cap: 5 });
  const lo = saveOffer(lim, { title: "Limited", description: "", kind: "free_item", monthly_limit: 1, active: true }, rng);
  if (!lo.ok) return;
  lim = lo.state;
  const ls = await addStaff(lim, { name: "Sam", pin: "4321" }, T0, rng);
  if (!ls.ok) return;
  lim = ls.state;
  for (const email of ["a@x.com", "b@x.com"]) {
    const e = ensureMember(lim, email, T0, rng); lim = e.state;
    const v = markEmailVerified(lim, e.member.id, T0); if (!v.ok) return; lim = v.state;
    for (let i = 0; i < 3; i++) {
      const cdn = issueMemberCode(lim, e.member.id, at(i), rng); if (!cdn.ok) return; lim = cdn.state;
      const g = stampWithMemberCode(lim, { code: cdn.token.code, staffId: ls.staff.id }, at(i), rng);
      if (!g.ok) { check("limit setup stamp", false, g); return; }
      lim = g.state;
    }
  }
  const [ma, mb] = lim.members;
  const claimA = claimReward(lim, { memberId: ma.id, offerId: lim.offers[0].id }, at(10), rng);
  check("first claim within monthly limit", claimA.ok);
  if (!claimA.ok) return;
  lim = claimA.state;
  check("offer hidden after monthly limit", availableOffers(lim, at(11)).length === 0);
  check("second claim refused at monthly limit", !claimReward(lim, { memberId: mb.id, offerId: lim.offers[0].id }, at(11), rng).ok);
  const nextMonth = new Date("2026-11-02T08:00:00Z");
  check("offer returns next month", availableOffers(lim, nextMonth).length === 1);

  // --- carry-over + void
  let co = emptyLoyaltyState();
  co = setProgram(co, { stamps_required: 3, min_gap_hours: 0, daily_cap: 5 });
  const cs = await addStaff(co, { name: "Zed", pin: "9999" }, T0, rng); if (!cs.ok) return; co = cs.state;
  const co1 = saveOffer(co, { title: "Cookie", description: "", kind: "free_item", monthly_limit: null, active: true }, rng); if (!co1.ok) return; co = co1.state;
  const em = ensureMember(co, "c@x.com", T0, rng); co = em.state;
  const vm = markEmailVerified(co, em.member.id, T0); if (!vm.ok) return; co = vm.state;
  for (let i = 0; i < 4; i++) {
    const cdn = issueMemberCode(co, em.member.id, at(i), rng); if (!cdn.ok) return; co = cdn.state;
    const g = stampWithMemberCode(co, { code: cdn.token.code, staffId: cs.staff.id }, at(i), rng); if (!g.ok) { check("carry setup", false, g); return; } co = g.state;
  }
  check("4 stamps = 1 full card pending", cardProgress(co, em.member.id).pending === 1);
  const cc2 = claimReward(co, { memberId: em.member.id, offerId: co.offers[0].id }, at(5), rng); if (!cc2.ok) return; co = cc2.state;
  check("extra stamp carries over", cardProgress(co, em.member.id).current === 1, cardProgress(co, em.member.id));
  const vs = voidStamp(co, co.stamps[3].id, "Test", at(6));
  check("void works", vs.ok);
  if (vs.ok) {
    check("void lowers balance", cardProgress(vs.state, em.member.id).current === 0);
    check("voided stamp stays in ledger", vs.state.stamps.length === 4 && vs.state.stamps[3].voided_at !== null);
    check("void twice refused", !voidStamp(vs.state, co.stamps[3].id, "again", at(7)).ok);
    check("activity shows voided", activityLog(vs.state, at(8)).some((a) => a.kind === "stamp_voided"));
  }
  check("void unknown stamp refused", !voidStamp(co, "nope", "x", at(6)).ok);

  // --- delete member keeps ledger, drops email and codes
  const del = deleteMember(co, em.member.id, at(9));
  check("delete removes email", del.members[0].email === null && del.members[0].deleted_at !== null);
  check("delete keeps ledger", del.stamps.length === co.stamps.length);
  check("deleted member cannot get a code", !issueMemberCode(del, em.member.id, at(10), rng).ok);

  // --- stats
  const stats = loyaltyStats(s, at(720));
  check("stats members counted", stats.members === 2);
  check("stats stamps counted", stats.stampsTotal === 3);
  check("stats rewards chosen", stats.rewardsChosen === 1);
  check("stats per staff", stats.perStaff.some((p) => p.name === "Riya" && p.stamps >= 1));
  finished = true;

}

function report() {
  if (!finished) { failed++; console.error("FAIL: script stopped early (a setup step failed)"); }
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
main().then(report, (error) => { console.error(error); process.exit(1); });
