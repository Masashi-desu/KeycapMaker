import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createEditorParameterSchema, createKeycapWebMcpTools, registerKeycapWebMcp, validateToolInput, WebMcpError } from "../src/lib/webmcp.js";

function fixture(overrides = {}) {
  const calls = [];
  const commands = {
    isBusy: () => false,
    getParameterSchema: () => ({ keyWidth: { type: "number" }, legendEnabled: { type: "boolean" } }),
    getState: () => ({ params: { keyWidth: 18 }, userText: "user content" }),
    ...Object.fromEntries(["getCatalog", "updateKeycap", "project", "importEditor", "setKeyboard", "assign", "setView", "preview", "export"].map((name) => [name, async (...args) => { calls.push({ name, args }); return { completed: true }; }])),
    ...overrides,
  };
  const tools = createKeycapWebMcpTools(commands);
  return { tools, calls, run: (name, input, options) => tools.find((tool) => tool.name === `keycap_${name}`).execute(input, options) };
}

test("tools route typed arguments to commands and return serializable completed results", async () => {
  const { tools, calls, run } = fixture();
  assert.equal(new Set(tools.map((tool) => tool.name)).size, tools.length);
  const cases = [
    ["get_catalog", { section: "fields" }, "getCatalog"],
    ["update", { params: { keyWidth: 19, legendEnabled: true } }, "updateKeycap"],
    ["project", { action: "select", keycapId: "a" }, "project"],
    ["import_editor", { payload: { params: { legendText: "A" } } }, "importEditor"],
    ["set_keyboard", { layout: [["A", "B"]] }, "setKeyboard"],
    ["assign", { slotId: "key-0", keycapId: "a" }, "assign"],
    ["set_view", { tab: "project" }, "setView"],
    ["preview", {}, "preview"],
    ["export", { format: "3mf" }, "export"],
  ];
  for (const [name, input, command] of cases) {
    const result = await run(name, input);
    assert.deepEqual(result, { ok: true, contractVersion: 1, data: { completed: true } });
    assert.equal(calls.at(-1).name, command);
    assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
  }
  assert.deepEqual(calls[1].args[0], cases[1][1].params);
  assert.equal(calls.at(-1).args[0], "3mf");
  const read = await run("get_state", {});
  assert.equal(read.data.params.keyWidth, 18);
  for (const name of ["keycap_get_state", "keycap_get_catalog"]) {
    assert.equal(tools.find((tool) => tool.name === name).annotations.readOnlyHint, true);
    assert.equal(tools.find((tool) => tool.name === name).annotations.untrustedContentHint, true);
  }
  assert.equal(tools.find((tool) => tool.name === "keycap_export").annotations.consequentialHint, true);
  assert.ok(tools.every((tool) => tool.annotations.untrustedContentHint), "all results may contain user-supplied names or text");
});

