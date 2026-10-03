import { ExportDialog } from "./export-dialog.js";

export class ProjectPanel {
  constructor(page) {
    this.page = page;
    this.tab = page.locator('[data-sidebar-tab="project"]');
    this.cards = page.locator("[data-project-keycap-card]");
    this.activeCard = page.locator("[data-project-keycap-card].is-active");
    this.addButton = page.locator("[data-project-add-current]");
    this.configureKeyboardButton = page.locator(".keyboard-project-summary [data-keyboard-open]");
    this.saveButton = page.locator('[data-project-save]');
    this.status = page.locator('.project-status');
    this.previewStage = page.locator('[data-preview-stage]');
  }

  entry(name) {
    return this.cards.filter({ has: this.page.getByText(name, { exact: true }).and(this.page.locator('.project-keycap-item__title-row strong')) });
  }

  async open() {
    await this.tab.click();
    await this.addButton.waitFor({ state: "visible" });
  }

  async addCurrent() {
    const count = await this.cards.count();
    await this.addButton.click();
    await this.cards.nth(count).waitFor({ state: "visible" });
  }

  async openKeyboardConfiguration() {
    await this.configureKeyboardButton.click();
  }

  async select(name) {
    await this.entry(name).locator("[data-project-keycap-select]").click();
    await this.activeCard.filter({ has: this.page.getByText(name, { exact: true }) }).waitFor({ state: "visible" });
  }

  async openExport(name) {
    await this.entry(name).locator("[data-project-keycap-export]").click();
    const dialog = new ExportDialog(this.page);
    await dialog.root.waitFor({ state: "visible" });
    return dialog;
  }

  async save() {
    const pendingDownload = this.page.waitForEvent("download");
    await this.saveButton.click();
    const download = await pendingDownload;
    await this.saveButton.waitFor({ state: "visible" });
    return download;
  }

  async importArchive(bytes, name = "Project.zip") {
    await this.importFiles({ [name]: bytes });
  }

  async importFiles(files, { directory = false, name = "Project" } = {}) {
    const previousRequest = Number(await this.previewStage.getAttribute('data-preview-request-id'));
    await this.page.evaluate(({ files, directory, name }) => {
      const dataTransfer = new DataTransfer();
      const fileMap = new Map();
      for (const [path, bytes] of files) {
        const file = new File([new Uint8Array(bytes)], path.split("/").pop());
        Object.defineProperty(file, "webkitRelativePath", { value: path });
        fileMap.set(path, file);
        dataTransfer.items.add(file);
      }
      if (directory) {
        // Only the OS file-handle boundary is simulated; the app traverses
        // nested handles and reads real File contents through its importer.
        const createHandle = (prefix, name) => ({
          kind: "directory", name,
          async getFileHandle(fileName) {
            const file = fileMap.get(`${prefix}${fileName}`);
            if (!file) throw new Error(`Missing file: ${prefix}${fileName}`);
            return { kind: "file", name: fileName, getFile: async () => file };
          },
          async getDirectoryHandle(directoryName) {
            const nextPrefix = `${prefix}${directoryName}/`;
            if (![...fileMap.keys()].some((path) => path.startsWith(nextPrefix))) throw new Error(`Missing directory: ${nextPrefix}`);
            return createHandle(nextPrefix, directoryName);
          },
        });
        Object.defineProperty(dataTransfer.items[0], "getAsFileSystemHandle", {
          value: async () => createHandle("", name),
        });
      }
      window.dispatchEvent(new DragEvent("drop", { dataTransfer, bubbles: true, cancelable: true }));
    }, { files: Object.entries(files).map(([path, bytes]) => [path, Array.from(bytes)]), directory, name });
    await this.addButton.waitFor({ state: "visible" });
    await this.page.waitForFunction((previousRequest) => {
      const stage = document.querySelector('[data-preview-stage]');
      return Number(stage?.dataset.previewRequestId) > previousRequest && stage.dataset.previewStatus === "ready";
    }, previousRequest);
  }
}
