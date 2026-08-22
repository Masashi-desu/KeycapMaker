---
name: keycap-maker-scad
description: Extend and maintain Keycap Maker's modular OpenSCAD assets under `scad/` and the browser parameter bridge that feeds them. Use when Codex needs to work on this repository's keycap-specific structure, including body/legend split, preview/export separation, `scad/base` vs `scad/modules` placement, presets, samples, or the `src/lib/keycap-scad-bundle.js` `-D` parameter mapping.
---

# Keycap Maker SCAD

## Canonical repository rules

Read [the development guide](../../../docs/guide/development.md), [SCAD/export contract](../../../docs/architecture/scad-and-export.md), [SCAD directory guide](../../../scad/README.md), and [current routing index](references/repo-conventions.md). Those documents own common structure, quality gates, and synchronization.

## Task sequence

1. Inspect the current entrypoint, adjacent module, shape JSON, bridge mapping, and existing tests before choosing a layer.
2. Keep whole-key/export orchestration in `scad/base/`, reusable geometry in `scad/modules/`, SCAD nominal constants in `scad/presets/`, and regression fixtures in `scad/samples/`.
3. If an app parameter changes, synchronize shape JSON, `src/lib/keycap-scad-bundle.js`, SCAD `user_*` mapping, architecture documentation, and tests.
4. Preserve preview/export and separate-volume contracts defined by the architecture document.
5. Apply the artifact gate and only the affected manual geometry/export checks from the development guide.

Mention any requested behavior that intentionally changes an existing geometry or export contract.
