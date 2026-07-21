import { intervalProgress } from "../../animation/progress.js";

export function createScrollDebug({ container, items }) {
  if (!container) throw new Error("The scroll debug container is required");

  return {
    setProgress(progress) {
      const activeItem = items.find((item, index) => (
        progress >= item.start
        && (progress < item.end || index === items.length - 1)
      )) ?? items[items.length - 1];
      const localProgress = intervalProgress(
        progress,
        activeItem.start,
        activeItem.end,
      );
      container.textContent = [
        `SCROLL    ${progress.toFixed(4)}`,
        `KAPITEL ${String(activeItem.index + 1).padStart(2, "0")}  ${localProgress.toFixed(4)}`,
      ].join("\n");
    },

    dispose() {
      container.textContent = "";
    },
  };
}
