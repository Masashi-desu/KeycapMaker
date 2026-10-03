import { strFromU8, unzipSync, zipSync } from "fflate";
import { test, expect, readDownloadedArchive, readDownloaded3mf } from "./fixtures.js";
import { createLegacyProjectFixture } from "../support/legacy-project-fixture.js";

function replayableValues(input) {
  return input.keycaps.map(({ keycapId, updateParams, editorPayload }) => ({
    keycapId, updateParams, params: editorPayload.params, selectors: editorPayload.selectors,
  }));
}

test("旧プロジェクトを新構成で保存し、ZIPとディレクトリから同じ編集値・配置を復元する", async ({ editor, webMcp }) => {
  await editor.open();
  const legacy = createLegacyProjectFixture();
  const oldArchive = zipSync(Object.fromEntries(Object.entries(legacy.files).map(([path, bytes]) => [`Legacy Project/${path}`, bytes])));
  await editor.project.importArchive(oldArchive);
  await editor.project.importFiles(legacy.files, { directory: true, name: "Legacy Project" });
  const before = (await webMcp.execute("get_state")).data;
  expect(before.project).toMatchObject({ name: legacy.manifest.name, activeKeycapId: legacy.manifest.activeKeycapId,
    keyboard: legacy.manifest.keyboard, placements: legacy.manifest.placements });
  expect(before.project.keycaps.map((entry) => entry.id)).toEqual(legacy.manifest.keycaps.map((entry) => entry.id));
  const inputs = replayableValues((await webMcp.execute("get_input", { keycapIds: legacy.keycaps.map((entry) => entry.id) })).data);

  const uiDownload = await editor.project.save();
  const uiFiles = await readDownloadedArchive(uiDownload);
  expect(uiDownload.suggestedFilename()).toBe("Legacy Project.zip");
  const prefix = "Legacy Project/";
  const manifest = JSON.parse(strFromU8(uiFiles[`${prefix}KeycapMaker.json`]));
  expect(manifest.schemaVersion).toBe(1);
  expect(manifest.keycaps.map(({ jsonPath, threeMfPath }) => ({ jsonPath, threeMfPath }))).toEqual([
    { jsonPath: "keycaps/Esc/Esc.json", threeMfPath: "keycaps/Esc/Esc.3mf" },
    { jsonPath: "keycaps/Esc-2/Esc.json", threeMfPath: "keycaps/Esc-2/Esc.3mf" },
  ]);
  expect(Object.keys(uiFiles).sort()).toEqual([
    `${prefix}KeycapMaker.json`, `${prefix}common/keyboard.3mf`,
    ...manifest.keycaps.flatMap((entry) => [entry.jsonPath, entry.previewPath, entry.threeMfPath].map((path) => prefix + path)),
  ].sort());
  for (const [index, entry] of manifest.keycaps.entries()) {
    expect(JSON.parse(strFromU8(uiFiles[prefix + entry.jsonPath]))).toMatchObject(legacy.keycaps[index].editorDataPayload);
    expect(uiFiles[prefix + entry.previewPath].length).toBeGreaterThan(0);
    const individual = unzipSync(uiFiles[prefix + entry.threeMfPath]);
    expect(strFromU8(individual["3D/3dmodel.model"])).toContain("<mesh>");
  }
  const common = unzipSync(uiFiles[`${prefix}common/keyboard.3mf`]);
  const commonModel = strFromU8(common["3D/3dmodel.model"]);
  expect([...commonModel.matchAll(/<item objectid=/g)]).toHaveLength(3);
  const standalone = await webMcp.executeWithDownload("export", { format: "keyboard-3mf" });
  expect(standalone.result.ok).toBe(true);
  expect((await readDownloaded3mf(standalone.download))["3D/3dmodel.model"]).toBe(commonModel);
  const agentZip = await webMcp.executeWithDownload("export", { format: "project-zip" });
  expect(agentZip.result.ok).toBe(true);
  const agentFiles = await readDownloadedArchive(agentZip.download);
  expect(Object.keys(agentFiles).sort()).toEqual(Object.keys(uiFiles).sort());
  expect(strFromU8(unzipSync(agentFiles[`${prefix}common/keyboard.3mf`])["3D/3dmodel.model"])).toBe(commonModel);
  await agentZip.download.saveAs(".tmp/project-archive/new-project.zip");

  const rootFiles = Object.fromEntries(Object.entries(uiFiles).map(([path, bytes]) => [path.slice(prefix.length), bytes]));
  for (const load of [
    () => editor.project.importArchive(zipSync(uiFiles)),
    () => editor.project.importFiles(rootFiles, { directory: true, name: "Legacy Project" }),
    () => editor.project.importFiles(uiFiles),
  ]) {
    await load();
    const restored = (await webMcp.execute("get_state")).data;
    expect(restored.project).toEqual({ ...before.project, isDirty: false, status: "success",
      summary: restored.project.summary });
    expect(replayableValues((await webMcp.execute("get_input", { keycapIds: legacy.keycaps.map((entry) => entry.id) })).data)).toEqual(inputs);
    await expect(editor.project.cards).toHaveCount(2);
  }
});

test("配置済みキーがないプロジェクトは個別JSON・3MFだけを保存する", async ({ editor, webMcp }) => {
  await editor.open();
  await editor.rename("Solo");
  await editor.project.open();
  const files = await readDownloadedArchive(await editor.project.save());
  expect(Object.keys(files).some((path) => path.includes("/common/"))).toBe(false);
  const manifest = JSON.parse(strFromU8(files["Keycap Project/KeycapMaker.json"]));
  expect(manifest.keycaps[0]).toMatchObject({ jsonPath: "keycaps/Solo/Solo.json", threeMfPath: "keycaps/Solo/Solo.3mf" });
  await editor.project.importArchive(zipSync(files));
  expect((await webMcp.execute("get_state")).data.project).toMatchObject({ keyboard: null, placements: [], keycaps: [{ name: "Solo" }] });
  await webMcp.execute("set_keyboard", { layout: [["Unassigned"]] });
  const unassigned = await webMcp.executeWithDownload("export", { format: "project-zip" });
  expect(unassigned.result.ok).toBe(true);
  const unassignedFiles = await readDownloadedArchive(unassigned.download);
  expect(Object.keys(unassignedFiles).some((path) => path.includes("/common/"))).toBe(false);
  const unassignedManifest = JSON.parse(strFromU8(unassignedFiles["Keycap Project/KeycapMaker.json"]));
  expect(unassignedManifest.keyboard.keys).toHaveLength(1);
  expect(unassignedManifest.placements).toEqual([]);
});
