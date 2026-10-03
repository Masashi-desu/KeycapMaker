import { WebMcpError } from "./webmcp.js";

// Cancels the wait, not the shared UI/worker job. Always observe the original
// promise so a late worker failure cannot become an unhandled rejection.
export function waitForPreviewCompletion(promise, { signal, timeoutMs = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    let timer;
    const cleanup = () => { clearTimeout(timer); signal?.removeEventListener("abort", abort); };
    const abort = () => { cleanup(); reject(signal.reason ?? new DOMException("Aborted", "AbortError")); };
    Promise.resolve(promise).then((value) => { cleanup(); resolve(value); }, (error) => { cleanup(); reject(error); });
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener("abort", abort, { once: true });
    timer = setTimeout(() => { cleanup(); reject(new WebMcpError("preview_timeout", "Preview display is still pending. Read keycap_get_state and retry.")); }, timeoutMs);
  });
}
