/**
 * Runtime check for the category gate (no test runner in this repo yet).
 * Run:  npx tsx scripts/category-check.ts
 * Exits with code 1 if any check fails. Covers C1 to C20.
 */
import {
  CATEGORY_LABELS,
  TYPES_BY_CATEGORY,
  categoryOfType,
  type CategoryBusinessType,
} from "../lib/category/types";
import { normalizeCategory } from "../lib/category/features";
import { canConfirmCategory, categoryTextMatches } from "../lib/category/confirm";
import {
  looksFakeName, validateBusinessName, validateDeclaredUnits, validateFssai,
  validateGstin, validateLicence, validateOnboarding, validatePhone, validatePincode,
} from "../lib/category/proof";
import {
  guardBusinessPatch, migrateLegacyCategory,
} from "../lib/category/lock";
import {
  CATEGORY_CARDS, CATEGORY_POPUP_COPY, settingsLockText,
} from "../lib/category/copy";

let passed = 0;
let failed = 0;
function check(name: string, condition: boolean, extra?: unknown) {
  if (condition) passed++;
  else {
    failed++;
    console.error("FAIL:", name, extra ?? "");
  }
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const OPENED = new Date("2026-10-24T10:00:00.000Z");
const at = (ms: number) => new Date(OPENED.getTime() + ms);

const FOOD_INPUT = {
  category: "food", business_name: "Brew and Bean", business_type: "cafe",
  address_line: "12 MG Road", city: "Pune", pincode: "400001",
  phone: "9876543210", google_review_url: "https://g.page/r/brew-and-bean",
  fssai: "12345678901234", declared_tables: 12,
};
const HOTEL_INPUT = {
  category: "hotel", business_name: "Hotel Sai Palace", business_type: "hotel",
  address_line: "45 Station Road", city: "Mumbai", pincode: "400001",
  phone: "9876543210", google_review_url: "https://g.page/r/hotel-sai-palace",
  declared_rooms: 20, registration_type: "gstin",
  registration_number: "27AAPFU0939F1ZV",
};
const GENERAL_INPUT = {
  category: "general", business_name: "Studio Nine", business_type: "salon",
  address_line: "9 Linking Road", city: "Mumbai", pincode: "400050",
  phone: "9876543210", google_review_url: "https://g.page/r/studio-nine",
};

function main() {
  // C2 — accepted typed text.
  for (const typed of [
    "Restaurant & Café", "restaurant & cafe", "RESTAURANT AND CAFÉ",
    "  Restaurant   &   Café  ",
  ]) check(`C2 food accepts ${JSON.stringify(typed)}`, categoryTextMatches("food", typed));
  check("C2 hotel accepts hotel", categoryTextMatches("hotel", "hotel"));
  check("C2 hotel padded", categoryTextMatches("hotel", " HOTEL "));
  check("C2 general name", categoryTextMatches("general", "other business"));

  // C3 — rejected typed text.
  for (const typed of ["restaurant", "cafe", "hotel", "food", "", "Hotel!", "  "]) {
    check(`C3 food rejects ${JSON.stringify(typed)}`, !categoryTextMatches("food", typed));
  }
  check("C3 hotel rejects Hotel!", !categoryTextMatches("hotel", "Hotel!"));
  check("C3 general rejects internal value", !categoryTextMatches("general", "general"));

  // C4 — the 3 second guard.
  check("C4 too soon", same(
    canConfirmCategory({ category: "food", typed: "Restaurant & Café", openedAt: OPENED, now: at(2999) }),
    { ok: false, code: "too_soon" },
  ));
  check("C4 ok at 3000ms", canConfirmCategory({
    category: "food", typed: "Restaurant & Café", openedAt: OPENED, now: at(3000),
  }).ok);
  check("C4 mismatch", same(
    canConfirmCategory({ category: "food", typed: "hotel", openedAt: OPENED, now: at(5000) }),
    { ok: false, code: "text_mismatch" },
  ));

  // C5 — type mapping covers every type exactly once.
  const expectedType: Record<CategoryBusinessType, "food" | "hotel" | "general"> = {
    cafe: "food", restaurant: "food", hotel: "hotel",
    salon: "general", gym: "general", retail: "general", other: "general",
  };
  for (const [type, category] of Object.entries(expectedType)) {
    check(`C5 ${type} -> ${category}`, categoryOfType(type) === category);
  }
  const allTypes = Object.values(TYPES_BY_CATEGORY).flat();
  check("C5 seven types", allTypes.length === 7);
  check("C5 types unique", new Set(allTypes).size === 7);
  check("C5 labels", CATEGORY_LABELS.food === "Restaurant & Café" &&
    CATEGORY_LABELS.hotel === "Hotel" && CATEGORY_LABELS.general === "Other business");

  // C6 — the category lock guard.
  const current = {
    business_category: "food", category_confirm_text: "Restaurant & Café",
    category_confirmed_at: "2026-10-24T10:00:00.000Z", business_type: "cafe",
  };
  check("C6 category locked", same(
    guardBusinessPatch(current, { business_category: "hotel" }),
    { ok: false, code: "category_locked" },
  ));
  check("C6 text locked", !guardBusinessPatch(current, { category_confirm_text: "Hotel" }).ok);
  check("C6 time locked", !guardBusinessPatch(current, { category_confirmed_at: "2027" }).ok);
  check("C6 type outside", same(
    guardBusinessPatch(current, { business_type: "hotel" }),
    { ok: false, code: "type_not_in_category" },
  ));
  check("C6 type inside", guardBusinessPatch(current, { business_type: "restaurant" }).ok);
  check("C6 other fields", guardBusinessPatch(current, { name: "New name" }).ok);
  check("C6 same category", guardBusinessPatch(current, { business_category: "food" }).ok);

  // C10 — legacy migration.
  const legacy: Array<[string, "food" | "hotel" | "general"]> = [
    ["cafe", "food"], ["restaurant", "food"], ["hotel", "hotel"],
    ["salon", "general"], ["gym", "general"], ["retail", "general"], ["other", "general"],
  ];
  for (const [type, category] of legacy) {
    const once = migrateLegacyCategory({ business_type: type, name: "Legacy" });
    check(`C10 ${type} category`, once.business_category === category);
    check(`C10 ${type} legacy text`, once.category_confirm_text === "legacy");
    check(`C10 ${type} pending`, once.verification_status === "pending");
    check(`C10 ${type} idempotent`, same(migrateLegacyCategory(once), once));
  }
  check("C10 demo approved", migrateLegacyCategory({ business_type: "cafe" }, true).verification_status === "approved");
  const already = migrateLegacyCategory({
    business_type: "cafe", business_category: "food",
    category_confirm_text: "Restaurant & Café", category_confirmed_at: "2026-10-24",
    verification_status: "approved",
  });
  check("C10 existing untouched", already.business_category === "food" && already.verification_status === "approved");

  // C11 — names.
  for (const name of ["aaaa", "1234", "!!", "test", "Demo"]) {
    check(`C11 rejects ${JSON.stringify(name)}`, !validateBusinessName(name).ok);
  }
  for (const name of ["Test Kitchen", "Brew and Bean", "Hotel Sai Palace"]) {
    check(`C11 accepts ${name}`, validateBusinessName(name).ok);
  }
  check("C11 fake detector", looksFakeName("qwerty") && !looksFakeName("Test Kitchen"));
  check("C11 too short", !validateBusinessName("a").ok);

  // C12 — proof formats.
  check("C12 fssai 14", validateFssai("12345678901234").ok);
  check("C12 fssai 13", !validateFssai("1234567890123").ok);
  check("C12 fssai 15", !validateFssai("123456789012345").ok);
  check("C12 fssai letters", !validateFssai("1234567890123a").ok);
  check("C12 gstin", validateGstin("27AAPFU0939F1ZV").ok);
  check("C12 gstin lowercase", !validateGstin("27aapfu0939f1zv").ok);
  check("C12 licence", validateLicence("MH/TOUR/2026/01").ok);
  check("C12 phone", validatePhone("9876543210").ok);
  check("C12 phone prefix", !validatePhone("1234567890").ok);
  check("C12 phone short", !validatePhone("987654321").ok);
  check("C12 pin", validatePincode("400001").ok);
  check("C12 pin leading zero", !validatePincode("040001").ok);
  check("C12 pin short", !validatePincode("40001").ok);
  check("C12 tables 0", !validateDeclaredUnits("tables", 0).ok);
  check("C12 tables 201", !validateDeclaredUnits("tables", 201).ok);
  check("C12 rooms 500", validateDeclaredUnits("rooms", 500).ok);
  check("C12 rooms 501", !validateDeclaredUnits("rooms", 501).ok);

  // C13 — the settings line for the locked category.
  check("C13 settings text", settingsLockText("hotel").includes("Hotel"));

  // C14 — fail closed for an unreadable category.
  for (const bad of [undefined, null, "", "FOOD", "admin", 42]) {
    check(`C14 normalize ${String(bad)}`, normalizeCategory(bad) === "general");
  }
  check("C14 normalize unknown", normalizeCategory("FOOD") === "general");

  // C16 — the onboarding gate.
  check("C16 honeypot", !validateOnboarding({ ...FOOD_INPUT, company_website: "spam.example" }).ok);
  check("C16 food proof required", Boolean(validateOnboarding({ ...FOOD_INPUT, fssai: "" }).errors.fssai));
  check("C16 hotel proof required", Boolean(validateOnboarding({
    ...HOTEL_INPUT, registration_type: "", registration_number: "",
  }).errors.registration));
  check("C16 valid food", validateOnboarding(FOOD_INPUT).ok);
  check("C16 valid hotel", validateOnboarding(HOTEL_INPUT).ok);
  check("C16 valid general", validateOnboarding(GENERAL_INPUT).ok);
  check("C16 type outside", !validateOnboarding({ ...HOTEL_INPUT, business_type: "cafe" }).ok);
  check("C16 bad google link", !validateOnboarding({
    ...FOOD_INPUT, google_review_url: "https://example.com/review",
  }).ok);

  check("copy food card", CATEGORY_CARDS.food.label === "Restaurant & Café");
  check("copy popup headline", CATEGORY_POPUP_COPY.headline === "Choose your category wisely");
  check("copy general no rooms", CATEGORY_CARDS.general.doesNotGet.includes("Hotel rooms"));

  console.log(`\n${passed} checks passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main();
