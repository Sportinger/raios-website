import { FILM_NARRATION_AUDIO_CUES } from "./film-playback-timeline.js";

const SCROLL_AUDIO_BRIDGE_MS = 820;
const MIN_PLAYBACK_RATE = 0.25;
const MAX_PLAYBACK_RATE = 4;
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

function createTrack(source, cueId, direction) {
  const track = new Audio(source);
  track.preload = "auto";
  track.volume = 0;
  track.loop = false;
  track.preservesPitch = true;
  track.mozPreservesPitch = true;
  track.webkitPreservesPitch = true;
  track.dataset.filmAudioCue = cueId;
  track.dataset.filmAudioDirection = direction;
  return track;
}

function pauseTrack(track) {
  if (!track.paused) track.pause();
  track.volume = 0;
}

function seekTrack(track, time, duration) {
  try {
    track.currentTime = clamp(time, 0, Math.max(0, duration - 0.01));
  } catch {
    // Metadata may still be loading. The next cue transition will seek again.
  }
}

export function createFilmNarration({ host } = {}) {
  if (!(host instanceof HTMLElement)) {
    throw new TypeError("createFilmNarration requires an HTMLElement host");
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cues = FILM_NARRATION_AUDIO_CUES.map((definition) => ({
    ...definition,
    forward: createTrack(definition.forwardUrl, definition.id, "forward"),
    reverse: createTrack(definition.reverseUrl, definition.id, "reverse"),
  }));
  const tracks = cues.flatMap(({ forward, reverse }) => [forward, reverse]);
  let disabled = reducedMotion.matches;
  let unlocked = false;
  let unlockPending = false;
  let playing = false;
  let filmTime = 0;
  let lastSetAt = performance.now();
  let direction = 1;
  let scrollRate = 1;
  let motionUntil = 0;
  let activeTrackKey = "";
  let frame = 0;

  const updateState = (state, cue = "none") => {
    host.dataset.filmAudio = state;
    host.dataset.filmAudioCue = cue;
  };

  const stopAll = (state = disabled ? "disabled" : unlocked ? "ready" : "locked") => {
    tracks.forEach(pauseTrack);
    activeTrackKey = "";
    updateState(state);
  };

  const lockAfterPlaybackError = () => {
    unlocked = false;
    stopAll("locked");
  };

  const playTrack = (track) => {
    if (!track.paused) return;
    const attempt = track.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(lockAfterPlaybackError);
    }
  };

  const renderAudio = (now) => {
    const cue = cues.find(({ start, end }) => filmTime >= start && filmTime < end - 0.01);
    const moving = playing || now < motionUntil;

    if (disabled || !unlocked || !cue || !moving) {
      if (activeTrackKey) stopAll(cue ? "idle" : unlocked ? "ready" : "locked");
    } else {
      const reverse = direction < 0;
      const track = reverse ? cue.reverse : cue.forward;
      const inactiveTrack = reverse ? cue.forward : cue.reverse;
      const trackKey = `${cue.id}:${reverse ? "reverse" : "forward"}`;
      const cueProgress = clamp((filmTime - cue.start) / (cue.end - cue.start), 0, 1);
      const expectedPosition = (reverse ? 1 - cueProgress : cueProgress) * cue.duration;

      if (trackKey !== activeTrackKey) {
        tracks.forEach(pauseTrack);
        seekTrack(track, expectedPosition, cue.duration);
        activeTrackKey = trackKey;
      }

      const playbackRate = playing ? 1 : scrollRate;
      track.playbackRate = clamp(playbackRate, MIN_PLAYBACK_RATE, MAX_PLAYBACK_RATE);
      track.volume = cue.volume;
      pauseTrack(inactiveTrack);
      playTrack(track);
      updateState(reverse ? "reverse" : "forward", cue.id);
    }

    frame = requestAnimationFrame(renderAudio);
  };

  const unlock = () => {
    if (disabled || unlocked || unlockPending) return;
    unlockPending = true;
    const warmups = tracks.map((track) => {
      track.volume = 0;
      seekTrack(track, 0, 1);
      const attempt = track.play();
      return attempt && typeof attempt.then === "function" ? attempt : Promise.resolve();
    });
    Promise.all(warmups).then(() => {
      tracks.forEach(pauseTrack);
      unlocked = true;
      unlockPending = false;
      updateState("ready");
    }).catch(() => {
      unlockPending = false;
      lockAfterPlaybackError();
    });
  };

  const onVisibilityChange = () => {
    if (document.hidden) stopAll();
  };
  const onReducedMotionChange = ({ matches }) => {
    disabled = matches;
    unlocked = false;
    unlockPending = false;
    stopAll();
  };

  host.addEventListener("pointerdown", unlock, { passive: true });
  host.addEventListener("wheel", unlock, { passive: true });
  host.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("keydown", unlock, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  reducedMotion.addEventListener("change", onReducedMotionChange);
  updateState(disabled ? "disabled" : "locked");
  frame = requestAnimationFrame(renderAudio);

  return {
    setTime(time, { source = "seek" } = {}) {
      const now = performance.now();
      const nextTime = Number.isFinite(Number(time)) ? Number(time) : 0;
      const elapsedSeconds = clamp((now - lastSetAt) / 1000, 0.016, 0.25);
      const delta = nextTime - filmTime;
      filmTime = nextTime;
      lastSetAt = now;

      if (source === "play") {
        direction = 1;
      } else if (source === "scroll" && Math.abs(delta) > 0.001) {
        direction = delta < 0 ? -1 : 1;
        scrollRate = clamp(Math.abs(delta / elapsedSeconds), MIN_PLAYBACK_RATE, MAX_PLAYBACK_RATE);
        motionUntil = now + SCROLL_AUDIO_BRIDGE_MS;
      } else if (source === "seek") {
        motionUntil = 0;
        stopAll();
      }
    },
    setPlaying(nextPlaying) {
      playing = Boolean(nextPlaying);
      direction = 1;
      if (!playing) motionUntil = 0;
    },
    dispose() {
      cancelAnimationFrame(frame);
      host.removeEventListener("pointerdown", unlock);
      host.removeEventListener("wheel", unlock);
      host.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.removeEventListener("change", onReducedMotionChange);
      stopAll("disposed");
      delete host.dataset.filmAudio;
      delete host.dataset.filmAudioCue;
    },
  };
}
