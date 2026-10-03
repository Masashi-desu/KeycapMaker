import { ChevronDown, Download, FileUp, FolderOpen, Trash2, TriangleAlert } from "@lucide/icons";
import { getKeyboardBounds, getKeyboardKeyCenter, getKeyboardKeyCorners } from "./keyboard-layout.js";

function renderIcon(icon, escape) {
  return `<svg viewBox="0 0 ${icon.size} ${icon.size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icon.node.map(([tag, attributes]) => `<${tag} ${Object.entries(attributes).filter(([name]) => name !== "key").map(([name, value]) => `${name}="${escape(String(value))}"`).join(" ")}/>`).join("")}</svg>`;
}

export function renderPreviewModeControl(state, t) {
  if (!state.project.keyboard) return "";
  return `<div class="keyboard-preview-switch segment-control" role="group" aria-label="${t("keyboard.previewLabel")}" style="--segment-count: 2; --segment-index: ${state.previewMode === "keyboard" ? 1 : 0};">
    <span class="segment-control__indicator" aria-hidden="true"></span>
    ${["keycap", "keyboard"].map((mode) => `<button class="segment-link ${state.previewMode === mode ? "is-active" : ""}" type="button" data-preview-mode="${mode}" aria-pressed="${state.previewMode === mode}">${t(`keyboard.${mode}View`)}</button>`).join("")}
  </div><p class="keyboard-preview-note" role="status" ${state.previewMode === "keyboard" ? "" : "hidden"}>${t("keyboard.previewNote")}</p>`;
}

export function renderKeyboardProjectSummary(state, t, escape) {
  const board = state.project.keyboard;
  return `<section class="field-group-card project-card keyboard-project-summary">
    <h3>${t("keyboard.title")}</h3>
    <p>${board ? escape(`${board.name} · ${board.layoutName}`) : t("keyboard.empty")}</p>
    ${board ? `<p>${t("keyboard.count", { count: board.keys.length, assigned: state.project.placements.length })}</p>` : ""}
    <button class="export-save-button project-secondary-button" type="button" data-keyboard-open>${t(board ? "keyboard.configure" : "keyboard.import")}</button>
  </section>`;
}

export function renderProjectKeycapPlacements(project, keycapId, t, escape, { open = false } = {}) {
  const board = project.keyboard;
  if (!board) return "";
  const placements = project.placements.filter((entry) => entry.keycapId === keycapId);
  const name = project.keycaps.find((entry) => entry.id === keycapId)?.name || keycapId;
  const count = placements.length ? t("keyboard.placedCount", { count: placements.length }) : t("keyboard.notPlaced");
  return `<details class="project-keycap-positions" data-project-keycap-positions="${escape(keycapId)}" ${open ? "open" : ""}>
    <summary class="project-keycap-positions__heading" aria-label="${escape(`${t("keyboard.slot")} · ${name} · ${count}`)}">
      <span>${t("keyboard.slot")}</span>
      <span class="project-keycap-positions__count">${escape(count)}</span>
      ${renderIcon(ChevronDown, escape)}
    </summary>
    <div class="project-keycap-positions__body">
      ${renderMap({ project }, t, escape, { keycapId, readOnly: true })}
      ${placements.length ? "" : `<p class="project-keycap-positions__empty">${t("keyboard.notPlaced")}</p>`}
    </div>
  </details>`;
}

function renderKeyboardSelect({ label, attribute, options, value, disabled = false, action = "" }, escape) {
  const contents = `
    <span class="field-copy"><span class="field-label">${escape(label)}</span></span>
    <span class="field-control field-control--select">
      <select ${attribute} ${disabled ? "disabled" : ""}>${options.map((option) => `<option value="${escape(String(option.value))}" ${String(option.value) === String(value) ? "selected" : ""}>${escape(option.label)}</option>`).join("")}</select>
    </span>`;
  return action
    ? `<div class="field keyboard-assignment-card" data-keyboard-assignment-card><label>${contents}</label>${action}</div>`
    : `<label class="field">${contents}</label>`;
}

