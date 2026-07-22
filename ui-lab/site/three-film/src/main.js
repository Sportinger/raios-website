import { createFilmApp } from "./film/create-film-app.js";

const requestedTime = Number.parseFloat(new URL(window.location.href).searchParams.get("time"));

let app = createFilmApp({
  canvas: document.getElementById("film-canvas"),
  chapterNavigation: document.getElementById("chapter-navigation"),
  orbitToggle: document.getElementById("orbit-toggle"),
  playToggle: document.getElementById("play-toggle"),
  progressFill: document.getElementById("progress-fill"),
  prompt: document.getElementById("prompt"),
  sceneTitle: document.getElementById("scene-title"),
  stage: document.getElementById("film-stage"),
  timecode: document.getElementById("timecode"),
  initialAnimationTime: Number.isFinite(requestedTime) ? requestedTime : undefined,
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
