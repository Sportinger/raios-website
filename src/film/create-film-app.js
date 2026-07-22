import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  FILM_POSTER_ANIMATION_TIME,
  FILM_PROMPT,
  FILM_SCENES,
} from "./film-data.js";
import { createFilmCamera } from "./create-film-camera.js";
import { createFilmWorld } from "./create-film-world.js";
import {
  FILM_PLAYBACK_DURATION,
  animationTimeAtPlaybackTime,
  createFilmNarration,
  createFilmOverlays,
  playbackTimeAtAnimationTime,
} from "./presentation/index.js";

const AUTOPLAY_SECONDS_PER_SECOND = 1;
const KERNEL_ROTATION_SEGMENTS = Object.freeze([
  { start: 28.29, end: 40.72, angle: -Math.PI / 2 },
  { start: 58, end: 66, angle: -Math.PI / 2 },
]);

const clampPlaybackTime = (time) => THREE.MathUtils.clamp(time, 0, FILM_PLAYBACK_DURATION);
const kernelRotationAtPlaybackTime = (time) => KERNEL_ROTATION_SEGMENTS.reduce(
  (rotation, segment) => rotation + segment.angle * THREE.MathUtils.smootherstep(
    time,
    segment.start,
    segment.end,
  ),
  0,
);
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
  audioToggle,
  canvas,
  chapterNavigation,
  orbitToggle,
  playToggle,
  progressFill,
  prompt,
  sceneTitle,
  stage,
  timecode,
  initialAnimationTime,
  externalPlayback = false,
  transparentBackground = false,
  onRequestPlaybackTime,
}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: transparentBackground,
    powerPreference: "high-performance",
  });
  if (transparentBackground) renderer.setClearColor(0x000000, 0);
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
  const world = createFilmWorld({
    showGrid: !transparentBackground,
    transparentBackground,
  });
  const viewport = canvas.closest(".film-viewport");
  const overlays = createFilmOverlays({ host: viewport });
  const narration = createFilmNarration({ host: viewport });
  let playbackTime = 0;
  let animationTime = 0;
  let playing = false;
  let orbitEnabled = false;
  let active = true;
  let frame = 0;
  let previousTimestamp = performance.now();
  let scrollFrame = 0;

  const render = () => {
    if (!orbitEnabled) filmCamera.setTime(animationTime);
    if (orbitEnabled) orbitControls.update();
    world.setKernelRotationY(kernelRotationAtPlaybackTime(playbackTime));
    world.setTime(animationTime, filmCamera.camera);
    renderer.render(world.scene, filmCamera.camera);
  };

  const updateUi = () => {
    const progress = playbackTime / FILM_PLAYBACK_DURATION;
    const scene = sceneAt(animationTime);
    sceneTitle.textContent = `${String(scene.number).padStart(2, "0")} · ${scene.title}`;
    timecode.textContent = `${formatTime(playbackTime)} / ${formatTime(FILM_PLAYBACK_DURATION)}`;
    progressFill.style.setProperty("--progress", `${(progress * 100).toFixed(4)}%`);
    const typed = Math.floor(THREE.MathUtils.clamp((animationTime - 1.15) / (3.72 - 1.15), 0, 1) * FILM_PROMPT.length);
    prompt.textContent = FILM_PROMPT.slice(0, typed);
    prompt.classList.toggle("is-visible", animationTime < 3.89 && animationTime >= 0.8);
    const enteredFilm = playbackTime > 0.05;
    const transportVisible = playbackTime >= 0.8;
    viewport.classList.toggle("has-entered-film", enteredFilm);
    viewport.classList.toggle("has-transport", transportVisible);
    overlays.setTime(animationTime);
    Array.from(chapterNavigation.children).forEach((button, index) => {
      if (index === FILM_SCENES.indexOf(scene)) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
  };

  const setTime = (time, syncScroll = false, source = "seek") => {
    playbackTime = clampPlaybackTime(time);
    animationTime = animationTimeAtPlaybackTime(playbackTime);
    if (syncScroll) {
      if (externalPlayback && typeof onRequestPlaybackTime === "function") {
        onRequestPlaybackTime(playbackTime);
      } else {
        const travel = Math.max(1, stage.offsetHeight - window.innerHeight);
        window.scrollTo({
          top: stage.offsetTop + travel * playbackTime / FILM_PLAYBACK_DURATION,
        });
      }
    }
    narration.setTime(playbackTime, { source });
    updateUi();
    render();
  };

  const setPlaying = (nextPlaying) => {
    playing = nextPlaying;
    narration.setPlaying(playing);
    playToggle.setAttribute("aria-pressed", String(playing));
    playToggle.textContent = playing ? "PAUSE" : "PLAY";
  };

  const updateAudioToggle = () => {
    const muted = narration.isMuted();
    audioToggle.setAttribute("aria-pressed", String(!muted));
    audioToggle.setAttribute("aria-label", muted ? "Unmute film narration" : "Mute film narration");
    audioToggle.title = muted ? "Unmute narration" : "Mute narration";
    audioToggle.innerHTML = muted
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"></path><path d="m17 9 4 4m0-4-4 4"></path></svg><span>MUTED</span>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"></path><path d="M16 8a5 5 0 0 1 0 8m2.5-10.5a9 9 0 0 1 0 13"></path></svg><span>SOUND ON</span>';
  };

  const onAudioToggle = () => {
    narration.setMuted(!narration.isMuted());
    updateAudioToggle();
  };

  const setOrbitEnabled = (enabled) => {
    const nextEnabled = Boolean(enabled);
    if (nextEnabled === orbitEnabled) return;
    if (nextEnabled) {
      filmCamera.setTime(animationTime);
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
    if (!orbitEnabled) setTime(playbackTime, true);
    else render();
  };

  FILM_SCENES.forEach((scene) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(scene.number).padStart(2, "0");
    button.title = scene.title;
    const chapterTime = playbackTimeAtAnimationTime(scene.start);
    button.style.setProperty(
      "--chapter-y",
      `${5 + (chapterTime / FILM_PLAYBACK_DURATION) * 90}%`,
    );
    button.addEventListener("click", () => {
      setOrbitEnabled(false);
      setPlaying(false);
      setTime(chapterTime, true);
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
  const resizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(resize)
    : null;
  if (resizeObserver) resizeObserver.observe(canvas);

  const syncFromScroll = () => {
    scrollFrame = 0;
    if (externalPlayback || playing || orbitEnabled
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const travel = Math.max(1, stage.offsetHeight - window.innerHeight);
    setTime(
      (window.scrollY - stage.offsetTop) / travel * FILM_PLAYBACK_DURATION,
      false,
      "scroll",
    );
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
    if (!playing && playbackTime >= FILM_PLAYBACK_DURATION - 0.001) setTime(0, true);
    setPlaying(!playing);
  };
  const onOrbitToggle = () => setOrbitEnabled(!orbitEnabled);
  playToggle.addEventListener("click", onPlayToggle);
  audioToggle.addEventListener("click", onAudioToggle);
  orbitToggle.addEventListener("click", onOrbitToggle);
  window.addEventListener("resize", resize, { passive: true });
  if (!externalPlayback) window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("wheel", stopForUserInput, { passive: true });
  window.addEventListener("touchstart", stopForUserInput, { passive: true });

  const animate = (timestamp) => {
    const delta = Math.min(0.05, (timestamp - previousTimestamp) / 1000);
    previousTimestamp = timestamp;
    if (!active) {
      frame = requestAnimationFrame(animate);
      return;
    }
    if (playing) {
      setTime(playbackTime + delta * AUTOPLAY_SECONDS_PER_SECOND, true, "play");
      if (playbackTime >= FILM_PLAYBACK_DURATION) {
        setPlaying(false);
      }
    } else {
      render();
    }
    frame = requestAnimationFrame(animate);
  };

  resize();
  const posterAnimationTime = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? FILM_POSTER_ANIMATION_TIME
    : 0;
  setTime(playbackTimeAtAnimationTime(initialAnimationTime ?? posterAnimationTime));
  updateAudioToggle();
  frame = requestAnimationFrame(animate);

  return {
    duration: FILM_PLAYBACK_DURATION,
    getAnimationTime: () => animationTime,
    getPlaybackTime: () => playbackTime,
    setAnimationTime(time, { source = "seek" } = {}) {
      setTime(playbackTimeAtAnimationTime(time), false, source);
    },
    setPlaybackTime(time, { source = "seek" } = {}) {
      setTime(time, false, source);
    },
    setOrbitEnabled,
    setPlaying,
    setActive(nextActive) {
      const enabled = Boolean(nextActive);
      if (enabled === active) return;
      active = enabled;
      if (!active) setPlaying(false);
      else render();
    },
    dispose() {
      cancelAnimationFrame(frame);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      if (!externalPlayback) window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", stopForUserInput);
      window.removeEventListener("touchstart", stopForUserInput);
      playToggle.removeEventListener("click", onPlayToggle);
      audioToggle.removeEventListener("click", onAudioToggle);
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
