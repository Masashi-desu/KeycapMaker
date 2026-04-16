function makeDirRecursive(fs, absolutePath) {
  const segments = absolutePath.split("/").filter(Boolean);
  let current = "";

  for (const segment of segments) {
    current += `/${segment}`;
    try {
      fs.mkdir(current);
    } catch (error) {
      if (!`${error}`.includes("File exists")) {
        throw error;
      }
    }
  }
}

self.addEventListener("message", async (event) => {
  const { runtimeUrl, files, args, outputPaths = [] } = event.data;

  try {
    const { default: OpenSCAD } = await import(runtimeUrl);
    const logs = [];
    const instance = await OpenSCAD({
      noInitialRun: true,
      print(text) {
        logs.push({ stream: "stdout", text });
      },
      printErr(text) {
        logs.push({ stream: "stderr", text });
      },
    });

    const start = performance.now();

    for (const file of files) {
      const pathSegments = file.path.split("/").filter(Boolean);
      if (pathSegments.length > 1) {
        makeDirRecursive(instance.FS, `/${pathSegments.slice(0, -1).join("/")}`);
      }
      instance.FS.writeFile(file.path, file.content);
    }

    const exitCode = instance.callMain(args);
    const elapsedMs = performance.now() - start;

    const outputs = outputPaths.map((path) => {
      const bytes = instance.FS.readFile(path);
      return {
        path,
        bytes,
      };
    });

    const transfer = outputs.map((output) => output.bytes.buffer);

    self.postMessage(
      {
        ok: true,
        result: {
          exitCode,
          elapsedMs,
          logs,
          outputs,
        },
      },
      transfer,
    );
  } catch (error) {
    self.postMessage({
      ok: false,
      error: `${error}`,
    });
  }
});
