import { ExportDialog } from "./export-dialog.js";

export class ProjectPanel {
  constructor(page) {
    this.page = page;
    this.tab = page.locator('[data-sidebar-tab="project"]');
    this.cards = page.locator("[data-project-keycap-card]");
    this.activeCard = page.locator("[data-project-keycap-card].is-active");
    this.addButton = page.locator("[data-project-add-current]");
    this.configureKeyboardButton = page.locator(".keyboard-project-summary [data-keyboard-open]");
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
}
