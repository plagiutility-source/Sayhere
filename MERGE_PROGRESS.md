# Merge progress (Sayhere rooms -> Review SaaS)
Branch: feat/rooms-merge | Reference: _sayhere-ref/ (read-only)
- [ ] M1 copy namespaced code   - [ ] M2 gate + sidebar   - [ ] M3 real data adapter
- [ ] M4 live provider + topbar - [ ] M5 Orders + Tables pages - [ ] M6 Locations QR panel
- [ ] M7 editor tab   - [ ] M8 public table page - [ ] M9 dashboard + analytics cards
- [ ] M10 remove demo code - [ ] M11 css/storage/safety - [ ] M12 docs + CI - [ ] M13 final + PR
## Notes / stubs / decisions
- Setup: base `review-saas` @ fb10617; `_sayhere-ref/` from `origin/feat/rooms-standalone` @ 63e26ea via `git archive` (removed `reference/`, `.gitignore`, `node_modules`, `.next`); root `tsconfig.json` excludes `_sayhere-ref`.
