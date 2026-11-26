import { ProjectPanel } from "./project-panel.js";
import { PreviewStage } from "./preview-stage.js";
import { KeyboardPanel } from "./keyboard-panel.js";
import { ImportBindingNotice } from "./import-binding-notice.js";
import { readContrastSamples } from "./color-samples.js";
import { DownloadConsent } from "./download-consent.js";

export class EditorPage {
  constructor(page) {
    this.page = page;
    this.name = page.locator('[data-field="name"]');
    this.widthSlider = page.locator('input[type="range"][data-field="keyWidth"]');
    this.widthUnits = page.locator('input[data-field="keySizeUnits"]');
    this.wallThickness = page.locator('input[type="number"][data-field="wallThickness"]');
    this.width = page.locator('input[type="number"][data-field="keyWidth"]');
    this.nameCardIcon = page.locator('[aria-labelledby="design-name-card-title"] .field-group-card__icon-symbol');
    this.shapeToggle = page.locator('[data-field-group-toggle="shape"]');
    this.keytopToggle = page.locator('[data-field-group-toggle="top"]');
    this.legendToggle = page.locator('[data-field-group-toggle="legend"]');
    this.legendPositions = page.getByRole("radiogroup", { name: "印字位置" });
    this.legendFields = page.locator("#legend-position-fields");
    this.designTab = page.locator('[data-sidebar-tab="design"]');
    this.designPanel = page.locator('.inspector-panel--design');
    this.preview = new PreviewStage(page);
    this.project = new ProjectPanel(page, this.preview);
    this.keyboard = new KeyboardPanel(page);
    this.importReport = new ImportBindingNotice(page);
    this.consent = new DownloadConsent(page);
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

  async openKeytop() {
    if (await this.keytopToggle.getAttribute("aria-expanded") === "false") await this.keytopToggle.click();
    await this.fieldIcon("topCornerRadius").waitFor({ state: "visible" });
  }

  fieldIcon(key) {
    return this.designPanel.locator(".field-heading")
      .filter({ has: this.page.locator(`[id="field-label-${key}"]`) })
      .locator(".field-leading-icon__symbol");
  }

  async openLegends() {
    if (await this.legendToggle.getAttribute("aria-expanded") === "false") await this.legendToggle.click();
    await this.legendPositions.waitFor({ state: "visible" });
  }

  legendPosition(label) {
    return this.legendPositions.getByRole("radio", { name: label, exact: true });
  }

  async selectLegendPosition(label) {
    await this.legendPosition(label).check();
  }

  async nextLegendPosition(label) {
    await this.legendPosition(label).press("ArrowRight");
  }

  legendField(key) {
    return this.legendFields.locator(`[data-field="${key}"]`);
  }

  async enableLegend(key) {
    await this.legendField(key).check();
  }

  async editLegendText(key, text) {
    await this.legendField(key).fill(text);
  }

  async rename(name) {
    await this.name.fill(name);
    await this.name.blur();
  }

  async focusWidth() {
    await this.width.focus();
  }

  async focusWidthUnits() {
    await this.widthUnits.focus();
  }

  async focusLegendText() {
    await this.legendField("legendText").focus();
  }

  async focusWallThickness() {
    await this.wallThickness.focus();
  }

  async stepWidthWithWheel(delta) {
    await this.widthSlider.hover();
    await this.page.mouse.wheel(delta, 0);
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

  async resize(width, height) { await this.page.setViewportSize({ width, height }); }
}
