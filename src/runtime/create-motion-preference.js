export function createMotionPreference() {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  return {
    get matches() {
      return mediaQuery.matches;
    },

    subscribe(listener) {
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    },
  };
}
