export function createChapterNavigation({ container, items, onSelect }) {
  if (!container) throw new Error("The chapter navigation container is required");

  const abortController = new AbortController();
  const buttons = items.map((item) => {
    const button = document.createElement("button");
    const number = document.createElement("span");
    button.type = "button";
    button.className = "chapter-navigation__pill";
    button.dataset.chapterId = item.id;
    button.style.setProperty("--chapter-position", `${item.start * 100}%`);
    button.title = `${item.index + 1}. ${item.label}`;
    button.setAttribute("aria-label", `Zu Kapitel ${item.index + 1}: ${item.label}`);
    number.className = "chapter-navigation__number";
    number.textContent = String(item.index + 1);
    number.setAttribute("aria-hidden", "true");
    button.append(number);
    button.addEventListener("click", () => onSelect(item), {
      signal: abortController.signal,
    });
    container.append(button);
    return { button, item };
  });

  return {
    setProgress(progress) {
      buttons.forEach(({ button, item }) => {
        const isActive = progress >= item.start
          && (progress < item.end || item.index === items.length - 1);
        if (isActive) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
      });
    },

    dispose() {
      abortController.abort();
      container.replaceChildren();
    },
  };
}
