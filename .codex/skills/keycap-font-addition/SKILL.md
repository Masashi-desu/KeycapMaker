---
name: keycap-font-addition
description: Add, update, or audit bundled legend fonts in the Keycap Maker repository. Use when Codex imports font files into `public/fonts/`, changes `src/lib/keycap-fonts.js`, verifies font redistribution or web delivery licenses, writes provenance/source notes, handles Reserved Font Names or attribution text, or prepares font changes for public GitHub Pages deployment.
---

# Keycap Font Addition

## Canonical repository rules

Read these before changing a font:

1. [development guide](../../../CONTRIBUTING.md) for change classes, quality gates, generated files, and synchronization.
2. [third-party inventory](../../../docs/third-party-licenses.md) for the complete published/dependency inventory and update rule.
3. [font inventory](../../../public/fonts/README.md) for font-specific acceptance, evidence, and user-visible attribution requirements.
4. [attribution touchpoints](../license-attribution/references/repo-touchpoints.md) for implementation locations.

Do not duplicate those rules in this skill. This skill only defines the font task sequence.

## Task sequence

1. Verify redistribution and web delivery from an official project page, upstream repository, bundled terms, and TTF metadata.
2. Preserve the upstream file unmodified unless the task explicitly requires conversion, subsetting, or glyph edits. Re-evaluate Reserved Font Names for a derived font.
3. Use [the source-note template](references/source-note-template.md) and place the font, license/terms text, and provenance beside the existing bundled fonts.
4. Register the asset and, only when required, literal `requiredAttributionLines` in `src/lib/keycap-fonts.js`.
5. Update `public/fonts/README.md` and `docs/third-party-licenses.md` in the same change.
6. Run `node .codex/skills/keycap-font-addition/scripts/validate-font-assets.mjs`.
7. Apply the artifact gate from the development guide: `npm test`, `npm run lint:workflows`, and `npm run build`, plus affected manual font checks.

Pause rather than invent a license when the official evidence is incomplete, a bundled notice cannot be preserved, a modified OFL font conflicts with a Reserved Font Name, or required visible attribution text is unknown.

## Completion report

Report the official evidence, files and registry entry changed, whether visible attribution is required, and the validator/test/build results.
