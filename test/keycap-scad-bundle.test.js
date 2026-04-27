import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const PROJECT_ROOT = fileURLToPath(new URL("../", import.meta.url));

function installBrowserMocks(textMetrics) {
  const previousDocument = globalThis.document;
  const previousFetch = globalThis.fetch;
  const previousFontFace = globalThis.FontFace;
  const previousWindow = globalThis.window;

  globalThis.document = {
    createElement(tagName) {
      if (tagName !== "canvas") {
        return {};
      }

      return {
        getContext() {
          return {
            font: "",
            measureText() {
              return textMetrics;
            },
          };
        },
      };
    },
    fonts: {
      add() {},
    },
  };
  globalThis.fetch = async () => ({
    ok: true,
    async arrayBuffer() {
      return new ArrayBuffer(0);
    },
  });
  globalThis.FontFace = class {
    async load() {
      return this;
    }
  };
  globalThis.window = {
    location: {
      origin: "http://localhost",
    },
  };

  return () => {
    globalThis.document = previousDocument;
    globalThis.fetch = previousFetch;
    globalThis.FontFace = previousFontFace;
    globalThis.window = previousWindow;
  };
}

function readScadDefinition(scadText, name) {
  const match = scadText.match(new RegExp(`^${name} = ([^;]+);`, "m"));
  assert.ok(match, `${name} definition should exist`);
  return Number(match[1]);
}

test("印字の作業領域は実測した複数文字の外形を含む", async () => {
  const restoreBrowserMocks = installBrowserMocks({
    width: 240,
    actualBoundingBoxLeft: 122,
    actualBoundingBoxRight: 118,
    actualBoundingBoxAscent: 72,
    actualBoundingBoxDescent: 58,
  });
  const server = await createServer({
    root: PROJECT_ROOT,
    appType: "custom",
    logLevel: "silent",
    server: {
      middlewareMode: true,
    },
  });

  try {
    const [bundle, registry] = await Promise.all([
      server.ssrLoadModule("/src/lib/keycap-scad-bundle.js"),
      server.ssrLoadModule("/src/data/keycap-shape-registry.js"),
    ]);
    const files = await bundle.createKeycapFiles({
      exportTarget: "preview",
      params: {
        ...registry.createDefaultKeycapParams("custom-shell"),
        legendText: "薔薇",
        legendFontKey: "kurobara-cinderella-regular",
      },
    });
    const jobScad = files.find((file) => file.path === bundle.KEYCAP_JOB_PATH)?.content;

    assert.ok(jobScad, "keycap job SCAD should be generated");
    const textSize = readScadDefinition(jobScad, "user_legend_text_size");

    assert.equal(textSize, 5);
    assert.ok(readScadDefinition(jobScad, "user_legend_width") > textSize);
    assert.ok(readScadDefinition(jobScad, "user_legend_depth") > textSize);
  } finally {
    await server.close();
    restoreBrowserMocks();
  }
});

test("印字作業領域はキーの footprint を上限にしない", async () => {
  const restoreBrowserMocks = installBrowserMocks({
    width: 120,
    actualBoundingBoxLeft: 60,
    actualBoundingBoxRight: 60,
    actualBoundingBoxAscent: 70,
    actualBoundingBoxDescent: 30,
  });
  const server = await createServer({
    root: PROJECT_ROOT,
    appType: "custom",
    logLevel: "silent",
    server: {
      middlewareMode: true,
    },
  });

  try {
    const [bundle, registry] = await Promise.all([
      server.ssrLoadModule("/src/lib/keycap-scad-bundle.js"),
      server.ssrLoadModule("/src/data/keycap-shape-registry.js"),
    ]);
    const files = await bundle.createKeycapFiles({
      exportTarget: "preview",
      params: {
        ...registry.createDefaultKeycapParams("custom-shell"),
        keyWidth: 36,
        keyDepth: 18,
        legendSize: 10,
        legendText: "デジタル",
      },
    });
    const jobScad = files.find((file) => file.path === bundle.KEYCAP_JOB_PATH)?.content;

    assert.ok(jobScad, "keycap job SCAD should be generated");
    assert.equal(readScadDefinition(jobScad, "user_legend_text_size"), 10);
    assert.ok(readScadDefinition(jobScad, "user_legend_width") > 36);
    assert.ok(readScadDefinition(jobScad, "user_legend_depth") > 18);
  } finally {
    await server.close();
    restoreBrowserMocks();
  }
});

