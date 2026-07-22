import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  FILM_DURATION,
  FILM_POSTER_TIME,
  FILM_PROMPT,
  FILM_SCENES,
} from "./film-data.js";
import { createFilmCamera } from "./create-film-camera.js";
import { createFilmWorld } from "./create-film-world.js";
import { createFilmNarration, createFilmOverlays } from "./presentation/index.js";

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
  orbitToggle,
  playToggle,
  progressFill,
  prompt,
  sceneTitle,
  stage,
  timecode,
  initialTime,
}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const filmCamera = createFilmCamera();
  const orbitControls = new OrbitControls(filmCamera.camera, canvas);
  orbitControls.enabled = false;
  orbitControls.enableDamping = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  orbitControls.dampingFactor = 0.08;
  orbitControls.screenSpacePanning = true;
  orbitControls.minZoom = 0.08;
  orbitControls.maxZoom = 4;
  orbitControls.minPolarAngle = 0.04;
  orbitControls.maxPolarAngle = Math.PI - 0.04;
  const world = createFilmWorld();
  const viewport = canvas.closest(".film-viewport");
  const overlays = createFilmOverlays({ host: viewport });
  const narration = createFilmNarration({ host: viewport });
  let currentTime = 0;
  let playing = false;
  let orbitEnabled = false;
  let frame = 0;
  let previousTimestamp = performance.now();
  let scrollFrame = 0;

  const render = () => {
    if (!orbitEnabled) filmCamera.setTime(currentTime);
    if (orbitEnabled) orbitControls.update();
    world.setTime(currentTime, filmCamera.camera);
    renderer.render(world.scene, filmCamera.camera);
  };

  const updateUi = () => {
    const progress = currentTime / FILM_DURATION;
    const scene = sceneAt(currentTime);
    sceneTitle.textContent = `${String(scene.number).padStart(2, "0")} · ${scene.title}`;
    timecode.textContent = `${formatTime(currentTime)} / ${formatTime(FILM_DURATION)}`;
    progressFill.style.setProperty("--progress", `${(progress * 100).toFixed(4)}%`);
    const typed = Math.floor(THREE.MathUtils.clamp((currentTime - 1.15) / (3.72 - 1.15), 0, 1) * FILM_PROMPT.length);
    prompt.textContent = FILM_PROMPT.slice(0, typed);
    prompt.classList.toggle("is-visible", currentTime < 3.89 && currentTime >= 0.8);
    overlays.setTime(currentTime);
    Array.from(chapterNavigation.children).forEach((button, index) => {
      if (index === FILM_SCENES.indexOf(scene)) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
  };

  const setTime = (time, syncScroll = false, source = "seek") => {
    currentTime = clampTime(time);
    if (syncScroll) {
      const travel = Math.max(1, stage.offsetHeight - window.innerHeight);
      window.scrollTo({ top: stage.offsetTop + travel * currentTime / FILM_DURATION });
    }
    narration.setTime(currentTime, { source });
    updateUi();
    render();
  };

  const setPlaying = (nextPlaying) => {
    playing = nextPlaying;
    narration.setPlaying(playing);
    playToggle.setAttribute("aria-pressed", String(playing));
    playToggle.textContent = playing ? "PAUSE" : "PLAY";
  };

  const setOrbitEnabled = (enabled) => {
    const nextEnabled = Boolean(enabled);
    if (nextEnabled === orbitEnabled) return;
    if (nextEnabled) {
      setPlaying(false);
      filmCamera.setTime(currentTime);
      orbitControls.target.copy(filmCamera.target);
      orbitControls.update();
    }
    orbitEnabled = nextEnabled;
    orbitControls.enabled = orbitEnabled;
    viewport.classList.toggle("is-orbiting", orbitEnabled);
    orbitToggle.setAttribute("aria-pressed", String(orbitEnabled));
    orbitToggle.textContent = orbitEnabled ? "EXIT ORBIT" : "FREE ORBIT";
    orbitToggle.title = orbitEnabled
      ? "Return to the film camera"
      : "Explore the current film frame in 3D";
    if (!orbitEnabled) setTime(currentTime, true);
    else render();
  };

  FILM_SCENES.forEach((scene) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(scene.number).padStart(2, "0");
    button.title = scene.title;
    button.style.setProperty("--chapter-y", `${5 + (scene.start / FILM_DURATION) * 90}%`);
    button.addEventListener("click", () => {
      setOrbitEnabled(false);
      setPlaying(false);
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
    if (playing || orbitEnabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const travel = Math.max(1, stage.offsetHeight - window.innerHeight);
    setTime((window.scrollY - stage.offsetTop) / travel * FILM_DURATION, false, "scroll");
  };
  const onScroll = () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(syncFromScroll);
  };
  const stopForUserInput = () => {
    if (!playing) return;
    setPlaying(false);
  };

  const onPlayToggle = () => {
    if (orbitEnabled) setOrbitEnabled(false);
    if (!playing && currentTime >= FILM_DURATION - 0.001) setTime(0, true);
    setPlaying(!playing);
  };
  const onOrbitToggle = () => setOrbitEnabled(!orbitEnabled);
  playToggle.addEventListener("click", onPlayToggle);
  orbitToggle.addEventListener("click", onOrbitToggle);
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("wheel", stopForUserInput, { passive: true });
  window.addEventListener("touchstart", stopForUserInput, { passive: true });

  const animate = (timestamp) => {
    const delta = Math.min(0.05, (timestamp - previousTimestamp) / 1000);
    previousTimestamp = timestamp;
    if (playing) {
      setTime(currentTime + delta * AUTOPLAY_SECONDS_PER_SECOND, true, "play");
      if (currentTime >= FILM_DURATION) {
        setPlaying(false);
      }
    } else {
      render();
    }
    frame = requestAnimationFrame(animate);
  };

  resize();
  setTime(initialTime ?? (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? FILM_POSTER_TIME : 0
  ));
  frame = requestAnimationFrame(animate);

  return {
    dispose() {
      cancelAnimationFrame(frame);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", stopForUserInput);
      window.removeEventListener("touchstart", stopForUserInput);
      playToggle.removeEventListener("click", onPlayToggle);
      orbitToggle.removeEventListener("click", onOrbitToggle);
      chapterNavigation.replaceChildren();
      viewport.classList.remove("is-orbiting");
      orbitControls.dispose();
      narration.dispose();
      overlays.dispose();
      world.dispose();
      renderer.dispose();
    },
  };
}
