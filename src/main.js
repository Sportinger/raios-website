import { createApp } from "./app/create-app.js";

let app = createApp({
  canvas: document.getElementById("layer-canvas"),
  chapterNavigation: document.getElementById("chapter-navigation"),
  glassControls: document.getElementById("glass-controls"),
  playbackControls: document.getElementById("playback-controls"),
  scrollDebug: document.getElementById("scroll-debug"),
  stage: document.querySelector(".scroll-stage"),
  viewStyleControls: document.getElementById("view-style-controls"),
});

const disposeApp = () => app.dispose();
window.addEventListener("pagehide", disposeApp, { once: true });

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener("pagehide", disposeApp);
    disposeApp();
  });
  import.meta.hot.accept();
}
