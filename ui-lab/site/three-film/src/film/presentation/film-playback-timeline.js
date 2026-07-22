import { FILM_ANIMATION_DURATION } from "../film-data.js";
import { FILM_NARRATION_TRACKS } from "./film-narration-data.js";

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

function mapBetweenAnchors(value, anchors, sourceKey, targetKey) {
  for (let index = 1; index < anchors.length; index += 1) {
    const left = anchors[index - 1];
    const right = anchors[index];
    if (value <= right[sourceKey]) {
      const progress = (value - left[sourceKey]) / (right[sourceKey] - left[sourceKey]);
      return left[targetKey] + progress * (right[targetKey] - left[targetKey]);
    }
  }
  return anchors[anchors.length - 1][targetKey];
}

function buildCueAnchors(track, playbackStart) {
  const anchors = [
    { animationTime: track.animationStart, playbackTime: playbackStart },
    ...track.syncPoints.map(({ animationOffset, audioOffset }) => ({
      animationTime: track.animationStart + animationOffset,
      playbackTime: playbackStart + audioOffset,
    })),
    {
      animationTime: track.animationEnd,
      playbackTime: playbackStart + track.duration,
    },
  ];

  for (let index = 1; index < anchors.length; index += 1) {
    const previous = anchors[index - 1];
    const current = anchors[index];
    if (
      current.animationTime <= previous.animationTime
      || current.playbackTime <= previous.playbackTime
    ) {
      throw new RangeError(`Narration sync points are not monotonic: ${track.id}`);
    }
  }

  return Object.freeze(anchors.map((anchor) => Object.freeze(anchor)));
}

function buildPlaybackCues(tracks) {
  let previousAnimationEnd = 0;
  let accumulatedOffset = 0;

  return Object.freeze(tracks.map((track) => {
    const animationDuration = track.animationEnd - track.animationStart;
    if (track.animationStart < previousAnimationEnd) {
      throw new RangeError(`Narration cue overlaps its predecessor: ${track.id}`);
    }
    if (animationDuration <= 0 || track.duration <= 0) {
      throw new RangeError(`Narration cue has an invalid duration: ${track.id}`);
    }

    const start = track.animationStart + accumulatedOffset;
    const end = start + track.duration;
    const anchors = buildCueAnchors(track, start);
    accumulatedOffset += track.duration - animationDuration;
    previousAnimationEnd = track.animationEnd;
    return Object.freeze({ ...track, start, end, anchors });
  }));
}

export const FILM_NARRATION_AUDIO_CUES = buildPlaybackCues(FILM_NARRATION_TRACKS);

const finalCue = FILM_NARRATION_AUDIO_CUES[FILM_NARRATION_AUDIO_CUES.length - 1];
const finalOffset = finalCue.end - finalCue.animationEnd;
export const FILM_PLAYBACK_DURATION = FILM_ANIMATION_DURATION + finalOffset;

export function playbackTimeAtAnimationTime(time) {
  const animationTime = clamp(Number(time) || 0, 0, FILM_ANIMATION_DURATION);
  let offset = 0;

  for (const cue of FILM_NARRATION_AUDIO_CUES) {
    if (animationTime < cue.animationStart) return animationTime + offset;
    if (animationTime <= cue.animationEnd) {
      return mapBetweenAnchors(
        animationTime,
        cue.anchors,
        "animationTime",
        "playbackTime",
      );
    }
    offset = cue.end - cue.animationEnd;
  }

  return animationTime + offset;
}

export function animationTimeAtPlaybackTime(time) {
  const playbackTime = clamp(Number(time) || 0, 0, FILM_PLAYBACK_DURATION);
  let offset = 0;

  for (const cue of FILM_NARRATION_AUDIO_CUES) {
    if (playbackTime < cue.start) return playbackTime - offset;
    if (playbackTime <= cue.end) {
      return mapBetweenAnchors(
        playbackTime,
        cue.anchors,
        "playbackTime",
        "animationTime",
      );
    }
    offset = cue.end - cue.animationEnd;
  }

  return playbackTime - offset;
}
