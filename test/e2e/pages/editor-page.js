import { ProjectPanel } from "./project-panel.js";
import { KeyboardPanel } from "./keyboard-panel.js";
import { ImportBindingNotice } from "./import-binding-notice.js";
import { readContrastSamples } from "./color-samples.js";

export class EditorPage {
  constructor(page) {
    this.page = page;
    this.name = page.locator('[data-field="name"]');
    this.width = page.locator('input[type="number"][data-field="keyWidth"]');
    this.shapeToggle = page.locator('[data-field-group-toggle="shape"]');
    this.designTab = page.locator('[data-sidebar-tab="design"]');
    this.designPanel = page.locator('.inspector-panel--design');
    this.previewStage = page.locator('[data-preview-stage]');
    this.previewCanvas = this.previewStage.locator('canvas');
    this.project = new ProjectPanel(page);
    this.keyboard = new KeyboardPanel(page);
    this.importReport = new ImportBindingNotice(page);
    this.themeOptions = {
      light: page.locator('[data-theme-option="light"]'),
      dark: page.locator('[data-theme-option="dark"]'),
    };
  }

  async open() {
    await this.page.goto("/");
    await this.name.waitFor({ state: "visible" });
    await this.expandShape();
  }

  async showDesign() {
    await this.designTab.click();
    await this.expandShape();
  }

  async expandShape() {
    if (await this.shapeToggle.getAttribute("aria-expanded") === "false") {
      await this.shapeToggle.click();
    }
    await this.width.waitFor({ state: "visible" });
  }

  async rename(name) {
    await this.name.fill(name);
    await this.name.blur();
  }

  async setWidth(width) {
    await this.width.fill(String(width));
    await this.width.blur();
  }

  async setTheme(theme) {
    await this.themeOptions[theme].click();
    await this.page.waitForFunction((expected) => document.documentElement.dataset.theme === expected
      && !document.documentElement.classList.contains("is-theme-transitioning"), theme);
  }

  async readInputColors() {
    return this.designPanel.evaluate(readContrastSamples, '[data-field="name"], input[type="number"][data-field="keyWidth"]');
  }

  async waitPreviewStatus(status) {
    await this.page.waitForFunction((expected) => document.querySelector('[data-preview-stage]')?.dataset.previewStatus === expected, status);
  }

  async readPreviewFrame() {
    return this.previewCanvas.evaluate((canvas) => ({ width: canvas.width, height: canvas.height, frame: canvas.dataset.previewFrame }));
  }
}
