import { createFilmApp } from "./film/create-film-app.js";

let app = createFilmApp({
  canvas: document.getElementById("film-canvas"),
  chapterNavigation: document.getElementById("chapter-navigation"),
  playToggle: document.getElementById("play-toggle"),
  progressFill: document.getElementById("progress-fill"),
  prompt: document.getElementById("prompt"),
  sceneTitle: document.getElementById("scene-title"),
  stage: document.getElementById("film-stage"),
  timecode: document.getElementById("timecode"),
});

const dispose = () => app.dispose();
window.addEventListener("pagehide", dispose, { once: true });

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener("pagehide", dispose);
    dispose();
  });
  import.meta.hot.accept();
}
