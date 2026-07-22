import * as THREE from "three";
import { smootherstep } from "../../animation/progress.js";

const clampProgress = (value) => THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
const copyTuple = (value, fallback) => (
  Array.isArray(value) && value.length === 3
    ? value.map((entry, index) => Number.isFinite(Number(entry)) ? Number(entry) : fallback[index])
    : [...fallback]
);

export const clonePose = (pose) => ({
  fov: Number(pose.fov),
  position: [...pose.position],
  target: [...pose.target],
  up: [...pose.up],
});

export function normalizeKeyframe(keyframe) {
  return {
    continuous: keyframe.continuous === true,
    easing: keyframe.easing === "linear" ? "linear" : "smooth",
    fov: THREE.MathUtils.clamp(Number(keyframe.fov) || 32, 1, 160),
    id: String(keyframe.id || crypto.randomUUID()),
    label: String(keyframe.label || "Keyframe"),
    position: copyTuple(keyframe.position, [0, 0, 5]),
    progress: clampProgress(keyframe.progress),
    target: copyTuple(keyframe.target, [0, 0, 0]),
    up: copyTuple(keyframe.up, [0, 1, 0]),
  };
}

export function sortKeyframes(keyframes) {
  return keyframes.map(normalizeKeyframe).sort((a, b) => (
    a.progress - b.progress || a.id.localeCompare(b.id)
  ));
}

export function evaluateCameraTrack(keyframes, progress) {
  if (!keyframes.length) return null;
  const sorted = sortKeyframes(keyframes);
  const clamped = clampProgress(progress);
  if (clamped <= sorted[0].progress) return clonePose(sorted[0]);
  const last = sorted.at(-1);
  if (clamped >= last.progress) return clonePose(last);

  const endIndex = sorted.findIndex((keyframe) => keyframe.progress >= clamped);
  const start = sorted[endIndex - 1];
  const end = sorted[endIndex];
  const duration = Math.max(Number.EPSILON, end.progress - start.progress);
  const rawProgress = (clamped - start.progress) / duration;
  const usesContinuousTangent = start.continuous || end.continuous;
  const mix = start.easing === "linear" ? rawProgress : smootherstep(rawProgress);
  const lerpTuple = (from, to) => from.map((value, index) => (
    THREE.MathUtils.lerp(value, to[index], mix)
  ));
  const derivativeAt = (keyframeIndex, getter) => {
    const previous = sorted[Math.max(0, keyframeIndex - 1)];
    const next = sorted[Math.min(sorted.length - 1, keyframeIndex + 1)];
    const timeSpan = Math.max(Number.EPSILON, next.progress - previous.progress);
    return (getter(next) - getter(previous)) / timeSpan;
  };
  const hermite = (from, to, fromDerivative, toDerivative) => {
    const t = rawProgress;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * from
      + (t3 - 2 * t2 + t) * duration * fromDerivative
      + (-2 * t3 + 3 * t2) * to
      + (t3 - t2) * duration * toDerivative;
  };
  const interpolateValue = (getter) => {
    if (!usesContinuousTangent) {
      return THREE.MathUtils.lerp(getter(start), getter(end), mix);
    }
    return hermite(
      getter(start),
      getter(end),
      start.continuous ? derivativeAt(endIndex - 1, getter) : 0,
      end.continuous ? derivativeAt(endIndex, getter) : 0,
    );
  };
  const interpolateTuple = (property) => start[property].map((value, index) => (
    interpolateValue((keyframe) => keyframe[property][index])
  ));

  return {
    fov: interpolateValue((keyframe) => keyframe.fov),
    position: usesContinuousTangent ? interpolateTuple("position") : lerpTuple(start.position, end.position),
    target: usesContinuousTangent ? interpolateTuple("target") : lerpTuple(start.target, end.target),
    up: usesContinuousTangent ? interpolateTuple("up") : lerpTuple(start.up, end.up),
  };
}
