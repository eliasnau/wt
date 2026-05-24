# Dashboard follow-ups

Deferred items from the dashboard critique (2026-05-24). The critique fixes (German copy
consistency, experimental sidebar as default, members saved-view dialog, removal of dead
bulk actions) are done. The items below were intentionally left for a decision.

## Decisions needed

- **Delete `edit-member-sheet.tsx`** — `EditMemberSheet` is referenced nowhere and its
  "save" button does nothing (real editing lives in `update-member-details-sheet.tsx`).
  Either delete it or wire it up.
- **Column show/hide submenu** (`members-v2-controls.tsx`) — renders every column
  `checked disabled`; the feature is unbuilt. Either build column-visibility state or
  hide the submenu.
- **KPI `InfoIcon`s** (`statistics/overview/page.tsx`) — four decorative info icons imply
  tooltips that don't exist. Wire help text or remove them.
- **`finance/page.tsx`** is a bare `redirect()`, so "Finanzen" never lands on an overview.
  Decide whether to build a finance overview page.

## Notes

- No i18n extraction yet; UI strings are inline German literals (informal "du", `de-DE`
  dates). A lint rule / extraction would stop English from creeping back in.
- Overlapping in-flight branches touch the same areas (e.g.
  `t3code/translate-members-groups-stats`, `feat/member-table-controls-redesign`). Check
  for conflicts before merging.

## Pre-existing (not introduced by this work)

- `tsc` errors in `device-authorize.tsx` and `packages/auth/src/lib/push.ts`.
- Biome lint debt: `noArrayIndexKey` in the statistics chart, unused `InputGroupAddon`
  import in `members-v2-page-client.tsx`, a `<label>` without control in
  `role-permission-grid.tsx`.
