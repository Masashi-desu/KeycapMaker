import workerUrl from "./openscad-worker.js?worker&url";

function resolveRuntimeUrl() {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  return new URL("vendor/openscad/openscad.js", baseUrl).toString();
}

export function runOpenScad(job) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerUrl, { type: "module" });

    worker.addEventListener("message", (event) => {
      const { data } = event;
      worker.terminate();

      if (data.ok) {
        resolve(data.result);
        return;
      }

      reject(new Error(data.error || "OpenSCAD worker failed."));
    });

    worker.addEventListener("error", (event) => {
      worker.terminate();
      reject(event.error || new Error("OpenSCAD worker crashed."));
    });

    worker.postMessage({
      runtimeUrl: resolveRuntimeUrl(),
      ...job,
    });
  });
}