test("正方形キーの topScale は上面を正方形のまま縮める", async () => {
  const restoreBrowserMocks = installBrowserMocks({
    width: 120,
    actualBoundingBoxLeft: 60,
    actualBoundingBoxRight: 60,
    actualBoundingBoxAscent: 70,
    actualBoundingBoxDescent: 30,
  });
  const server = await createServer({
    root: PROJECT_ROOT,
    appType: "custom",
    logLevel: "silent",
    server: {
      middlewareMode: true,
    },
  });

  try {
    const [bundle, registry] = await Promise.all([
      server.ssrLoadModule("/src/lib/keycap-scad-bundle.js"),
      server.ssrLoadModule("/src/data/keycap-shape-registry.js"),
    ]);
    const keyWidth = 18;
    const keyDepth = 18;
    const topCenterHeight = 9.5;
    const topScale = 0.5;
    const files = await bundle.createKeycapFiles({
      exportTarget: "preview",
      params: {
        ...registry.createDefaultKeycapParams("custom-shell"),
        keyWidth,
        keyDepth,
        topCenterHeight,
        topScale,
      },
    });
    const jobScad = files.find((file) => file.path === bundle.KEYCAP_JOB_PATH)?.content;

    assert.ok(jobScad, "keycap job SCAD should be generated");
    const frontAngle = readScadDefinition(jobScad, "user_profile_front_angle");
    const leftAngle = readScadDefinition(jobScad, "user_profile_left_angle");
    const topWidth = keyWidth - topCenterHeight * Math.tan(leftAngle * Math.PI / 180) * 2;
    const topDepth = keyDepth - topCenterHeight * Math.tan(frontAngle * Math.PI / 180) * 2;

    assert.ok(Math.abs(frontAngle - leftAngle) < 1e-9);
    assert.ok(Math.abs(topWidth - keyWidth * topScale) < 1e-9);
    assert.ok(Math.abs(topDepth - keyDepth * topScale) < 1e-9);
  } finally {
    await server.close();
    restoreBrowserMocks();
  }
});

test("typewriter の上面基準高さを SCAD wrapper へ渡す", async () => {
  const restoreBrowserMocks = installBrowserMocks({
    width: 120,
    actualBoundingBoxLeft: 60,
    actualBoundingBoxRight: 60,
    actualBoundingBoxAscent: 70,
    actualBoundingBoxDescent: 30,
  });
  const server = await createServer({
    root: PROJECT_ROOT,
    appType: "custom",
    logLevel: "silent",
    server: {
      middlewareMode: true,
    },
  });

  try {
    const [bundle, registry] = await Promise.all([
      server.ssrLoadModule("/src/lib/keycap-scad-bundle.js"),
      server.ssrLoadModule("/src/data/keycap-shape-registry.js"),
    ]);
    const files = await bundle.createKeycapFiles({
      exportTarget: "preview",
      params: {
        ...registry.createDefaultKeycapParams("typewriter"),
        typewriterMountHeight: 14.2,
        topOffsetX: 1.5,
        topOffsetY: -2.25,
      },
    });
    const jobScad = files.find((file) => file.path === bundle.KEYCAP_JOB_PATH)?.content;

    assert.ok(jobScad, "keycap job SCAD should be generated");
    assert.equal(readScadDefinition(jobScad, "user_typewriter_mount_height"), 14.2);
    assert.equal(readScadDefinition(jobScad, "user_top_offset_x"), 1.5);
    assert.equal(readScadDefinition(jobScad, "user_top_offset_y"), -2.25);
  } finally {
    await server.close();
    restoreBrowserMocks();
  }
});