function renderMap(state, t, escape, { keycapId = "", readOnly = false } = {}) {
  const board = state.project.keyboard;
  const bounds = getKeyboardBounds(board), margin = 0.4;
  const placements = new Map(state.project.placements.map((entry) => [entry.slotId, entry]));
  const caps = new Map(state.project.keycaps.map((entry) => [entry.id, entry.name]));
  const polygon = (points) => points.map((p) => `${p.x},${p.y}`).join(" ");
  const mapLabel = readOnly ? t("keyboard.keycapMapLabel", { name: caps.get(keycapId) || keycapId }) : t("keyboard.mapLabel");
  return `<div class="keyboard-map-scroll"><svg class="keyboard-map ${readOnly ? "keyboard-map--readonly" : ""}" viewBox="${bounds.minX - margin} ${bounds.minY - margin} ${bounds.maxX - bounds.minX + margin * 2} ${bounds.maxY - bounds.minY + margin * 2}" aria-label="${escape(mapLabel)}" role="${readOnly ? "img" : "group"}">
    ${board.outline.map(([x, y, x2, y2]) => `<line class="keyboard-map-outline" x1="${x}" y1="${y}" x2="${x2}" y2="${y2}"/>`).join("")}
    ${board.keys.map((key) => {
      const placement = placements.get(key.id), center = getKeyboardKeyCenter(key);
      const label = placement ? caps.get(placement.keycapId) : key.label;
      const selected = !readOnly && key.id === state.keyboardSlotId;
      const highlighted = readOnly && placement?.keycapId === keycapId;
      let description = `${key.label} · ${label}`;
      if (highlighted) {
        const position = getKeyboardKeyCenter(key, board.pitchMm);
        description += ` · ${t("keyboard.placedCoordinates", {
          x: (position.x + placement.offsetX).toFixed(2), y: (position.y + placement.offsetY).toFixed(2),
          z: placement.z.toFixed(2), r: Number((key.r + placement.rotation).toFixed(2)),
        })}`;
      }
      return `<g ${readOnly ? "" : `role="button" tabindex="0" data-keyboard-slot="${escape(key.id)}" aria-pressed="${selected}" aria-label="${escape(description)}"`} class="keyboard-map-key ${selected ? "is-selected" : ""} ${placement && !readOnly ? "is-assigned" : ""} ${highlighted ? "is-highlighted" : ""}">
        <title>${escape(description)}</title>
        <polygon points="${polygon(getKeyboardKeyCorners(key))}"/>
        ${key.secondary ? `<polygon points="${polygon(getKeyboardKeyCorners(key, true))}"/>` : ""}
        <text x="${center.x}" y="${center.y}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${key.r} ${center.x} ${center.y})">${escape(String(label).slice(0, 8))}</text>
      </g>`;
    }).join("")}
  </svg></div>`;
}

export function getKeyboardWorkflow(state) {
  const hasCandidates = state.keyboardCandidates.length > 0;
  const hasLayout = Boolean(state.project.keyboard);
  const waitingForFile = hasCandidates && !state.keyboardLayouts.length;
  const steps = [
    { number: 1, labelKey: "keyboard.stepImport", available: true, complete: hasCandidates || hasLayout },
    { number: 2, labelKey: "keyboard.selectFile", available: state.keyboardCandidates.length > 1, complete: hasLayout && !waitingForFile },
    { number: 3, labelKey: "keyboard.selectPlacement", available: hasLayout && !waitingForFile, complete: hasLayout && !waitingForFile && Boolean(state.project.placements?.length) },
  ];
  const step = steps.find((item) => item.number === state.keyboardStep && item.available)?.number
    || (steps[2].available ? 3 : steps[1].available ? 2 : 1);
  return { step, steps };
}

