import { readContrastSamples } from "./color-samples.js";

export class ImportBindingNotice {
  constructor(page) {
    this.root = page.locator(".import-binding-notice");
    this.list = this.root.locator(".import-binding-notice__list");
    this.names = this.root.locator(".import-binding-notice__name");
    this.values = this.root.locator(".import-binding-notice__value");
    this.toggle = this.root.locator("[data-import-binding-toggle]");
    this.deleteButtons = this.root.locator("[data-import-binding-delete]");
  }

  async toggleDetails() {
    await this.toggle.click();
  }

  async hoverDelete(index = 0) {
    await this.deleteButtons.nth(index).hover();
  }

  async deleteParam(index = 0) {
    await this.deleteButtons.nth(index).click();
  }

  async readContrastSamples() {
    return this.root.evaluate(readContrastSamples, ".import-binding-notice__copy strong, .import-binding-notice__copy span, code, .import-binding-notice__delete");
  }
}
