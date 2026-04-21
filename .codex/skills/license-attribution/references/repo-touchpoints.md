# License Attribution Touchpoints

## Primary Files

- `src/lib/keycap-scad-bundle.js`
  Font registry for legend fonts. Add attribution data here when the UI must expose real text.
- `src/main.js`
  Font picker rendering and copy-to-clipboard behavior for attribution text.
- `src/styles.css`
  Attribution card styling.
- `public/fonts/README.md`
  Human-readable inventory of bundled fonts and license files.
- `public/fonts/*.txt`
  Provenance notes, upstream notices, and bundled license texts.
- `docs/guide/manual-verification.md`
  Manual checks for visible attribution and copy flow.
- `docs/decisions/decision-log.md`
  Repo-level decisions about attribution patterns.

## Current Pattern For Visible Attribution

1. Put actual user-facing attribution text in `requiredAttributionLines` on the font definition.
2. In `src/main.js`, render the selected font’s attribution card from that data.
3. Provide a copy button so the operator can reuse the exact text.
4. Keep source evidence in `public/fonts/<Name>-*.txt`.

## Current Pattern For Evidence Gathering

- Check the official download page first.
- If a font file is bundled locally, inspect name table values such as:
  - copyright strings
  - version
  - license description
- Preserve the observed strings in the provenance note when they inform the final attribution text.

## Non-Goals

- This repo skill does not provide legal advice.
- It should not invent broader obligations than the official source or embedded metadata supports.
