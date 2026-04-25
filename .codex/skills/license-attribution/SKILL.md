---
name: license-attribution
description: Add or update copyright and license attribution workflows in this repository when fonts or other bundled assets require visible attribution, provenance notes, redistribution text, or copyable UI strings. Use when Codex needs to verify attribution requirements, store source/license notes under `public/fonts/`, or wire actual attribution text into the Keycap Maker UI instead of abstract warnings.
---

# License Attribution

## Quick Start

1. Use this skill when the task involves bundled fonts or assets whose license requires copyright or license text to be preserved, shown, copied, or redistributed.
2. Read [references/repo-touchpoints.md](references/repo-touchpoints.md) before editing attribution-related files.
3. For adding, updating, or auditing bundled legend fonts, also use `$keycap-font-addition` and run `.codex/skills/keycap-font-addition/scripts/validate-font-assets.mjs`.
4. Confirm which obligation is needed:
   - provenance only in repo files
   - bundled license text in `public/fonts/`
   - visible attribution in the UI
   - copyable attribution text for reuse in docs or exports
5. Prefer official sources for license confirmation: the creator site, the upstream repository, or the font metadata embedded in the file.

## Repo Rules

- Do not show abstract warnings such as “license may be required” when the repo can instead show the actual attribution text the user needs.
- For bundled fonts, keep provenance and source URLs in a dedicated text file under `public/fonts/`.
- When the UI needs to expose attribution, store the actual lines in `src/lib/keycap-fonts.js` and render them from data.
- Preserve the distinction between:
  - legal source notes kept in repo files
  - user-facing attribution text shown in the app
- If the license position is uncertain, document the evidence gathered and leave final legal judgment to the human reviewer.

## Change Workflow

1. Verify the license from official materials and the asset metadata when available.
2. Record provenance in `public/fonts/<Name>-*.txt`:
   - source page
   - archive or download URL
   - download date
   - bundled filenames
   - relevant metadata such as copyright strings or license notice fields
3. If attribution must be user-visible, add explicit text lines to the asset definition rather than synthesizing them at render time.
4. Wire the UI to show or copy the real attribution text only for the selected asset that needs it.
5. Update `public/fonts/README.md` and `docs/guide/manual-verification.md` when the operator workflow changes.
6. Update `docs/decisions/decision-log.md` only when the repo-wide attribution pattern changes.

## Output Expectations

- Prefer additive changes to existing attribution plumbing over a second parallel mechanism.
- Keep attribution strings short, literal, and sourced from the official page or embedded metadata.
- When visible attribution is required, expose copyable text rather than a reminder to go look it up elsewhere.
- Mention what source established the attribution text and what still needs human review, if anything.
