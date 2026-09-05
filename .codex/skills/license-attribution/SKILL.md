---
name: license-attribution
description: Add or update copyright and license attribution workflows in this repository when fonts or other bundled assets require visible attribution, provenance notes, redistribution text, or copyable UI strings. Use when Codex needs to verify attribution requirements, store source/license notes under `public/fonts/`, or wire actual attribution text into the Keycap Maker UI instead of abstract warnings.
---

# License Attribution

## Canonical repository rules

Use [the development guide](../../../CONTRIBUTING.md) for quality gates and synchronization, and [the third-party inventory](../../../docs/third-party-licenses.md) for the authoritative component/license list. Font acceptance and evidence belong to [the font inventory](../../../public/fonts/README.md). Read [repo touchpoints](references/repo-touchpoints.md) for the existing UI/data plumbing.

## Task sequence

1. Establish the obligation from official source material and embedded metadata.
2. Decide whether the requirement is repository provenance, a bundled license text, visible UI attribution, copyable reuse text, or a combination.
3. Reuse the existing source-note and `requiredAttributionLines` mechanism. Do not add a parallel warning system.
4. Store literal sourced attribution text in the asset definition when it must be user-visible; keep legal evidence in the accompanying notice/provenance file.
5. Synchronize the third-party inventory and only the affected operator/manual documentation.
6. For fonts, also follow the keycap-font-addition skill and its validator.

If the license position is uncertain, record the verified evidence and unresolved condition without guessing or broadening the grant.
