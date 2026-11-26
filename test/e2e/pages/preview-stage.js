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

  async waitForReplacementCanvas() {
    await this.stage.evaluate((stage) => new Promise((resolve) => {
      const previous = stage.querySelector("canvas");
      const observer = new MutationObserver(() => {
        const canvas = stage.querySelector("canvas");
        if (canvas && canvas !== previous) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(stage, { childList: true });
    }));
  }

  async hoverModelCenter() {
    const bounds = await this.canvas.boundingBox();
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height / 2;
    await this.page.mouse.move(x, y);
    return { x, y };
  }

  async zoomIn() {
    await this.hoverModelCenter();
    await this.page.mouse.wheel(0, -110);
  }

  async holdOrbit() {
    const center = await this.hoverModelCenter();
    await this.page.mouse.down();
    return center;
  }

  async releaseOrbit() {
    await this.page.mouse.up();
  }

  async orbit() {
    const { x, y } = await this.holdOrbit();
    await this.page.mouse.move(x + 65, y - 90, { steps: 10 });
    await this.releaseOrbit();
  }

  async readModelImage() {
    return this.canvas.evaluate((canvas) => {
      const sample = document.createElement("canvas");
      sample.width = sample.height = 64;
      const side = Math.min(canvas.width, canvas.height);
      sample.getContext("2d").drawImage(canvas,
        (canvas.width - side) / 2, (canvas.height - side) / 2, side, side, 0, 0, 64, 64);
      return sample.toDataURL();
    });
  }

  async readModelWidth() {
    return this.canvas.evaluate((canvas) => {
      const row = document.createElement("canvas");
      row.width = canvas.width;
      row.height = 1;
      const context = row.getContext("2d");
      context.drawImage(canvas, 0, Math.floor(canvas.height / 2), canvas.width, 1, 0, 0, row.width, 1);
      const { data } = context.getImageData(0, 0, row.width, 1);
      let opaquePixels = 0;
      for (let alpha = 3; alpha < data.length; alpha += 4) {
        if (data[alpha] > 127) opaquePixels++;
      }
      return opaquePixels;
    });
  }

  async readFrame() {
    return this.canvas.evaluate((canvas) => ({ width: canvas.width, height: canvas.height, frame: canvas.dataset.previewFrame }));
  }
}
