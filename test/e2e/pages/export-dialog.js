import { DownloadConsent } from "./download-consent.js";

export class ExportDialog {
  constructor(page) {
    this.page = page;
    this.root = page.locator('[role="dialog"][aria-labelledby="keycap-export-title"]');
    this.jsonButton = this.root.locator('[data-keycap-export-format="editor-data"]');
    this.consent = new DownloadConsent(page);
    this.status = this.root.locator('.keycap-export-dialog__status');
    this.closeButton = this.root.locator('[data-keycap-export-close]');
  }

  async requestJson() {
    await this.jsonButton.click();
    await this.consent.waitForOpen();
  }

  async close() {
    await this.closeButton.click();
    await this.root.waitFor({ state: "hidden" });
  }

  async exportJson() {
    const download = this.page.waitForEvent("download");
    await this.requestJson();
    await this.consent.accept();
    return download;
  }
}
