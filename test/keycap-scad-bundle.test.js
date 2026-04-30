import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

function readRawScadDefinition(scadText, name) {
  const match = scadText.match(new RegExp(`^${name} = ([^;]+);`, "m"));
  assert.ok(match, `${name} definition should exist`);
  return match[1];
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
    assert.equal(readScadDefinition(jobScad, "user_stem_cross_chamfer"), 0);
  } finally {
    await server.close();
    restoreBrowserMocks();
  }
});

test("ステム入口の面取り量を SCAD wrapper へ渡す", async () => {
  const restoreBrowserMocks = installBrowserMocks({
    width: 120,
    actualBoundingBoxLeft: 60,
    actualBoundingBoxRight: 60,
    actualBoundingBoxAscent: 50,
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
        stemCrossChamfer: 0.25,
      },
    });
    const jobScad = files.find((file) => file.path === bundle.KEYCAP_JOB_PATH)?.content;

    assert.ok(jobScad, "keycap job SCAD should be generated");
    assert.equal(readScadDefinition(jobScad, "user_stem_cross_chamfer"), 0.25);
  } finally {
    await server.close();
    restoreBrowserMocks();
  }
});

test("ステム開始位置補正の負値を SCAD wrapper と base で保持する", async () => {
  const restoreBrowserMocks = installBrowserMocks({
    width: 120,
    actualBoundingBoxLeft: 60,
    actualBoundingBoxRight: 60,
    actualBoundingBoxAscent: 50,
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
        stemInsetDelta: -0.6,
      },
    });
    const jobScad = files.find((file) => file.path === bundle.KEYCAP_JOB_PATH)?.content;
    const baseScad = files.find((file) => file.path === bundle.KEYCAP_ENTRY_PATH)?.content;

    assert.ok(jobScad, "keycap job SCAD should be generated");
    assert.ok(baseScad, "keycap base SCAD should be included");
    assert.equal(readScadDefinition(jobScad, "user_stem_inset_delta"), -0.6);
    assert.match(baseScad, /stem_nominal_inset_for_type\(stem_type\) \+ stem_inset_delta/);
    assert.match(baseScad, /stem_clip_bottom_extension = max\(1, stem_clip_overlap - stem_inset \+ 0\.02\);/);
    assert.match(baseScad, /bottom_extension = stem_clip_bottom_extension/);
    assert.doesNotMatch(baseScad, /max\(stem_nominal_inset_for_type\(stem_type\) \+ stem_inset_delta,\s*0\)/);
    assert.doesNotMatch(baseScad, /max\(user_stem_inset,\s*0\)/);
  } finally {
    await server.close();
    restoreBrowserMocks();
  }
});

test("サイドウォール印字パラメータを SCAD wrapper へ渡す", async () => {
  const restoreBrowserMocks = installBrowserMocks({
    width: 160,
    actualBoundingBoxLeft: 80,
    actualBoundingBoxRight: 80,
    actualBoundingBoxAscent: 65,
    actualBoundingBoxDescent: 35,
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
      exportTarget: "side_legend_front",
      params: {
        ...registry.createDefaultKeycapParams("custom-shell"),
        sideLegendFrontEnabled: true,
        sideLegendFrontText: "FRONT",
        sideLegendFrontFontKey: "orbitron-regular",
        sideLegendFrontSize: 3.2,
        sideLegendFrontHeight: 0.15,
        sideLegendFrontOffsetX: 1.25,
        sideLegendFrontOffsetY: -0.5,
      },
    });
    const jobScad = files.find((file) => file.path === bundle.KEYCAP_JOB_PATH)?.content;

    assert.ok(jobScad, "keycap job SCAD should be generated");
    assert.ok(files.some((file) => file.path === "/scad/modules/sidewall_legend.scad"));
    assert.equal(readRawScadDefinition(jobScad, "export_target"), "\"side_legend_front\"");
    assert.equal(readRawScadDefinition(jobScad, "user_side_legend_front_enabled"), "true");
    assert.equal(readRawScadDefinition(jobScad, "user_side_legend_front_text"), "\"FRONT\"");
    assert.equal(readScadDefinition(jobScad, "user_side_legend_front_text_size"), 3.2);
    assert.equal(readScadDefinition(jobScad, "user_side_legend_front_height"), 0.15);
    assert.doesNotMatch(jobScad, /^user_side_legend_front_embed = /m);
    assert.equal(readScadDefinition(jobScad, "user_side_legend_front_offset_x"), 1.25);
    assert.equal(readScadDefinition(jobScad, "user_side_legend_front_offset_y"), -0.5);
  } finally {
    await server.close();
    restoreBrowserMocks();
  }
});

