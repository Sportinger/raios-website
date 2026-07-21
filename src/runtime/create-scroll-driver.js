import { clamp } from "../animation/progress.js";

export function createScrollDriver({ stage, onProgress }) {
  let scrollFrame = 0;

  const getProgress = () => {
    const travel = Math.max(1, stage.offsetHeight - window.innerHeight);
    return clamp(window.scrollY / travel, 0, 1);
  };

  const scheduleRender = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      onProgress(getProgress());
    });
  };

  window.addEventListener("scroll", scheduleRender, { passive: true });

  return {
    getProgress,

    dispose() {
      window.removeEventListener("scroll", scheduleRender);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    },
  };
}
