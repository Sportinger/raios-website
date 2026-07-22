import { FILM_NARRATION_AUDIO_CUES } from "./film-playback-timeline.js";

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
  let muted = true;
  let unlocked = false;
  let unlockPending = false;
  let playing = false;
  let filmTime = 0;
  let activeTrackKey = "";
  let frame = 0;

  const updateState = (state, cue = "none") => {
    host.dataset.filmAudio = state;
    host.dataset.filmAudioCue = cue;
  };

  const stopAll = (state = disabled ? "disabled" : muted ? "muted" : unlocked ? "ready" : "locked") => {
    tracks.forEach(pauseTrack);
    activeTrackKey = "";
    updateState(state);
  };

  const lockAfterPlaybackError = () => {
    unlocked = false;
    stopAll("locked");
  };

  const playTrack = (track) => {
    if (!track.paused || track.ended) return;
    const attempt = track.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(lockAfterPlaybackError);
    }
  };

  const renderAudio = (now) => {
    const cue = cues.find(({ start, end }) => filmTime >= start && filmTime < end - 0.01);
    const moving = playing;

    if (disabled || muted || !unlocked || !cue || !moving) {
      if (activeTrackKey) stopAll(cue ? "idle" : muted ? "muted" : unlocked ? "ready" : "locked");
    } else {
      const track = cue.forward;
      const inactiveTrack = cue.reverse;
      const trackKey = `${cue.id}:forward`;
      const cueProgress = clamp((filmTime - cue.start) / (cue.end - cue.start), 0, 1);
      const expectedPosition = cueProgress * cue.duration;

      if (trackKey !== activeTrackKey) {
        tracks.forEach(pauseTrack);
        seekTrack(track, expectedPosition, cue.duration);
        activeTrackKey = trackKey;
      }

      track.playbackRate = 1;
      track.volume = cue.volume;
      pauseTrack(inactiveTrack);
      playTrack(track);
      updateState("forward", cue.id);
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
      muted = false;
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
    muted = true;
    unlocked = false;
    unlockPending = false;
    stopAll();
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  reducedMotion.addEventListener("change", onReducedMotionChange);
  updateState(disabled ? "disabled" : "muted");
  frame = requestAnimationFrame(renderAudio);

  return {
    setTime(time, { source = "seek" } = {}) {
      const nextTime = Number.isFinite(Number(time)) ? Number(time) : 0;
      filmTime = nextTime;
      if (source === "seek") {
        stopAll();
      }
    },
    setPlaying(nextPlaying) {
      playing = Boolean(nextPlaying);
      if (!playing) stopAll();
    },
    isMuted() {
      return muted;
    },
    setMuted(nextMuted) {
      if (disabled) {
        muted = true;
        stopAll("disabled");
        return;
      }
      muted = Boolean(nextMuted);
      if (muted) {
        stopAll("muted");
        return;
      }
      if (unlocked) {
        updateState("ready");
        return;
      }
      unlock();
    },
    dispose() {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.removeEventListener("change", onReducedMotionChange);
      stopAll("disposed");
      delete host.dataset.filmAudio;
      delete host.dataset.filmAudioCue;
    },
  };
}