function renderKeyboardStepBar(state, workflow, t) {
  return `<nav class="keyboard-stepper" data-current-step="${workflow.step}" aria-label="${t("keyboard.stepsLabel")}"><ol>
    ${workflow.steps.map(({ number, labelKey, available, complete }) => `<li>
      ${number < workflow.steps.length ? `<span class="keyboard-step__connector" aria-hidden="true"><span class="keyboard-step__connector-fill" data-keyboard-connector="${number}" style="--connector-progress: ${number < workflow.step ? 1 : 0}; --connector-delay: 0ms;"></span></span>` : ""}
      <button type="button" class="keyboard-step ${number === workflow.step ? "is-current" : ""} ${complete ? "is-complete" : ""}" data-keyboard-step="${number}" ${number === workflow.step ? 'aria-current="step"' : ""} ${!available || state.keyboardBusy ? "disabled" : ""}>
        <span class="keyboard-step__number" aria-hidden="true">${number}</span>
        <span class="keyboard-step__label">${t(labelKey)}</span>
      </button>
    </li>`).join("")}
  </ol></nav>`;
}

export function syncKeyboardStepBar(bar, state, t) {
  const workflow = getKeyboardWorkflow(state);
  const previousStep = Number(bar.dataset.currentStep);
  bar.dataset.currentStep = workflow.step;
  bar.setAttribute("aria-label", t("keyboard.stepsLabel"));
  for (const { number, labelKey, available, complete } of workflow.steps) {
    const button = bar.querySelector(`[data-keyboard-step="${number}"]`);
    const current = number === workflow.step;
    button.classList.toggle("is-current", current);
    button.classList.toggle("is-complete", complete);
    button.disabled = !available || state.keyboardBusy;
    if (current) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
    button.querySelector(".keyboard-step__label").textContent = t(labelKey);
    const connector = bar.querySelector(`[data-keyboard-connector="${number}"]`);
    if (!connector) continue;
    const changed = number >= Math.min(previousStep, workflow.step) && number < Math.max(previousStep, workflow.step);
    const order = workflow.step > previousStep ? number - previousStep : previousStep - number - 1;
    if (changed) connector.style.setProperty("--connector-delay", `${Math.max(0, order) * 180}ms`);
    connector.style.setProperty("--connector-progress", number < workflow.step ? "1" : "0");
  }
}

