const CONTROL_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "ior",
    label: "IOR",
    min: 1,
    max: 2.33,
    step: 0.01,
    value: 1.04,
    format: (value) => value.toFixed(2),
  }),
  Object.freeze({
    id: "frontThickness",
    label: "Vorderseite",
    min: 0,
    max: 8,
    step: 0.05,
    value: 3.5,
    format: (value) => value.toFixed(2),
  }),
  Object.freeze({
    id: "backThickness",
    label: "Rückseite",
    min: 0,
    max: 3,
    step: 0.05,
    value: 0.5,
    format: (value) => value.toFixed(2),
  }),
  Object.freeze({
    id: "environmentRotation",
    label: "Environment",
    min: 0,
    max: 360,
    step: 1,
    value: 66,
    format: (value) => `${Math.round(value)}°`,
  }),
]);

export function createGlassControls({ container, onChange }) {
  if (!container) throw new Error("The glass controls container is required");

  const abortController = new AbortController();
  const panel = document.createElement("details");
  const summary = document.createElement("summary");
  const controls = document.createElement("div");
  const state = Object.fromEntries(
    CONTROL_DEFINITIONS.map(({ id, value }) => [id, value]),
  );
  panel.className = "glass-controls__panel";
  summary.className = "glass-controls__summary";
  summary.textContent = "GLAS";
  controls.className = "glass-controls__body";
  panel.append(summary, controls);

  CONTROL_DEFINITIONS.forEach((definition) => {
    const row = document.createElement("label");
    const caption = document.createElement("span");
    const output = document.createElement("output");
    const input = document.createElement("input");
    row.className = "glass-controls__row";
    caption.textContent = definition.label;
    output.value = definition.format(definition.value);
    input.type = "range";
    input.min = String(definition.min);
    input.max = String(definition.max);
    input.step = String(definition.step);
    input.value = String(definition.value);
    input.setAttribute("aria-label", definition.label);
    input.addEventListener("input", () => {
      const value = Number(input.value);
      state[definition.id] = value;
      output.value = definition.format(value);
      onChange({ ...state });
    }, { signal: abortController.signal });
    row.append(caption, output, input);
    controls.append(row);
  });

  container.append(panel);
  onChange({ ...state });

  return {
    dispose() {
      abortController.abort();
      container.replaceChildren();
    },
  };
}