test("JISエンターの geometry と欠き込み寸法を SCAD wrapper へ渡す", async () => {
  const restoreBrowserMocks = installBrowserMocks({
    width: 120,
    actualBoundingBoxLeft: 60,
    actualBoundingBoxRight: 60,
    actualBoundingBoxAscent: 70,
    actualBoundingBoxDescent: 30,
  });
  const server = await createServer({
    root: PROJECT_ROOT,
    appType: "custom",
    logLevel: "silent",
    server: {
      middlewareMode: true,
    },
  });

  try {
    const [bundle, registry] = await Promise.all([
      server.ssrLoadModule("/src/lib/keycap-scad-bundle.js"),
      server.ssrLoadModule("/src/data/keycap-shape-registry.js"),
    ]);
    const files = await bundle.createKeycapFiles({
      exportTarget: "preview",
      params: {
        ...registry.createDefaultKeycapParams("jis-enter"),
        jisEnterNotchWidth: 4.5,
        jisEnterNotchDepth: 18,
      },
    });
    const jobScad = files.find((file) => file.path === bundle.KEYCAP_JOB_PATH)?.content;

    assert.ok(jobScad, "keycap job SCAD should be generated");
    assert.match(jobScad, /^user_shape_geometry_type = "jis_enter";/m);
    assert.equal(readScadDefinition(jobScad, "user_jis_enter_notch_width"), 4.5);
    assert.equal(readScadDefinition(jobScad, "user_jis_enter_notch_depth"), 18);
  } finally {
    await server.close();
    restoreBrowserMocks();
  }
});

