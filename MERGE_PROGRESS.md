# Merge progress (Sayhere rooms -> Review SaaS)
Branch: feat/rooms-merge | Reference: _sayhere-ref/ (read-only)
- [x] M1 copy namespaced code   - [x] M2 gate + sidebar   - [ ] M3 real data adapter
- [ ] M4 live provider + topbar - [ ] M5 Orders + Tables pages - [ ] M6 Locations QR panel
- [ ] M7 editor tab   - [ ] M8 public table page - [ ] M9 dashboard + analytics cards
- [ ] M10 remove demo code - [ ] M11 css/storage/safety - [ ] M12 docs + CI - [ ] M13 final + PR
## Notes / stubs / decisions
- M2: gate is new `lib/category/ordering.ts` (`supportsTableOrdering` = cafe/restaurant/hotel, fail-closed for salon/gym/retail/other/unknown). Deliberately did **not** add a matrix to `lib/category/features.ts` (spec merge map suggested it, task M2 forbade it); that file is untouched.
- M2: `DashboardNavItem` gained optional `requires` + `labelByType`; nav has Orders (`/orders`) and Tables (`/rooms`, label "Rooms" for hotel) after Locations; `components/dashboard/shell.tsx` filters by `business.business_type` (both sidebar call sites). Added `OrdersIcon`/`TablesIcon`; links 404 until M5 adds the pages.
- M2 check: cafe/restaurant -> Orders+Tables, hotel -> Orders+Rooms, salon/gym/retail/other -> neither, unknown -> hidden (verified against the real nav data + gate).
- M1: copied `lib/rooms/` (incl. `vendor/qrcode`), `components/rooms/customer/`, `components/rooms/shared/`, `components/rooms/owner/` (LiveAlert, OwnerProvider, PeriodBar, WaitersCard, `modals/`, `pages/`; **not** `owner/shell/`), `scripts/rooms-rules-check.ts`, `public/rooms/` unchanged. Added dev dep `tsx ^4.23.0` and script `rooms-check`. **No stubs needed** (app `lib/brand/tokens.ts` already exports `businessPresets`; no app routes copied).
- M1: fixed a wall-clock dependency in the copied check: group 26 called `removeWaiter(...)` without the pinned `NOW`, so once the real date passed 2026-10-30 the waiter looked unloaded; it now passes `NOW` like every other time-based assertion in that file.
- Setup: base `review-saas` @ fb10617; `_sayhere-ref/` from `origin/feat/rooms-standalone` @ 63e26ea via `git archive` (removed `reference/`, `.gitignore`, `node_modules`, `.next`); root `tsconfig.json` excludes `_sayhere-ref`.
