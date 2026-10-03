import test from "node:test";
import assert from "node:assert/strict";
import { waitForPreviewCompletion } from "../src/lib/preview-completion.js";

test("display wait returns the completed frame or propagates rendering failure", async () => {
  assert.deepEqual(await waitForPreviewCompletion(Promise.resolve({ rendered: true })), { rendered: true });
  await assert.rejects(waitForPreviewCompletion(Promise.reject(new Error("WebGL failed"))), /WebGL failed/);
});

test("display wait rejects on timeout without claiming shared work is finished", async () => {
  let finish;
  const work = new Promise((resolve) => { finish = resolve; });
  await assert.rejects(waitForPreviewCompletion(work, { timeoutMs: 5 }), { code: "preview_timeout" });
  finish({ rendered: true });
  assert.deepEqual(await work, { rendered: true });
});

test("abort ends a pending or already cancelled wait and still observes late worker failures", async () => {
  const controller = new AbortController();
  let fail;
  const work = new Promise((_, reject) => { fail = reject; });
  const waiting = waitForPreviewCompletion(work, { signal: controller.signal });
  controller.abort();
  await assert.rejects(waiting, { name: "AbortError" });
  fail(new Error("late worker failure"));
  await assert.rejects(waitForPreviewCompletion(Promise.resolve({ rendered: true }), { signal: controller.signal }), { name: "AbortError" });
});
