const stageSelector = "[data-preview-stage]";

export class PreviewStage {
  constructor(page) {
    this.page = page;
    this.stage = page.locator(stageSelector);
    this.canvas = this.stage.locator("canvas");
    const modes = page.locator(".keyboard-preview-switch");
    this.keyboardButton = modes.locator('[data-preview-mode="keyboard"]');
    this.keycapButton = modes.locator('[data-preview-mode="keycap"]');
  }

  async showKeyboard() {
    await this.keyboardButton.click();
  }

  async showKeycap() {
    await this.keycapButton.click();
  }

  async requestId() {
    return Number(await this.stage.getAttribute("data-preview-request-id"));
  }

  async waitForStatus(status) {
    await this.stage.and(this.page.locator(`[data-preview-status="${status}"]`)).waitFor({ state: "attached" });
  }

  async waitForNextReady(previousRequest) {
    await this.page.waitForFunction(({ selector, previousRequest }) => {
      const stage = document.querySelector(selector);
      return Number(stage?.dataset.previewRequestId) > previousRequest && stage.dataset.previewStatus === "ready";
    }, { selector: stageSelector, previousRequest });
  }

  async readFrame() {
    return this.canvas.evaluate((canvas) => ({ width: canvas.width, height: canvas.height, frame: canvas.dataset.previewFrame }));
  }
}