test("キートップ四隅の印字パラメータを SCAD wrapper へ渡す", async () => {
  const restoreBrowserMocks = installBrowserMocks({
    width: 140,
    actualBoundingBoxLeft: 70,
    actualBoundingBoxRight: 70,
    actualBoundingBoxAscent: 55,
    actualBoundingBoxDescent: 25,
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
      exportTarget: "top_legend_right_top",
      params: {
        ...registry.createDefaultKeycapParams("custom-shell"),
        topLegendRightTopEnabled: true,
        topLegendRightTopText: "2",
        topLegendRightTopFontKey: "orbitron-regular",
        topLegendRightTopSize: 3.2,
        topLegendRightTopHeight: 0.2,
        topLegendRightTopEmbed: 0.4,
        topLegendRightTopOffsetX: 0.75,
        topLegendRightTopOffsetY: -0.25,
      },
    });
    const jobScad = files.find((file) => file.path === bundle.KEYCAP_JOB_PATH)?.content;
    const baseScad = files.find((file) => file.path === bundle.KEYCAP_ENTRY_PATH)?.content;

    assert.ok(jobScad, "keycap job SCAD should be generated");
    assert.ok(baseScad, "keycap base SCAD should be included");
    assert.equal(readRawScadDefinition(jobScad, "export_target"), "\"top_legend_right_top\"");
    assert.equal(readRawScadDefinition(jobScad, "user_top_legend_right_top_enabled"), "true");
    assert.equal(readRawScadDefinition(jobScad, "user_top_legend_right_top_text"), "\"2\"");
    assert.equal(readScadDefinition(jobScad, "user_top_legend_right_top_text_size"), 3.2);
    assert.equal(readScadDefinition(jobScad, "user_top_legend_right_top_height"), 0.2);
    assert.equal(readScadDefinition(jobScad, "user_top_legend_right_top_embed"), 0.4);
    assert.equal(readScadDefinition(jobScad, "user_top_legend_right_top_offset_x"), 0.75);
    assert.equal(readScadDefinition(jobScad, "user_top_legend_right_top_offset_y"), -0.25);
    assert.match(baseScad, /module keycap_top_legend_right_top/);
    assert.match(baseScad, /resolved_export_target == "top_legend_right_top"/);
    assert.match(baseScad, /top_legend_anchor_offset_ratio = 0\.25;/);
    assert.match(baseScad, /keycap_top_legends_visible_volume\(quality\);/);
  } finally {
    await server.close();
    restoreBrowserMocks();
  }
});

test("サイドウォール印字本体は内側面で止める", async () => {
  const baseScad = await readFile(new URL("../scad/base/keycap.scad", import.meta.url), "utf8");

  assert.match(baseScad, /function keycap_sidewall_wall_depth\(side, axis_z\)/);
  assert.match(baseScad, /below_surface = keycap_sidewall_wall_depth\(side, axis_z\) \+ max\(inner_overlap, 0\);/);
  assert.doesNotMatch(baseScad, /side_legend_through_wall_embed\s*=\s*wall_thickness\s*\+/);
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

test("custom shell の上面Rを SCAD wrapper へ渡す", async () => {
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
        topCornerRadius: 2.5,
        topCornerRadiusIndividualEnabled: true,
        topCornerRadiusLeftTop: 1,
        topCornerRadiusRightTop: 2,
        topCornerRadiusRightBottom: 3,
        topCornerRadiusLeftBottom: 4,
      },
    });
    const jobScad = files.find((file) => file.path === bundle.KEYCAP_JOB_PATH)?.content;

    assert.ok(jobScad, "keycap job SCAD should be generated");
    assert.equal(readScadDefinition(jobScad, "user_top_corner_radius"), 2.5);
    assert.equal(readRawScadDefinition(jobScad, "user_top_corner_individual_enabled"), "true");
    assert.equal(readRawScadDefinition(jobScad, "user_top_corner_radii"), "[1, 2, 3, 4]");
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
