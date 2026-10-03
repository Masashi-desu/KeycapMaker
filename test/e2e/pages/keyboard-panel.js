import { readContrastSamples } from "./color-samples.js";

export class KeyboardPanel {
  constructor(page) {
    this.page = page;
    this.tab = page.locator('[data-sidebar-tab="keyboard"]');
    this.fileInput = page.locator('[data-keyboard-files="files"]');
    this.candidates = page.locator('[data-keyboard-candidate]');
    this.slot = page.locator('[data-keyboard-slot-select]');
    this.group = page.locator('[data-keyboard-group]');
    this.assignmentCard = page.locator('[data-keyboard-assignment-card]');
    this.assignCurrentButton = this.assignmentCard.locator('[data-keyboard-assign-current]');
    this.offsetInputs = this.assignmentCard.locator('[data-keyboard-offset]');
    this.editAssignedButton = this.assignmentCard.locator('[data-keyboard-edit-assigned]');
    this.exportButton = page.locator('[data-keyboard-export]');
    this.exportIcon = this.exportButton.locator('svg');
    this.exportStatus = page.locator('[data-keyboard-export-status]');
    this.importStatus = page.locator('[data-keyboard-import-status]');
    this.previewStatus = page.locator('[data-keyboard-preview-status]');
    this.sourceStep = page.locator('[data-keyboard-step="1"]');
    this.previewButton = page.locator('.keyboard-preview-switch [data-preview-mode="keyboard"]');
    this.keycapPreviewButton = page.locator('.keyboard-preview-switch [data-preview-mode="keycap"]');
    this.inspectorPreviewButton = page.locator('.inspector-panel--keyboard [data-preview-mode="keyboard"]');
    this.dangerZone = page.locator('[data-keyboard-danger-zone]');
    this.dangerZoneToggle = this.dangerZone.locator('summary');
    this.removeButton = this.dangerZone.locator('[data-keyboard-remove]');
  }

  async importFiles(files, selectedPath) {
    await this.open();
    await this.fileInput.setInputFiles(Object.entries(files).map(([name, source]) => ({ name, mimeType: "text/plain", buffer: Buffer.from(source) })));
    await this.candidates.filter({ hasText: selectedPath }).click();
    await this.slot.waitFor({ state: "visible" });
  }

  async open() {
    await this.tab.click();
  }

  async importInvalidFile() {
    await this.open();
    await this.sourceStep.click();
    await this.fileInput.setInputFiles({ name: "invalid.json", mimeType: "application/json", buffer: Buffer.from("{invalid") });
    await this.importStatus.and(this.page.locator('.is-error')).waitFor({ state: "visible" });
    return this.importStatus.textContent();
  }

  async selectSlot(id) {
    await this.slot.selectOption(id);
  }

  async assignCurrent(id) {
    await this.selectSlot(id);
    await this.assignCurrentButton.click();
  }

  offsetInput(field) {
    return this.assignmentCard.locator(`[data-keyboard-offset="${field}"]`);
  }

  async setOffset(field, value) {
    const input = this.offsetInput(field);
    await input.fill(String(value));
    await input.blur();
  }

  async editAssigned() {
    await this.editAssignedButton.click();
  }

  async export3mf() {
    const download = this.page.waitForEvent("download");
    await this.exportButton.click();
    return download;
  }

  async showPreview() {
    await this.previewButton.click();
  }

  async showKeycapPreview() {
    await this.keycapPreviewButton.click();
  }

  async expandDangerZone() {
    if (await this.dangerZone.getAttribute("open") === null) await this.dangerZoneToggle.click();
    await this.removeButton.waitFor({ state: "visible" });
  }

  async hoverRemove() {
    await this.removeButton.hover();
  }

  async readDangerColors() {
    return this.dangerZone.evaluate(readContrastSamples, 'summary, p, [data-keyboard-remove]');
  }

  async removeLayout({ confirm }) {
    await this.expandDangerZone();
    const confirmation = this.page.waitForEvent("dialog").then(async (dialog) => {
      const result = { type: dialog.type(), message: dialog.message() };
      if (confirm) await dialog.accept();
      else await dialog.dismiss();
      return result;
    });
    await this.removeButton.click();
    return confirmation;
  }
}
