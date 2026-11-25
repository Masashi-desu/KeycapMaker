// Use the SVG filename (without its extension) from the IconYard library.
export function renderUiIcon(name, className = "") {
  const url = `${import.meta.env.BASE_URL}keycap-ui/icons/${name}.svg`;
  const classes = className ? `ui-icon ${className}` : "ui-icon";
  return `<span class="${classes}" aria-hidden="true" style="--ui-icon: url('${url}')"></span>`;
}
