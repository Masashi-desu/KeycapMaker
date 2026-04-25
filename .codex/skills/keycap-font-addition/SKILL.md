---
name: keycap-font-addition
description: Add, update, or audit bundled legend fonts in the Keycap Maker repository. Use when Codex imports font files into `public/fonts/`, changes `src/lib/keycap-fonts.js`, verifies font redistribution or web delivery licenses, writes provenance/source notes, handles Reserved Font Names or attribution text, or prepares font changes for public GitHub Pages deployment.
---

# Keycap Font Addition

## Quick Start

1. Read `public/fonts/README.md` and `.codex/skills/license-attribution/references/repo-touchpoints.md`.
2. Accept a font only when an official source clearly permits redistribution and web delivery.
3. Prefer official project pages, upstream repositories, or embedded font metadata over third-party summaries.
4. Add unmodified font files unless the task explicitly requires conversion, subsetting, or glyph edits. If modifying a font, recheck Reserved Font Name and license terms as a separate derived font.
5. Store the font, license/terms text, and provenance note under `public/fonts/`.
6. Register the font in `src/lib/keycap-fonts.js`; add real `requiredAttributionLines` when visible attribution is required.
7. Update the human inventory in `public/fonts/README.md`.
8. Run `node .codex/skills/keycap-font-addition/scripts/validate-font-assets.mjs`.
9. Run `npm test` and `npm run build` before shipping app-visible font additions.

## Required Evidence

Each bundled font must have a `*-SOURCE.txt` note, or an equivalent terms note such as `*-MODI.txt`, with:

- source page and download/archive URL
- review date, and download date when known
- bundled filenames
- SHA-256 for every bundled file listed in the note
- license evidence from the official source and, when available, TTF name table metadata
- font metadata strings that influenced the decision
- use note explaining whether the file is unmodified and how the app uses it

For GitHub-hosted files, use commit or tag fixed raw URLs for bundled download/license URLs. A current branch URL may be kept as a source page pointer, but not as the evidence URL for a bundled file.

## License Gate

Reject or pause when any of these are true:

- redistribution or web delivery permission is unclear
- the only evidence is a font listing page, blog post, or generated summary
- the bundled license text cannot be preserved in the repo
- a modified OFL font would still use a Reserved Font Name
- the UI would need attribution but only an abstract warning is available
- the validator reports missing provenance, stale branch raw URLs, mismatched hashes, or unregistered TTFs

If the license is not OFL-like, keep the same evidence standard and make the UI behavior explicit:

- add literal attribution lines to the font definition when required
- or write `Visible attribution: not required by reviewed terms` in the provenance note when the official terms support that conclusion

## Resource Files

- `references/source-note-template.md`: copyable provenance note patterns for OFL and non-OFL fonts.
- `scripts/validate-font-assets.mjs`: repository validator for font registry, bundled files, source notes, license text, SHA-256, branch-pinned URLs, and TTF license metadata.

## Completion Checklist

Before finalizing, report:

- accepted license and source evidence
- files added or changed under `public/fonts/`
- registry entry added or changed in `src/lib/keycap-fonts.js`
- whether visible attribution is required
- validator, test, and build results
