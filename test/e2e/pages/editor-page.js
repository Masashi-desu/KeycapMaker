import { ProjectPanel } from "./project-panel.js";

export class EditorPage {
  constructor(page) {
    this.page = page;
    this.name = page.locator('[data-field="name"]');
    this.width = page.locator('input[type="number"][data-field="keyWidth"]');
    this.shapeToggle = page.locator('[data-field-group-toggle="shape"]');
    this.designTab = page.locator('[data-sidebar-tab="design"]');
    this.project = new ProjectPanel(page);
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

  async rename(name) {
    await this.name.fill(name);
    await this.name.blur();
  }

  async setWidth(width) {
    await this.width.fill(String(width));
    await this.width.blur();
  }
}
