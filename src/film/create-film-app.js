import * as THREE from "three";
import { FILM_DURATION, FILM_PROMPT, FILM_SCENES } from "./film-data.js";
import { createFilmCamera } from "./create-film-camera.js";
import { createFilmWorld } from "./create-film-world.js";

const AUTOPLAY_SECONDS_PER_SECOND = 1;

const clampTime = (time) => THREE.MathUtils.clamp(time, 0, FILM_DURATION);
const sceneAt = (time) => FILM_SCENES.find(({ start, end }) => (
  time >= start && time < end
)) ?? FILM_SCENES[FILM_SCENES.length - 1];

function formatTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const hundredths = Math.floor((time % 1) * 100);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}

export function createFilmApp({
  canvas,
  chapterNavigation,
  playToggle,
  progressFill,
  prompt,
  sceneTitle,
  stage,
  timecode,
}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const filmCamera = createFilmCamera();
  const world = createFilmWorld();
  let currentTime = 0;
  let playing = false;
  let frame = 0;
  let previousTimestamp = performance.now();
  let scrollFrame = 0;

  const render = () => {
    filmCamera.setTime(currentTime);
    world.setTime(currentTime);
    renderer.render(world.scene, filmCamera.camera);
  };

  const updateUi = () => {
    const progress = currentTime / FILM_DURATION;
    const scene = sceneAt(currentTime);
    sceneTitle.textContent = `${String(scene.number).padStart(2, "0")} · ${scene.title}`;
    timecode.textContent = `${formatTime(currentTime)} / 02:00.00`;
    progressFill.style.setProperty("--progress", `${(progress * 100).toFixed(4)}%`);
    const typed = Math.floor(THREE.MathUtils.clamp((currentTime - 1.15) / (3.72 - 1.15), 0, 1) * FILM_PROMPT.length);
    prompt.textContent = FILM_PROMPT.slice(0, typed);
    prompt.classList.toggle("is-visible", currentTime < 3.89 && currentTime >= 0.8);
    Array.from(chapterNavigation.children).forEach((button, index) => {
      if (index === FILM_SCENES.indexOf(scene)) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
  };

  const setTime = (time, syncScroll = false) => {
    currentTime = clampTime(time);
    if (syncScroll) {
      const travel = Math.max(1, stage.offsetHeight - window.innerHeight);
      window.scrollTo({ top: stage.offsetTop + travel * currentTime / FILM_DURATION });
    }
    updateUi();
    render();
  };

  FILM_SCENES.forEach((scene) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(scene.number).padStart(2, "0");
    button.title = scene.title;
    button.style.setProperty("--chapter-y", `${5 + (scene.start / FILM_DURATION) * 90}%`);
    button.addEventListener("click", () => {
      playing = false;
      playToggle.setAttribute("aria-pressed", "false");
      playToggle.textContent = "PLAY";
      setTime(scene.start, true);
    });
    chapterNavigation.append(button);
  });

  const resize = () => {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    filmCamera.resize(width, height);
    render();
  };

  const syncFromScroll = () => {
    scrollFrame = 0;
    if (playing || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const travel = Math.max(1, stage.offsetHeight - window.innerHeight);
    setTime((window.scrollY - stage.offsetTop) / travel * FILM_DURATION);
  };
  const onScroll = () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(syncFromScroll);
  };
  const stopForUserInput = () => {
    if (!playing) return;
    playing = false;
    playToggle.setAttribute("aria-pressed", "false");
    playToggle.textContent = "PLAY";
  };

  playToggle.addEventListener("click", () => {
    if (!playing && currentTime >= FILM_DURATION - 0.001) setTime(0, true);
    playing = !playing;
    playToggle.setAttribute("aria-pressed", String(playing));
    playToggle.textContent = playing ? "PAUSE" : "PLAY";
  });
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("wheel", stopForUserInput, { passive: true });
  window.addEventListener("touchstart", stopForUserInput, { passive: true });

  const animate = (timestamp) => {
    const delta = Math.min(0.05, (timestamp - previousTimestamp) / 1000);
    previousTimestamp = timestamp;
    if (playing) {
      setTime(currentTime + delta * AUTOPLAY_SECONDS_PER_SECOND, true);
      if (currentTime >= FILM_DURATION) {
        playing = false;
        playToggle.setAttribute("aria-pressed", "false");
        playToggle.textContent = "PLAY";
      }
    } else {
      render();
    }
    frame = requestAnimationFrame(animate);
  };

  resize();
  setTime(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 118 : 0);
  frame = requestAnimationFrame(animate);

  return {
    dispose() {
      cancelAnimationFrame(frame);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", stopForUserInput);
      window.removeEventListener("touchstart", stopForUserInput);
      chapterNavigation.replaceChildren();
      world.dispose();
      renderer.dispose();
    },
  };
}
