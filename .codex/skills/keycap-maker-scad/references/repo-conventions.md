# Current SCAD routing index

This file is an Agent routing aid, not a second copy of repository conventions.

- Development, branches, gates, generated files, and synchronization: [development guide](../../../../CONTRIBUTING.md)
- Current SCAD and export behavior: [SCAD/export contract](../../../../docs/architecture/scad-and-export.md)
- Current SCAD files and directory responsibilities: [SCAD directory guide](../../../../scad/README.md)
- Browser parameter bridge: `src/lib/keycap-scad-bundle.js`
- Shape defaults and visible groups: `src/data/keycap-shapes/*.json`
- Main SCAD entry: `scad/base/keycap.scad`
- Bundled runtime provenance and license: [OpenSCAD runtime notice](../../../../public/vendor/openscad/README.md)
- Third-party inventory: [third-party licenses](../../../../docs/third-party-licenses.md)

Before editing, resolve the current export targets and `user_*` parameters from implementation and tests. Do not use deleted roadmap/spec documents or ignored `.tmp/` outputs as current specification.