test("every published tool stays documented in the operation contract", () => {
  const contract = fs.readFileSync(new URL("../docs/architecture/webmcp.md", import.meta.url), "utf8");
  const documented = [...contract.matchAll(/^\| `([^`]+)` \|/gmu)].map((match) => match[1]);
  assert.deepEqual(documented.sort(), fixture().tools.map((tool) => tool.name).sort());
});

test("invalid, unknown, oversized and mistyped inputs never reach commands", async () => {
  const { calls, run } = fixture();
  const cases = [
    ["update", { params: { keyWidth: "19" } }], ["update", { params: { keyWidth: NaN } }],
    ["update", { params: { legendEnabled: "false" } }], ["update", { params: { unknown: 1 } }],
    ["update", { params: {} }], ["update", { params: { keyWidth: 19 }, extra: true }],
    ["get_catalog", { section: "fonts", query: "x".repeat(201) }],
    ["get_catalog", { section: "icons", limit: 101 }], ["get_catalog", { section: "icons", limit: 1.5 }],
    ["export", { format: "obj" }], ["export", {}], ["set_view", {}],
    ["set_keyboard", { layout: null }], ["set_keyboard", { layout: "file:///private" }],
    ["import_editor", { payload: [] }], ["get_state", null], ["get_state", { accidental: true }],
  ];
  for (const [name, input] of cases) {
    const result = await run(name, input);
    assert.equal(result.ok, false, `${name}: ${JSON.stringify(input)}`);
    assert.equal(result.error.code, "invalid_input");
  }
  assert.equal(calls.length, 0);
});

test("schema tracks new fields while draft-specific bounds and choices remain dynamic", () => {
  const fields = [
    { key: "futureDimension", label: "Future", unit: "mm", description: "New field", schema: { type: "number", minimum: 0, maximum: 4 } },
    { key: "futureSelector", label: "Selector", description: "Changes with font", schema: { type: "string", enum: ["old"] } },
    { key: "color", label: "Color", description: "Hex", schema: { type: "string", pattern: "^#[0-9a-fA-F]{6}$", maxLength: 7 } },
  ];
  const schema = createEditorParameterSchema(fields);
  assert.equal(schema.futureDimension.type, "number");
  assert.equal(schema.futureDimension.minimum, undefined);
  assert.equal(schema.futureSelector.enum, undefined);
  assert.doesNotThrow(() => validateToolInput("new-font-style", schema.futureSelector));
  assert.throws(() => validateToolInput("red", schema.color), /invalid string format/);
  assert.throws(() => validateToolInput(5, fields[0].schema), /maximum/);
  assert.throws(() => validateToolInput(-1, fields[0].schema), /minimum/);
});

test("mutations cannot overlap; reads remain available and lock releases after failure", async () => {
  let finish;
  const { run, calls } = fixture({ preview: () => new Promise((resolve) => { finish = resolve; }) });
  const pending = run("preview", {});
  assert.equal((await run("update", { params: { keyWidth: 20 } })).error.code, "busy");
  assert.equal((await run("get_state", {})).ok, true);
  assert.equal(calls.length, 0);
  finish({ complete: true });
  await pending;
  assert.equal((await run("update", { params: { keyWidth: 20 } })).ok, true);
  const broken = fixture({ export: () => { throw new WebMcpError("export_failed", "WASM failed"); } });
  assert.equal((await broken.run("export", { format: "3mf" })).error.code, "export_failed");
  assert.equal((await broken.run("update", { params: { keyWidth: 20 } })).ok, true);
  assert.equal((await fixture({ isBusy: () => true }).run("preview", {})).error.code, "busy");
});

test("canceled operations never start and cancellation signal reaches long commands", async () => {
  const controller = new AbortController();
  controller.abort();
  const { calls, run } = fixture();
  await assert.rejects(run("export", { format: "3mf" }, { signal: controller.signal }), { name: "AbortError" });
  assert.equal(calls.length, 0);
  const active = new AbortController();
  await run("export", { format: "3mf" }, { signal: active.signal });
  assert.equal(calls.at(-1).args[1].signal, active.signal);
});

test("cancellation during an asynchronous command rejects completion and releases the mutation lock", async () => {
  let finish;
  const controller = new AbortController();
  const { run } = fixture({ project: () => new Promise((resolve) => { finish = resolve; }) });
  const pending = run("project", { action: "add" }, { signal: controller.signal });
  const canceled = assert.rejects(pending, { name: "AbortError" });
  controller.abort();
  finish({ completed: true });
  await canceled;
  assert.equal((await run("update", { params: { keyWidth: 20 } })).ok, true);
});

test("unsupported browser is a no-op; document API takes precedence and disposes by signal", async () => {
  const { tools } = fixture();
  assert.equal((await registerKeycapWebMcp(tools, { document: {}, navigator: {} }).ready).status, "unsupported");
  const registered = new Map();
  const context = { async registerTool(tool, { signal }) {
    registered.set(tool.name, tool);
    signal.addEventListener("abort", () => registered.delete(tool.name), { once: true });
  } };
  const registration = registerKeycapWebMcp(tools, {
    document: { modelContext: context },
    navigator: { modelContext: { registerTool() { assert.fail("legacy API must not be used"); } } },
  });
  assert.deepEqual(await registration.ready, { status: "registered", toolCount: tools.length });
  assert.equal(registered.size, tools.length);
  registration.dispose();
  registration.dispose();
  assert.equal(registered.size, 0);
  const second = registerKeycapWebMcp(tools, { document: { modelContext: context }, navigator: {} });
  assert.equal((await second.ready).status, "registered");
  second.dispose();
});

test("early navigator API has targeted cleanup; partial registration failure rolls back owned tools", async () => {
  const { tools } = fixture();
  const names = new Set(["other_app_tool"]);
  let errors = 0;
  const context = {
    registerTool(tool) {
      if (tool.name === "keycap_update") throw new Error("registration denied");
      names.add(tool.name);
    },
    unregisterTool(name) { names.delete(name); },
  };
  const registration = registerKeycapWebMcp(tools, { document: {}, navigator: { modelContext: context }, onError: () => { errors++; } });
  assert.equal((await registration.ready).status, "error");
  assert.deepEqual([...names], ["other_app_tool"]);
  assert.equal(errors, 1);
});

test("dispose during async registration does not leak legacy tools", async () => {
  const names = new Set();
  let finish;
  const { tools } = fixture();
  const registration = registerKeycapWebMcp(tools, { document: {}, navigator: { modelContext: {
    registerTool(tool) { return new Promise((resolve) => { finish = () => { names.add(tool.name); resolve(); }; }); },
    unregisterTool(name) { names.delete(name); },
  } } });
  registration.dispose();
  finish();
  assert.equal((await registration.ready).status, "disposed");
  assert.equal(names.size, 0);
});
