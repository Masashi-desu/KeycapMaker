import test from "node:test";
import assert from "node:assert/strict";
import { collectDownloadResources, DownloadConsentGate } from "../src/lib/download-consent.js";

test("download resources deduplicate renderable fonts and icon sets across target keycaps", () => {
  const fonts = { default: { key: "default", licenseLabel: "OFL" }, local: { key: "local", licenseLabel: "" } };
  const icons = { icons: { key: "icons", licenseLabel: "CC BY 4.0" } };
  const fields = [
    { font: "font", contentType: "type", iconSet: "icons", isRenderable: (params) => params.mainVisible },
    { font: "sideFont", contentType: "sideType", iconSet: "sideIcons", isRenderable: (params) => params.sideVisible },
  ];
  const resources = collectDownloadResources([
    { mainVisible: true, sideVisible: true, font: "default", sideFont: "local" },
    { mainVisible: true, sideVisible: true, font: "default", sideType: "icon", sideIcons: "icons" },
    { mainVisible: true, sideVisible: true, type: "icon", icons: "icons", sideFont: "local" },
    { mainVisible: false, sideVisible: false, font: "unused", sideFont: "unused" },
  ], fields, { resolveFont: (key) => fonts[key], resolveIconSet: (key) => icons[key] });
  assert.deepEqual(resources, [
    { kind: "font", asset: fonts.default }, { kind: "font", asset: fonts.local }, { kind: "icon", asset: icons.icons },
  ]);
  assert.deepEqual(collectDownloadResources([], fields, {}), []);
  assert.deepEqual(collectDownloadResources([{}], fields, {}), [], "absent legend objects never resolve unused assets");
});

test("download cannot consume an absent or fabricated consent grant", () => {
  const gate = new DownloadConsentGate();
  assert.equal(gate.pending, false);
  for (const grant of [null, undefined, {}, true]) assert.throws(() => gate.consume(grant), /requires consent/);
  const controller = new AbortController();
  controller.abort();
  assert.throws(() => gate.request("", { signal: controller.signal }), { name: "AbortError" });
  assert.equal(gate.pending, false);
});
