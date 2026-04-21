# Keycap Maker SCAD Conventions

## Project Constraints

- Host as a static app on GitHub Pages.
- Keep geometry generation client-side.
- Use a bundled browser OpenSCAD runtime rather than a server-side CAD service.
- Treat color-only 3MF workflows as uncertain; keep separate-body workflows viable.
- Preserve the distinction between preview-focused geometry and export-focused geometry.

## Runtime Baseline In This Repo

- `public/vendor/openscad/README.md` says the bundled runtime came from `OpenSCAD-2025.03.25.wasm24456-WebAssembly-web.zip`.
- `src/lib/keycap-scad-bundle.js` passes `--backend=manifold` to the runtime.
- Local `openscad` CLI is not guaranteed to exist, so prefer repo-proven language features and conservative structure.

## Directory Responsibilities

- `scad/base/`: export entries and whole-part orchestration.
- `scad/modules/`: reusable geometry such as shells, legends, stems, or profile-specific pieces.
- `scad/presets/`: default dimensions and parameter sets that bridge UI and geometry.
- `scad/samples/`: regression fixtures and minimal reproducible examples.
- `src/lib/keycap-scad-bundle.js`: the browser-side file bundle and `-D` parameter bridge.

## Current Pattern

- `scad/base/keycap.scad` is the main entry.
- It uses:
  - `include <../presets/standard-1u.scad>` for defaults.
  - `use <../modules/keycap_shell.scad>`, `legend_block.scad`, and `stem_socket.scad` for reusable geometry.
- It exposes `export_target` with `preview`, `body`, and `legend`.
- It maps `user_*` overrides onto normalized geometry values.
- It keeps `keycap_body()`, `keycap_legend()`, and `preview_model()` separate.

## Extension Rules

- New reusable shape or profile logic belongs in `scad/modules/`.
- New export orchestration or whole-key behavior belongs in `scad/base/`.
- New default sets belong in `scad/presets/`.
- Any non-trivial geometry change should add or update a file in `scad/samples/`.
- If a parameter is exposed in the app, inspect `src/lib/keycap-scad-bundle.js` so the `-D` bridge stays aligned.

## Body / Legend Rules

- Keep body and legend aligned by a stable shared origin.
- Treat legend geometry as a distinct volume unless the task explicitly calls for engraving or direct union.
- Make legend thickness, offsets, and Z anchoring explicit.
- Do not rely on color metadata alone to preserve manufacturing intent.

## Preview / Export Rules

- Preview may simplify geometry or lower tessellation.
- Export must prioritize dimensional correctness.
- If preview and export diverge materially, keep separate entry modules or branches rather than hiding behavior in scattered conditionals.

## Font Rules

- The roadmap explicitly treats `text()` and font packaging as a later, explicit concern.
- If you add `text()`, specify the font path or name and document where the font comes from.
- Leave final font-license confirmation to the human reviewer.

## Relevant Repo Docs

- `/Users/workSpace/Keycap Maker/README.md`
- `/Users/workSpace/Keycap Maker/scad/README.md`
- `/Users/workSpace/Keycap Maker/docs/research/scad-design-guidelines.md`
- `/Users/workSpace/Keycap Maker/docs/specs/operations-guide.md`
- `/Users/workSpace/Keycap Maker/public/vendor/openscad/README.md`
