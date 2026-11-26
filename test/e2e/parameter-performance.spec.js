import { writeFile } from "node:fs/promises";
import { test, expect } from "./fixtures.js";
import { changedValue, legendPrefix, parameterCases, prerequisites, unitFields } from "./support/parameter-cases.js";

// Trace recording serializes the large editor DOM on each action and distorts timings.
test.use({ trace: "off", viewport: { width: 1024, height: 768 } });

test("全形状の編集カタログとUI専用の単位入力を測定対象に含む", async ({ editor, webMcp }) => {
  await editor.open();
  const shapes = await webMcp.execute("get_catalog", { section: "shapes" });
  expect(shapes.ok).toBe(true);
  const keys = new Set(["keyUnitMm", ...Object.keys(unitFields)]);
  for (const { value: shapeProfile } of shapes.data) {
    const catalog = await webMcp.execute("get_catalog", { section: "fields", shapeProfile });
    expect(catalog.ok).toBe(true);
    for (const { key } of catalog.data) keys.add(key);
  }
  expect(parameterCases.map(item => item.key).sort()).toEqual([...keys].sort());
});

async function measure(panel, completion, budgetMs) {
  try {
    const elapsedMs = await panel.elapsedSinceEdit(await completion);
    return { status: elapsedMs >= 0 && elapsedMs <= budgetMs ? "PASS" : "FAIL", elapsedMs, budgetMs };
  } catch (error) {
    return { status: "FAIL", elapsedMs: null, budgetMs, error: error.message };
  }
}

// Display-only edits should use the existing model, including after the preview debounce.
async function measureDisplayOnlyPreview(preview, webMcp, previousRequest) {
  const observationMs = 3000;
  const metric = { elapsedMs: null, budgetMs: null, maxRequests: 0, observationMs };
  try {
    const requests = await preview.countRequestsAfterEdit(previousRequest, observationMs);
    const state = await webMcp.execute("get_state");
    if (!state.ok) throw new Error(state.error.message);
    const { geometry, display } = state.data.preview;
    const current = geometry.isCurrent && geometry.status === "success" && display.status === "ready" && display.rendered;
    return { ...metric, status: requests === 0 && current ? "PASS" : "FAIL", requests, current };
  } catch (error) {
    return { ...metric, status: "FAIL", requests: null, error: error.message };
  }
}

for (const item of parameterCases) {
  const { key, group } = item;
  test(`パラメータ操作時間 / ${key}`, async ({ editor, webMcp }, testInfo) => {
    await editor.open();
    await editor.preview.waitForStatus("ready");
    let initial = await webMcp.execute("get_state");
    expect(initial.ok, JSON.stringify(initial.error)).toBe(true);
    const setup = prerequisites(item);
    const before = initial.data.observedParams;
    // Switching profiles can reset values that were already correct in the previous profile.
    const params = setup.shapeProfile && setup.shapeProfile !== before.shapeProfile ? setup
      : Object.fromEntries(Object.entries(setup).filter(([field, value]) => before[field] !== value));
    if (Object.keys(params).length) {
      initial = await webMcp.execute("update", { params });
      expect(initial.ok, JSON.stringify(initial.error)).toBe(true);
      // Let setup's own preview finish before the edit's request and timers are observed.
      await editor.preview.waitForStatus("ready");
    }
    await editor.parameters.reveal(group, key, legendPrefix(key));
    const observed = initial.data.observedParams;
    const primary = unitFields[key] ?? key;
    const basis = Number(await editor.parameters.control("keyUnitMm").inputValue());
    const current = key === "keyUnitMm" ? basis : observed[primary];
    const value = changedValue(key, current);
    const expected = unitFields[key] ? value * basis : value;
    expect(current).not.toEqual(expected);
    const { commit, displayLabel } = await editor.parameters.prepareEdit(key, value);
    const previousRequest = await editor.preview.requestId();
    const readParams = await webMcp.observedParamsReader();
    const valueBudget = typeof value === "number" ? 250 : 1500;
    const modelBudget = group === "topHat" ? 15000 : 10000;
    const uiOnly = key === "topSlopeInputMode" || key === "keyUnitMm";
    const displayed = editor.parameters.waitForDisplayedValues({
      key, value, displayLabel, basis: key === "keyUnitMm" ? value : basis, unitFields, readParams,
    }, valueBudget + 5000);

    // Both observers share the input event's timestamp. A timeout or overrun
    // on one endpoint must still leave a measured verdict for the other one.
    const [inspector, model, actionError] = await Promise.all([
      measure(editor.parameters, displayed, valueBudget),
      uiOnly ? measureDisplayOnlyPreview(editor.preview, webMcp, previousRequest)
        : measure(editor.parameters, editor.preview.waitForNextReady(previousRequest, { timeout: modelBudget + 15000 }), modelBudget),
      commit().then(() => null, error => error),
    ]);
    await readParams.dispose();
    const measurement = { key, profile: item.profile, inspector, model };
    await writeFile(testInfo.outputPath("measurement.json"), JSON.stringify(measurement, null, 2) + "\n");
    for (const [label, metric] of [["画面反映", inspector], ["モデル描画", model]]) {
      const timing = metric.budgetMs === null
        ? ` ${metric.requests ?? "未確認"} / 0 描画要求（${metric.observationMs} ms観測、現行モデルの表示 ${metric.current ? "完了" : "未確認"}）`
        : ` ${metric.elapsedMs?.toFixed(1) ?? "未完了"} / ${metric.budgetMs} ms`;
      console.log(`${key} ${label}: ${metric.status}${timing}`);
      expect.soft(metric.status, `${key} ${label}${timing} ${metric.error ?? ""}`).not.toBe("FAIL");
    }
    if (actionError) throw actionError;

    if (key === "keyUnitMm") {
      await expect(editor.parameters.control(key)).toHaveValue(String(value));
    } else {
      const state = await webMcp.execute("get_state");
      expect(state.ok).toBe(true);
      const actual = state.data.observedParams[primary];
      if (typeof expected === "number") expect(actual).toBeCloseTo(expected, 4);
      else expect(actual).toEqual(expected);
    }
  });
}
