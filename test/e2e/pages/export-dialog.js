export class ExportDialog {
  constructor(page) {
    this.page = page;
    this.root = page.getByRole("dialog");
    this.jsonButton = this.root.locator('[data-keycap-export-format="editor-data"]');
  }

  async exportJson() {
    const download = this.page.waitForEvent("download");
    await this.jsonButton.click();
    return download;
  }
}
