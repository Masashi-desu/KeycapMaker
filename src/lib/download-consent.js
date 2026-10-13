// Use the editor's legend definitions and asset registries as the source of
// resources used by renderable legend objects, excluding inactive settings.
export function collectDownloadResources(paramsList, legendFields, { resolveFont, resolveIconSet }) {
  const resources = new Map();
  for (const params of paramsList) {
    for (const fields of legendFields) {
      if (!fields.isRenderable(params)) continue;
      const kind = params[fields.contentType] === "icon" ? "icon" : "font";
      const asset = kind === "icon" ? resolveIconSet(params[fields.iconSet]) : resolveFont(params[fields.font]);
      resources.set(`${kind}:${asset.key}`, { kind, asset });
    }
  }
  return [...resources.values()];
}

export class DownloadConsentGate {
  #dialog = null;
  #grants = new WeakSet();

  get pending() { return this.#dialog !== null; }

  request(markup, { signal, onCopy } = {}) {
    signal?.throwIfAborted();
    if (this.pending) throw new Error("Download consent is already pending.");
    const dialog = document.createElement("dialog");
    dialog.className = "download-consent-dialog";
    dialog.setAttribute("aria-labelledby", "download-consent-title");
    dialog.setAttribute("aria-describedby", "download-consent-description");
    dialog.innerHTML = markup;
    const checkbox = dialog.querySelector("[data-download-consent-check]");
    const accept = dialog.querySelector("[data-download-consent-accept]");
    const previousFocus = document.activeElement;
    this.#dialog = dialog;
    document.body.append(dialog);
    document.documentElement.classList.add("is-download-consent-open");

    return new Promise((resolve, reject) => {
      const finish = (error, grant) => {
        signal?.removeEventListener("abort", abort);
        dialog.close();
        dialog.remove();
        this.#dialog = null;
        document.documentElement.classList.remove("is-download-consent-open");
        if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
        if (error) reject(error);
        else resolve(grant);
      };
      const decline = () => {
        const error = new Error("Download consent was declined.");
        error.code = "consent_declined";
        finish(error);
      };
      const abort = () => finish(signal.reason ?? new DOMException("Aborted", "AbortError"));
      checkbox.addEventListener("change", () => { accept.disabled = !checkbox.checked; });
      dialog.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!checkbox.checked || signal?.aborted) return;
        const grant = {};
        this.#grants.add(grant);
        finish(null, grant);
      });
      dialog.addEventListener("click", (event) => {
        const cancel = event.target.closest("[data-download-consent-cancel]");
        if (cancel) decline();
        const copy = event.target.closest("[data-download-consent-copy]");
        if (copy) void onCopy?.(copy, dialog);
      });
      dialog.addEventListener("cancel", (event) => { event.preventDefault(); decline(); });
      // Escape belongs to this modal, not to the export chooser behind it.
      dialog.addEventListener("keydown", (event) => {
        if (event.key === "Escape") event.stopPropagation();
        if (event.key === "Tab" && !event.ctrlKey && !event.altKey && !event.metaKey) {
          const controls = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href]')];
          const first = controls[0];
          const last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      });
      signal?.addEventListener("abort", abort, { once: true });
      try {
        dialog.showModal();
        checkbox.focus();
      } catch (error) {
        finish(error);
      }
    });
  }

  consume(grant) {
    if (!grant || !this.#grants.delete(grant)) throw new Error("Download requires consent for this file.");
  }
}
