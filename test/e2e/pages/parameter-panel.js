export class ParameterPanel {
  constructor(page) {
    this.page = page;
    this.panel = page.locator(".inspector-panel--design");
  }

  control(key) {
    if (key === "keyUnitMm") return this.panel.locator("input[type=number][data-key-unit-mm]");
    return this.panel.locator(`[data-field="${key}"]:not([type=range])`);
  }

  async expand(group) {
    const toggle = this.panel.locator(`[data-field-group-toggle="${group}"]`);
    if (await toggle.getAttribute("aria-expanded") === "false") await toggle.click();
  }

  async reveal(group, key, legendPrefix) {
    if (group) await this.expand(group);
    if (group === "legend") {
      await this.panel.locator(`input[type=radio][data-preview-field="${legendPrefix}Enabled"]`).check();
    }
    if (["stemOuterDelta", "stemCrossMargin", "stemCrossChamfer"].includes(key)) await this.expand("stem-card-clearance");
  }

  async startSliderDrag(key, fraction) {
    const slider = this.panel.locator(`input[type=range][data-field="${key}"]`);
    await slider.scrollIntoViewIfNeeded();
    const track = await slider.boundingBox();
    const move = position => this.page.mouse.move(track.x + track.width * position, track.y + track.height / 2);
    await move(fraction);
    await this.page.mouse.down();
    return { slider, move, release: () => this.page.mouse.up() };
  }

  // Open pickers and scroll before the clock starts. The returned action commits the new value.
  async prepareEdit(key, value) {
    let control = this.control(key);
    let event = "input";
    let edit;
    let displayLabel = value;
    if (key.endsWith("FontKey") || key.endsWith("IconName")) {
      const picker = key.endsWith("FontKey") ? "font" : "icon";
      await this.panel.locator(`[data-${picker}-picker-open="${key}"]`).click();
      control = this.panel.locator(`[data-${picker}-picker-option="${value}"]`);
      if (picker === "font") displayLabel = await control.locator(".font-picker-option__preview").innerText();
      event = "click";
      edit = () => control.click();
    } else if (key === "jStemLp01PreviewColor") {
      control = this.panel.locator(`input[data-field="${key}"][value="${value}"]`);
      edit = () => control.locator("..").click();
    } else if (typeof value === "boolean") {
      // The visible switch is the wrapping label, including the icon over the input.
      edit = () => control.locator("..").click();
    } else if (await control.evaluate(element => element.tagName === "SELECT")) {
      edit = () => control.selectOption(value);
    } else {
      edit = () => control.fill(String(value));
    }
    await control.scrollIntoViewIfNeeded();
    await control.evaluate((element, event) => {
      element.addEventListener(event, e => performance.mark("parameter-edit", { startTime: e.timeStamp }),
        { capture: true, once: true });
    }, event);
    return { commit: edit, displayLabel };
  }

  async waitForDisplayedValues(edit, timeout) {
    return this.page.evaluate(async ({ key, value, displayLabel, basis, unitFields, readParams, timeout }) => {
      function mismatch(params) {
        const primary = unitFields[key] ?? key;
        const expected = unitFields[key] ? value * basis : value;
        if (key !== "keyUnitMm") {
          const actual = params[primary];
          const matches = typeof expected === "number"
            ? Number.isFinite(actual) && Math.abs(actual - expected) < 0.00005 : actual === expected;
          if (!matches) return `committed ${primary}: ${actual} (expected ${expected})`;
        }
        const panel = document.querySelector(".inspector-panel--design");
        const controls = field => panel.querySelectorAll(`[data-field="${field}"]`);
        const control = key === "keyUnitMm" ? panel.querySelector("input[type=number][data-key-unit-mm]")
          : [...controls(key)].find(el => el.type !== "range" && (el.type !== "radio" || el.checked));
        if (key.endsWith("FontKey") || key.endsWith("IconName")) {
          const selected = panel.querySelector(`[data-preview-field="${key}"] :is(.font-picker-selection__label, .icon-picker-selection__label)`);
          if (selected?.textContent.trim() !== displayLabel) return key;
        } else if (!control?.checkVisibility()) {
          return key;
        } else if (typeof value === "boolean" ? control.checked !== value : control.value !== String(value) && control.valueAsNumber !== value) {
          return key;
        }
        if (key === "topSlopeInputMode" && !panel.querySelector('input[type=number][data-field="topFrontHeight"]')?.checkVisibility()) return key;
        if (key === "keyUnitMm" && !controls("keySizeUnits").length) return key;
        if (unitFields[key] && !controls(primary).length) return primary;
        const units = Object.keys(unitFields).find(field => unitFields[field] === key);
        if (units && !controls(units).length) return units;

        // Compare the actual inspector with the committed edit, including values clamped or
        // derived by it. The native value of the field typed into can change before these do.
        for (const input of panel.querySelectorAll('input[type=number][data-field]')) {
          if (!input.checkVisibility()) continue;
          const field = input.dataset.field;
          const unitPrimary = unitFields[field];
          const digits = Math.min((input.step.split(".")[1]?.length ?? 0) + 1, 3);
          const number = unitPrimary ? params[unitPrimary] / basis : params[field];
          const formatted = Number(number?.toFixed(unitPrimary ? 2 : digits));
          if (input.valueAsNumber !== formatted) return `${field}: ${input.value} (expected ${formatted})`;
        }
        const range = key === "keyUnitMm" ? panel.querySelector("input[type=range][data-key-unit-mm]")
          : panel.querySelector(`input[type=range][data-field="${primary}"]`);
        if (range) {
          // Apply the native range's step rounding and limits to the expected model value.
          const reference = range.cloneNode();
          reference.value = String(expected);
          if (range.value !== reference.value) return `${primary} slider: ${range.value} (expected ${reference.value})`;
        }
        return null;
      }

      const deadline = performance.now() + timeout;
      let pending = "input event";
      do {
        await new Promise(requestAnimationFrame);
        if (!performance.getEntriesByName("parameter-edit", "mark").length) continue;
        pending = mismatch(await readParams());
        if (pending === null) return performance.now();
      } while (performance.now() < deadline);
      throw new Error(`Display timed out waiting for ${pending}`);
    }, { ...edit, timeout });
  }

  async elapsedSinceEdit(completedAt) {
    return this.page.evaluate(end => performance.measure("parameter-edit-complete", { start: "parameter-edit", end }).duration, completedAt);
  }
}