test("対応形状の top-hat パラメータを SCAD wrapper へ渡す", async () => {
  const restoreBrowserMocks = installBrowserMocks({
    width: 120,
    actualBoundingBoxLeft: 60,
    actualBoundingBoxRight: 60,
    actualBoundingBoxAscent: 70,
    actualBoundingBoxDescent: 30,
  });
  const server = await createServer({
    root: PROJECT_ROOT,
    appType: "custom",
    logLevel: "silent",
    server: {
      middlewareMode: true,
    },
  });

  try {
    const [bundle, registry] = await Promise.all([
      server.ssrLoadModule("/src/lib/keycap-scad-bundle.js"),
      server.ssrLoadModule("/src/data/keycap-shape-registry.js"),
    ]);
    const customFiles = await bundle.createKeycapFiles({
      exportTarget: "preview",
      params: {
        ...registry.createDefaultKeycapParams("custom-shell"),
        topHatEnabled: true,
        topHatTopWidth: 11.2,
        topHatTopDepth: 9.4,
        topHatTopRadius: 1.3,
        topHatHeight: 1.1,
        topHatShoulderAngle: 50,
        topHatShoulderRadius: 0.7,
      },
    });
    const recessedFiles = await bundle.createKeycapFiles({
      exportTarget: "preview",
      params: {
        ...registry.createDefaultKeycapParams("custom-shell"),
        topHatEnabled: true,
        topHatHeight: -0.8,
        topHatShoulderRadius: -0.4,
      },
    });
    const jisFiles = await bundle.createKeycapFiles({
      exportTarget: "preview",
      params: {
        ...registry.createDefaultKeycapParams("jis-enter"),
        topHatEnabled: true,
        topHatInset: 2.2,
        topHatTopRadius: 1.4,
        topHatHeight: 1.2,
        topHatShoulderAngle: 55,
        topHatShoulderRadius: 0.5,
      },
    });
    const customJobScad = customFiles.find((file) => file.path === bundle.KEYCAP_JOB_PATH)?.content;
    const recessedJobScad = recessedFiles.find((file) => file.path === bundle.KEYCAP_JOB_PATH)?.content;
    const jisJobScad = jisFiles.find((file) => file.path === bundle.KEYCAP_JOB_PATH)?.content;

    assert.ok(customJobScad, "custom shell job SCAD should be generated");
    assert.ok(recessedJobScad, "custom shell recessed top-hat job SCAD should be generated");
    assert.ok(jisJobScad, "JIS Enter job SCAD should be generated");
    assert.match(customJobScad, /^user_shape_geometry_type = "shell";/m);
    assert.match(customJobScad, /^user_top_hat_enabled = true;/m);
    assert.equal(readScadDefinition(customJobScad, "user_top_hat_top_width"), 11.2);
    assert.equal(readScadDefinition(customJobScad, "user_top_hat_top_depth"), 9.4);
    assert.equal(readScadDefinition(customJobScad, "user_top_hat_top_radius"), 1.3);
    assert.equal(readScadDefinition(customJobScad, "user_top_hat_height"), 1.1);
    assert.equal(readScadDefinition(customJobScad, "user_top_hat_shoulder_angle"), 50);
    assert.equal(readScadDefinition(customJobScad, "user_top_hat_shoulder_radius"), 0.7);
    assert.equal(readScadDefinition(recessedJobScad, "user_top_hat_height"), -0.8);
    assert.equal(readScadDefinition(recessedJobScad, "user_top_hat_shoulder_radius"), -0.4);
    assert.match(jisJobScad, /^user_shape_geometry_type = "jis_enter";/m);
    assert.match(jisJobScad, /^user_top_hat_enabled = true;/m);
    assert.equal(readScadDefinition(jisJobScad, "user_top_hat_inset"), 2.2);
    assert.equal(readScadDefinition(jisJobScad, "user_top_hat_top_radius"), 1.4);
    assert.equal(readScadDefinition(jisJobScad, "user_top_hat_height"), 1.2);
    assert.equal(readScadDefinition(jisJobScad, "user_top_hat_shoulder_angle"), 55);
    assert.equal(readScadDefinition(jisJobScad, "user_top_hat_shoulder_radius"), 0.5);
  } finally {
    await server.close();
    restoreBrowserMocks();
  }
});

test("タイプライターJISエンターの geometry と mount / 欠き込み寸法を SCAD wrapper へ渡す", async () => {
  const restoreBrowserMocks = installBrowserMocks({
    width: 120,
    actualBoundingBoxLeft: 60,
    actualBoundingBoxRight: 60,
    actualBoundingBoxAscent: 70,
    actualBoundingBoxDescent: 30,
  });
  const server = await createServer({
    root: PROJECT_ROOT,
    appType: "custom",
    logLevel: "silent",
    server: {
      middlewareMode: true,
    },
  });

  try {
    const [bundle, registry] = await Promise.all([
      server.ssrLoadModule("/src/lib/keycap-scad-bundle.js"),
      server.ssrLoadModule("/src/data/keycap-shape-registry.js"),
    ]);
    const files = await bundle.createKeycapFiles({
      exportTarget: "preview",
      params: {
        ...registry.createDefaultKeycapParams("typewriter-jis-enter"),
        typewriterMountHeight: 14.2,
        jisEnterNotchWidth: 4.5,
        jisEnterNotchDepth: 18,
      },
    });
    const jobScad = files.find((file) => file.path === bundle.KEYCAP_JOB_PATH)?.content;

    assert.ok(jobScad, "keycap job SCAD should be generated");
    assert.match(jobScad, /^user_shape_geometry_type = "typewriter_jis_enter";/m);
    assert.equal(readScadDefinition(jobScad, "user_typewriter_mount_height"), 14.2);
    assert.equal(readScadDefinition(jobScad, "user_jis_enter_notch_width"), 4.5);
    assert.equal(readScadDefinition(jobScad, "user_jis_enter_notch_depth"), 18);
  } finally {
    await server.close();
    restoreBrowserMocks();
  }
});
