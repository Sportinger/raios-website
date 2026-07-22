import { FILM_NARRATION_TRACKS } from "./film-narration-data.js";

const freezeEntries = (entries) => Object.freeze(entries.map((entry) => Object.freeze(entry)));
const narrationTrackById = new Map(FILM_NARRATION_TRACKS.map((track) => [track.id, track]));

function captionCue(id, captions) {
  const track = narrationTrackById.get(id);
  if (!track) throw new ReferenceError(`Caption cue has no narration track: ${id}`);
  return {
    id,
    start: track.animationStart,
    end: track.animationEnd,
    captions: freezeEntries(captions),
  };
}

export const FILM_VOICE_CUES = freezeEntries([
  captionCue("kernel", [
    { start: 0, end: 2, text: "The base is a custom" },
    { start: 2, end: 3.84, text: "Rust kernel." },
  ]),
  captionCue("genesis", [
    { start: 0, end: 1.95, text: "On top of that, we have" },
    { start: 1.95, end: 3.761625, text: "the Genesis layer." },
  ]),
  captionCue("agent", [
    { start: 0, end: 2.45, text: "Now we can spawn an agent." },
    { start: 2.45, end: 4.65, text: "It gets granted access" },
    { start: 4.65, end: 6.65, text: "to the internet." },
    { start: 6.65, end: 9, text: "The key that opens the door" },
    { start: 9, end: 10.5, text: "comes directly from" },
    { start: 10.5, end: 12.120813, text: "the Genesis layer." },
  ]),
  captionCue("builder", [
    { start: 0, end: 2.2, text: "The agent now requests" },
    { start: 2.2, end: 4.38, text: "a building playground." },
    { start: 4.38, end: 5.75, text: "Once it is set up," },
    { start: 5.75, end: 7.45, text: "the agent can create Rust code" },
    { start: 7.45, end: 9.4, text: "inside a safe environment." },
    { start: 9.4, end: 10.8, text: "It also contains" },
    { start: 10.8, end: 13.87102, text: "a Rust compiler and a guard." },
  ]),
  captionCue("compiler-fail", [
    { start: 0, end: 1.9, text: "The compiler compiles Rust" },
    { start: 1.9, end: 3.55, text: "into Wasm code." },
    { start: 3.55, end: 5.85, text: "Or it does NOT. God dammit." },
    { start: 5.85, end: 9.273438, text: "Let's try that again." },
  ]),
  captionCue("feedback-fix", [
    { start: 0, end: 2.55, text: "The failure returns a precise report." },
    { start: 2.55, end: 5.8, text: "The agent fixes the source and compiles again." },
  ]),
  captionCue("shadow-rehearsal-fail", [
    { start: 0, end: 3, text: "A disposable Shadow VM opens." },
    { start: 3, end: 6.2, text: "A ghost copy receives only mocked input and files." },
    { start: 6.2, end: 9.2, text: "The replay reaches only 653 of 654 claims." },
    { start: 9.2, end: 12, text: "The frame hash mismatches. The test fails closed." },
  ]),
  captionCue("twin-build-fix", [
    { start: 0, end: 4.35, text: "The mismatch returns as a precise report." },
    { start: 4.35, end: 10.4, text: "After the fix, two independent builds produce exactly the same bytes." },
  ]),
  captionCue("shadow-acts", [
    { start: 0, end: 5.5, text: "The corrected program repeats the claims test." },
    { start: 5.5, end: 10.8, text: "This time, all 654 claims lock." },
    { start: 11.8, end: 15, text: "Two fresh cells run the same test at the same time." },
    { start: 15, end: 18.3, text: "Their divergence falls to zero across the comparison bridge." },
    { start: 19.3, end: 23.5, text: "A third cell attacks every boundary." },
    { start: 23.5, end: 27, text: "Seven attacks. Seven fail-closed walls." },
    { start: 27, end: 27.8, text: "Only then does the tester hand over the proof." },
  ]),
  captionCue("guard-bindings", [
    { start: 0, end: 4.9, text: "The guard binds the compiler package and all three test seals." },
    { start: 4.9, end: 8, text: "Owner approval opens the live door." },
  ]),
  captionCue("live-release", [
    { start: 0, end: 3.55, text: "The approved program leaves the Builder layer." },
    { start: 3.55, end: 8, text: "Every disposable door, cable, and machine closes behind it." },
  ]),
  captionCue("compact-domain", [
    { start: 0, end: 6, text: "Now the complete player domain contracts into one private app island." },
  ]),
  captionCue("archipelago", [
    { start: 0, end: 4, text: "Every app receives its own isolated island:" },
    { start: 4, end: 8, text: "sixty apps, sixty boundaries, on one shared Rust kernel." },
  ]),
]);

export const FILM_STATUS_WINDOWS = freezeEntries([
  { start: 42.25, end: 46, tone: "active", text: "COMPILER · ROUND 01" },
  { start: 46, end: 52.55, tone: "error", text: "FAILED · PRECISE REPORT" },
  { start: 53.25, end: 55.4, tone: "active", text: "COMPILER · ROUND 02" },
  { start: 55.4, end: 56.05, tone: "success", text: "COMPILE OK" },
  { start: 57.8, end: 67.9, tone: "active", text: "SHADOW VM · CLAIM REHEARSAL" },
  { start: 67.9, end: 69.8, tone: "error", text: "FAILED · 653 / 654 · FRAME HASH MISMATCH" },
  { start: 71, end: 78.35, tone: "active", text: "REPRODUCIBLE TWIN BUILD" },
  { start: 78.35, end: 79, tone: "success", text: "BYTE EQUAL" },
  { start: 80.2, end: 91, tone: "active", text: "TEST 1 · CLAIMS · LILAC" },
  { start: 92, end: 98.5, tone: "active", text: "TEST 2 · PARALLEL DIVERGENCE · AMBER" },
  { start: 99.5, end: 107.2, tone: "error", text: "TEST 3 · FAIL-CLOSED · ICE" },
  { start: 107.2, end: 108, tone: "success", text: "3 / 3 TESTS PASSED" },
  { start: 108, end: 112.55, tone: "active", text: "GUARD · VERIFYING BINDINGS" },
  { start: 112.55, end: 116, tone: "success", text: "OWNER APPROVED" },
  { start: 116, end: 124, tone: "success", text: "LIVE DOOR OPEN" },
  { start: 124, end: 134, tone: "active", text: "PLAYER RUNNING" },
  { start: 134, end: 140, tone: "active", text: "PRIVATE APP ISLAND" },
  { start: 140, end: 148, tone: "success", text: "21 ISOLATED APP ISLANDS" },
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
