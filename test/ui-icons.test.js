import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const library = new URL("../public/keycap-ui/", import.meta.url);

test("IconYardの編集プロジェクトと配信用の一覧・SVGが一致する", async () => {
  const project = JSON.parse(await readFile(new URL("../keycap-ui.iconyard.json", import.meta.url), "utf8"));
  const manifest = JSON.parse(await readFile(new URL("icons.json", library), "utf8"));
  assert.equal(manifest.name, project.name);
  assert.ok(project.icons.length > 0);

  const entries = manifest.icons.map(({ path, ...metadata }) => metadata);
  const expectedEntries = project.icons.map(({ id, name, description, categories = [] }) => ({
    id, name, description, categories,
  }));
  assert.deepEqual(entries, expectedEntries);
  const paths = manifest.icons.map(({ path }) => path);
  assert.equal(new Set(paths).size, paths.length);
  assert.deepEqual(paths.toSorted(), (await readdir(new URL("icons/", library))).map((name) => `icons/${name}`).sort());

  for (const [index, { id, paths: editablePaths, svg }] of project.icons.entries()) {
    assert.ok(editablePaths.length > 0, id);
    assert.equal(await readFile(new URL(paths[index], library), "utf8"), svg, id);
  }
});
