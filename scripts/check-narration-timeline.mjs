import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { FILM_ANIMATION_DURATION } from "../src/film/film-data.js";
import {
  FILM_NARRATION_AUDIO_CUES,
  FILM_PLAYBACK_DURATION,
  animationTimeAtPlaybackTime,
  playbackTimeAtAnimationTime,
} from "../src/film/presentation/film-playback-timeline.js";

const AUDIO_TOLERANCE_SECONDS = 0.05;
const ROUND_TRIP_TOLERANCE_SECONDS = 1e-9;
const ffprobe = process.env.FFPROBE_PATH || "ffprobe";

function probeDuration(source) {
  const result = spawnSync(ffprobe, [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    fileURLToPath(source),
  ], { encoding: "utf8" });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `ffprobe failed for ${source}`);
  }
  const duration = Number.parseFloat(result.stdout.trim());
  if (!Number.isFinite(duration)) throw new TypeError(`Invalid duration for ${source}`);
  return duration;
}

let failed = false;
console.log("Narration cue                         source      slot      rate");
for (const cue of FILM_NARRATION_AUDIO_CUES) {
  const forwardDuration = probeDuration(cue.forwardUrl);
  const reverseDuration = probeDuration(cue.reverseUrl);
  const slotDuration = cue.end - cue.start;
  const playbackRate = forwardDuration / slotDuration;
  const sourceError = Math.abs(forwardDuration - cue.duration);
  const reverseError = Math.abs(reverseDuration - forwardDuration);
  const slotError = Math.abs(slotDuration - cue.duration);
  if (
    sourceError > AUDIO_TOLERANCE_SECONDS
    || reverseError > AUDIO_TOLERANCE_SECONDS
    || slotError > ROUND_TRIP_TOLERANCE_SECONDS
  ) failed = true;
  console.log(
    `${cue.id.padEnd(34)} ${forwardDuration.toFixed(3).padStart(7)} s`
      + ` ${slotDuration.toFixed(3).padStart(7)} s`
      + ` ${playbackRate.toFixed(6).padStart(9)}x`,
  );
}

let maximumRoundTripError = 0;
for (let time = 0; time <= FILM_ANIMATION_DURATION; time += 0.01) {
  const roundTrip = animationTimeAtPlaybackTime(playbackTimeAtAnimationTime(time));
  maximumRoundTripError = Math.max(maximumRoundTripError, Math.abs(time - roundTrip));
}
if (maximumRoundTripError > ROUND_TRIP_TOLERANCE_SECONDS) failed = true;

console.log(`Playback duration: ${FILM_PLAYBACK_DURATION.toFixed(6)} s`);
console.log(`Maximum timeline round-trip error: ${maximumRoundTripError}`);
if (failed) process.exitCode = 1;
