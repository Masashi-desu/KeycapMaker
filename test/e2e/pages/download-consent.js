import { readContrastSamples } from "./color-samples.js";

export class DownloadConsent {
  constructor(page) {
    this.page = page;
    this.root = page.locator('dialog[aria-labelledby="download-consent-title"]');
    this.agreement = this.root.locator('[data-download-consent-check]');
    this.acceptButton = this.root.locator('[data-download-consent-accept]');
    this.cancelButton = this.root.getByRole('button', { name: 'キャンセル', exact: true });
    this.resources = this.root.locator('[data-download-consent-resource]');
    this.attributions = this.root.locator('[data-download-consent-attribution]');
    this.filename = this.root.locator('.download-consent-filename');
  }

  async waitForOpen() {
    await this.root.waitFor({ state: "visible" });
  }

  async accept() {
    await this.waitForOpen();
    await this.setAgreement(true);
    await this.acceptButton.click();
    await this.root.waitFor({ state: "hidden" });
  }

  async setAgreement(checked) { await this.agreement.setChecked(checked); }

  async trySubmitUnchecked() { await this.agreement.press("Enter"); }

  async tabFocusCycle() {
    const inside = [];
    for (let index = 0; index < 10; index += 1) {
      await this.page.keyboard.press(index < 5 ? "Tab" : "Shift+Tab");
      inside.push(await this.root.evaluate((dialog) => dialog.contains(document.activeElement)));
    }
    return inside;
  }

  async cancel({ escape = false } = {}) {
    if (escape) await this.agreement.press("Escape");
    else await this.cancelButton.click();
    await this.root.waitFor({ state: "hidden" });
  }

  async copyAttribution(index = 0) {
    await this.root.locator('[data-download-consent-copy]').nth(index).click();
    return this.root.locator('[data-download-consent-copy]').nth(index);
  }

  async readColors() {
    return this.root.evaluate(readContrastSamples, 'h2, h3, p, strong, a, pre, label, button:not(:disabled)');
  }

  async hoverAccept() { await this.acceptButton.hover(); }

  async capture(path) { await this.root.screenshot({ path }); }

  async readLayout() {
    return this.root.evaluate((dialog) => ({
      width: dialog.getBoundingClientRect().width,
      scrollWidth: dialog.scrollWidth, clientWidth: dialog.clientWidth,
      top: dialog.getBoundingClientRect().top,
      bottom: dialog.getBoundingClientRect().bottom,
      viewportHeight: window.innerHeight,
    }));
  }
}
