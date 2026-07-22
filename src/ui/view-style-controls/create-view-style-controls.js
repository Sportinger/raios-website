const OPTIONS = Object.freeze([
  Object.freeze({ id: "normal", label: "NORMAL" }),
  Object.freeze({ id: "vector", label: "2D STYLE" }),
]);

export function createViewStyleControls({ container, onChange }) {
  if (!container) throw new Error("The view style controls container is required");
  container.setAttribute("role", "group");
  container.setAttribute("aria-label", "Darstellungsstil");

  const buttons = OPTIONS.map(({ id, label }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "view-style-controls__button";
    button.dataset.style = id;
    button.textContent = label;
    button.setAttribute("aria-pressed", String(id === "normal"));
    button.addEventListener("click", () => {
      buttons.forEach((candidate) => {
        candidate.setAttribute("aria-pressed", String(candidate === button));
      });
      onChange(id);
    });
    container.append(button);
    return button;
  });

  return {
    dispose() {
      container.replaceChildren();
      container.removeAttribute("role");
      container.removeAttribute("aria-label");
    },
  };
}