export function renderKeyboardTab(state, t, escape, searchIconMarkup) {
  const board = state.project.keyboard;
  const slot = board?.keys.find((key) => key.id === state.keyboardSlotId) || board?.keys[0];
  const placement = state.project.placements.find((entry) => entry.slotId === slot?.id);
  const group = board?.groups?.find((item) => item.id === slot?.groupId);
  const groupName = group ? group.side ? t(`keyboard.group${group.side === "left" ? "Left" : "Right"}`) : group.name : t("keyboard.groupUnknown");
  const center = slot && getKeyboardKeyCenter(slot, board.pitchMm);
  const busy = state.keyboardBusy;
  const exporting = state.exportsStatus === "running";
  const exportResult = state.exportHistory?.[0]?.format === "keyboard-3mf" ? state.exportHistory[0] : null;
  const disabled = busy ? "disabled" : "";
  const workflow = getKeyboardWorkflow(state);
  const candidates = state.keyboardCandidates.filter((path) => path.toLowerCase().includes(state.keyboardCandidateQuery.toLowerCase()));
  return `<div class="inspector-panel inspector-panel--keyboard">
    <div class="panel-intro"><h1 class="panel-title">${t("keyboard.title")}</h1><p class="panel-text">${t("keyboard.intro")}</p></div>
    ${renderKeyboardStepBar(state, workflow, t)}
    <div class="project-panel-grid">
      <p class="keyboard-status ${state.keyboardError ? "is-error" : ""}" data-keyboard-import-status role="status" ${state.keyboardMessage ? "" : "hidden"}>${escape(state.keyboardMessage)}</p>
      <p class="keyboard-status is-error" data-keyboard-preview-status role="status" ${state.keyboardPreviewErrors?.length ? "" : "hidden"}>${escape((state.keyboardPreviewErrors ?? []).map((entry) => entry.message).join("\n"))}</p>
      ${workflow.step === 1 ? `
      <section class="field-group-card keyboard-card">
        <h3>${t("keyboard.import")}</h3>
        <p>${t("keyboard.importHint")}</p>
        <p class="keyboard-import-dropzone">${t("keyboard.dropHint")}</p>
        <div class="keyboard-import-picker-actions" role="group" aria-label="${t("keyboard.chooseLocal")}">
          <button type="button" class="export-save-button project-secondary-button" data-keyboard-picker="files" ${disabled}>${renderIcon(FileUp, escape)}<span>${t("keyboard.files")}</span></button>
          <button type="button" class="export-save-button project-secondary-button" data-keyboard-picker="folder" ${disabled}>${renderIcon(FolderOpen, escape)}<span>${t("keyboard.folder")}</span></button>
          <input type="file" data-keyboard-files="files" multiple accept=".json,.dtsi,.dts,.overlay,.keymap,.toml,.kicad_pcb,.conf,.defconfig" hidden ${disabled}/>
          <input type="file" data-keyboard-files="folder" webkitdirectory multiple hidden ${disabled}/>
        </div>
        <label class="keyboard-field">${t("keyboard.url")}<input type="url" data-keyboard-url value="${escape(state.keyboardUrl)}" placeholder="https://github.com/owner/keyboard" ${disabled}/></label>
        <button type="button" class="export-save-button project-secondary-button" data-keyboard-github ${disabled}>${t(busy ? "keyboard.loading" : "keyboard.loadUrl")}</button>
      </section>` : ""}
      ${workflow.step === 2 ? `<section class="field-group-card keyboard-card">
        <h3>${t("keyboard.selectFile")}</h3>
        <div class="field keyboard-candidate-picker" role="group" aria-label="${t("keyboard.filter")}">
          <label class="field-control font-picker-search-input keyboard-candidate-search">
            <span class="font-picker-search-input__icon">${searchIconMarkup}</span>
            <input type="search" data-keyboard-candidate-query value="${escape(state.keyboardCandidateQuery)}" placeholder="${t("keyboard.filter")}" aria-label="${t("keyboard.filter")}" aria-controls="keyboard-file-candidates" spellcheck="false" autocomplete="off"/>
          </label>
          <div class="keyboard-candidates" id="keyboard-file-candidates" data-keyboard-candidates>
            ${renderKeyboardCandidates(candidates, t, escape, disabled)}
          </div>
        </div>
      </section>` : ""}
      ${workflow.step === 3 && board ? `<section class="field-group-card keyboard-card">
        <h3>${t("keyboard.selectPlacement")}</h3>
        <p class="keyboard-board-name">${escape(board.name)}</p><p>${escape(`${board.source.format} · ${board.layoutName}`)}</p>
        ${board.source.url ? `<a class="keyboard-source-link" href="${escape(board.source.url)}" target="_blank" rel="noopener noreferrer">${escape(board.source.path)}</a>` : `<p>${escape(board.source.path)}</p>`}
        <p>${t("keyboard.count", { count: board.keys.length, assigned: state.project.placements.length })}</p>
        ${state.keyboardLayouts.length > 1 ? renderKeyboardSelect({
          label: t("keyboard.layout"), attribute: "data-keyboard-layout", disabled: busy,
          value: Math.max(0, state.keyboardLayouts.findIndex((item) => item.layoutName === board.layoutName)),
          options: state.keyboardLayouts.map((item, i) => ({ value: i, label: `${item.layoutName} · ${item.keys.length}` })),
        }, escape) : ""}
        ${board.warnings.map((warning) => `<p class="keyboard-status">${escape(warning)}</p>`).join("")}
        <div class="field">
          <span class="field-copy"><span class="field-label">${t("keyboard.pitch")}</span><span class="field-hint">${t("keyboard.pitchHint")}</span></span>
          <span class="key-unit-basis-readout" data-keyboard-pitch-value>${t("keyboard.pitchValue", { value: board.pitchMm })}</span>
        </div>
        ${renderMap(state, t, escape)}
        ${renderKeyboardSelect({ label: t("keyboard.slot"), attribute: "data-keyboard-slot-select", value: slot.id,
          options: board.keys.map((key, i) => ({ value: key.id, label: `${i + 1} · ${key.label} (${key.w} × ${key.h}u)` })),
        }, escape)}
        <p>${t("keyboard.coordinates", { x: center.x.toFixed(2), y: center.y.toFixed(2), r: slot.r })}</p>
        <p data-keyboard-group>${t("keyboard.groupLabel")}: ${escape(groupName)}</p>
        ${renderKeyboardSelect({ label: t("keyboard.assign"), attribute: "data-keyboard-assignment", value: placement?.keycapId || "",
          options: [{ value: "", label: t("keyboard.unassigned") }, ...state.project.keycaps.map((entry) => ({ value: entry.id, label: entry.name }))],
          action: `<button type="button" class="export-save-button project-secondary-button" data-keyboard-assign-current>${t("keyboard.assignCurrent")}</button>
            ${placement ? `<div class="keyboard-offset-grid">${["offsetX", "offsetY", "z", "rotation"].map((field) => `<label class="keyboard-field">${t(`keyboard.${field}`)}<input type="number" data-keyboard-offset="${field}" value="${placement[field]}" min="-10000" max="10000" step="${field === "rotation" ? "1" : "0.1"}"/></label>`).join("")}</div>
              <button type="button" class="export-save-button project-secondary-button" data-keyboard-edit-assigned>${t("keyboard.editAssigned")}</button>` : ""}`,
        }, escape)}
        <button type="button" class="export-save-button project-secondary-button keyboard-export-button" data-keyboard-export ${!state.project.placements.length || exporting || state.projectStatus === "running" ? "disabled" : ""}>${renderIcon(Download, escape)}<span>${t(exporting ? "actions.saving" : "keyboard.export3mf")}</span></button>
        <p class="keyboard-status ${state.exportsStatus === "error" ? "is-error" : ""}" data-keyboard-export-status role="status" ${state.exportsSummary && (exporting || exportResult) ? "" : "hidden"}>${escape(state.exportsSummary || "")}${!exporting && exportResult && state.exportsStatus === "error" ? ` ${escape(exportResult.notes)}` : ""}</p>
        <p class="keyboard-status">${t("keyboard.exportNote")}</p>
      </section>
      <details class="field-group-card keyboard-card keyboard-danger-zone" aria-labelledby="keyboard-danger-title" data-keyboard-danger-zone ${state.keyboardDangerZoneExpanded ? "open" : ""}>
        <summary class="keyboard-danger-title" id="keyboard-danger-title">${renderIcon(TriangleAlert, escape)}<span>${t("keyboard.dangerZone")}</span>${renderIcon(ChevronDown, escape)}</summary>
        <div class="keyboard-danger-body">
          <p>${t("keyboard.removeHint")}</p>
          <button type="button" class="export-save-button project-danger-button" data-keyboard-remove ${busy || exporting || state.projectStatus === "running" ? "disabled" : ""}>${renderIcon(Trash2, escape)}<span>${t("keyboard.remove")}</span></button>
        </div>
      </details>` : ""}
    </div>
  </div>`;
}

export function renderKeyboardCandidates(candidates, t, escape, disabled = "") {
  if (!candidates.length) return `<p class="keyboard-candidates-empty" role="status">${t("keyboard.noResults")}</p>`;
  return candidates.slice(0, 200).map((path) => `<button class="font-picker-option keyboard-candidate" type="button" data-keyboard-candidate="${escape(path)}" ${disabled}>${escape(path)}</button>`).join("")
    + (candidates.length > 200 ? `<p>${t("keyboard.moreCandidates", { count: candidates.length })}</p>` : "");
}
