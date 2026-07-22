const audioUrl = (fileName) => new URL(`../../assets/audio/${fileName}`, import.meta.url).href;

const freezeEntries = (entries) => Object.freeze(entries.map((entry) => Object.freeze(entry)));

export const FILM_NARRATION_AUDIO_CUES = freezeEntries([
  {
    id: "prompt",
    start: 1.15,
    end: 3.892813,
    duration: 2.742813,
    forwardUrl: audioUrl("build-me-a-music-player.mp3"),
    reverseUrl: audioUrl("build-me-a-music-player-reversed.mp3"),
    volume: 0.72,
  },
  {
    id: "kernel",
    start: 4.442813,
    end: 8.282813,
    duration: 3.84,
    forwardUrl: audioUrl("kernel-layer.mp3"),
    reverseUrl: audioUrl("kernel-layer-reversed.mp3"),
    volume: 0.72,
  },
  {
    id: "genesis",
    start: 8.832813,
    end: 12.594438,
    duration: 3.761625,
    forwardUrl: audioUrl("genesis-layer.mp3"),
    reverseUrl: audioUrl("genesis-layer-reversed.mp3"),
    volume: 0.72,
  },
  {
    id: "agent",
    start: 12.594438,
    end: 24.715251,
    duration: 12.120813,
    forwardUrl: audioUrl("agent-internet-key.mp3"),
    reverseUrl: audioUrl("agent-internet-key-reversed.mp3"),
    volume: 0.72,
  },
  {
    id: "builder",
    start: 24.915251,
    end: 38.786271,
    duration: 13.87102,
    forwardUrl: audioUrl("builder-playground.mp3"),
    reverseUrl: audioUrl("builder-playground-reversed.mp3"),
    volume: 0.72,
  },
  {
    id: "compiler-fail",
    start: 42.25,
    end: 51.523438,
    duration: 9.273438,
    forwardUrl: audioUrl("compiler-first-fail.mp3"),
    reverseUrl: audioUrl("compiler-first-fail-reversed.mp3"),
    volume: 0.74,
  },
]);
