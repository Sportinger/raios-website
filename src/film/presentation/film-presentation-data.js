const freezeEntries = (entries) => Object.freeze(entries.map((entry) => Object.freeze(entry)));

export const FILM_VOICE_CUES = freezeEntries([
  {
    id: "kernel",
    start: 4.442813,
    end: 8.282813,
    captions: freezeEntries([
      { start: 0, end: 2, text: "The base is a custom" },
      { start: 2, end: 3.84, text: "Rust kernel." },
    ]),
  },
  {
    id: "genesis",
    start: 8.832813,
    end: 12.594438,
    captions: freezeEntries([
      { start: 0, end: 1.95, text: "On top of that, we have" },
      { start: 1.95, end: 3.761625, text: "the Genesis layer." },
    ]),
  },
  {
    id: "agent",
    start: 12.594438,
    end: 24.715251,
    captions: freezeEntries([
      { start: 0, end: 2.45, text: "Now we can spawn an agent." },
      { start: 2.45, end: 4.65, text: "It gets granted access" },
      { start: 4.65, end: 6.65, text: "to the internet." },
      { start: 6.65, end: 9, text: "The key that opens the door" },
      { start: 9, end: 10.5, text: "comes directly from" },
      { start: 10.5, end: 12.120813, text: "the Genesis layer." },
    ]),
  },
  {
    id: "builder",
    start: 24.915251,
    end: 38.786271,
    captions: freezeEntries([
      { start: 0, end: 2.2, text: "The agent now requests" },
      { start: 2.2, end: 4.38, text: "a building playground." },
      { start: 4.38, end: 5.75, text: "Once it is set up," },
      { start: 5.75, end: 7.45, text: "the agent can create Rust code" },
      { start: 7.45, end: 9.4, text: "inside a safe environment." },
      { start: 9.4, end: 10.8, text: "It also contains" },
      { start: 10.8, end: 13.87102, text: "a Rust compiler and a guard." },
    ]),
  },
  {
    id: "compiler-fail",
    start: 42.25,
    end: 51.523438,
    captions: freezeEntries([
      { start: 0, end: 1.9, text: "The compiler compiles Rust" },
      { start: 1.9, end: 3.55, text: "into Wasm code." },
      { start: 3.55, end: 5.85, text: "Or it does NOT. God dammit." },
      { start: 5.85, end: 9.273438, text: "Let's try that again." },
    ]),
  },
]);

export const FILM_STATUS_WINDOWS = freezeEntries([
  { start: 42.25, end: 46, tone: "active", text: "COMPILER · ROUND 01" },
  { start: 46, end: 52.55, tone: "error", text: "FAILED · PRECISE REPORT" },
  { start: 53.25, end: 55.4, tone: "active", text: "COMPILER · ROUND 02" },
  { start: 55.4, end: 56.05, tone: "success", text: "COMPILE OK" },
  { start: 62, end: 69.35, tone: "active", text: "REPRODUCIBLE TWIN BUILD" },
  { start: 69.35, end: 70, tone: "success", text: "BYTE EQUAL" },
  { start: 80, end: 84.55, tone: "active", text: "GUARD · VERIFYING BINDINGS" },
  { start: 84.55, end: 88, tone: "success", text: "OWNER APPROVED" },
  { start: 88, end: 96, tone: "success", text: "LIVE DOOR OPEN" },
  { start: 96, end: 106, tone: "active", text: "PLAYER RUNNING" },
  { start: 106, end: 112, tone: "active", text: "PRIVATE APP ISLAND" },
  { start: 112, end: 120, tone: "success", text: "21 ISOLATED APP ISLANDS" },
]);

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

export function voiceCaptionAt(time) {
  const cue = FILM_VOICE_CUES.find(({ start, end }) => time >= start && time < end);
  if (!cue) return Object.freeze({ id: "", text: "", opacity: 0 });
  const localTime = time - cue.start;
  const caption = cue.captions.find(({ start, end }) => localTime >= start && localTime < end);
  if (!caption) return Object.freeze({ id: cue.id, text: "", opacity: 0 });
  const fadeIn = smoothstep((time - cue.start) / 0.18);
  const fadeOut = 1 - smoothstep((time - (cue.end - 0.18)) / 0.18);
  return Object.freeze({ id: cue.id, text: caption.text, opacity: Math.min(fadeIn, fadeOut) });
}

export function filmStatusAt(time) {
  return FILM_STATUS_WINDOWS.find(({ start, end }) => time >= start && time < end) ?? null;
}
