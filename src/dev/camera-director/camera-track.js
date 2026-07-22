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
  const mix = start.easing === "linear" ? rawProgress : smootherstep(rawProgress);
  const lerpTuple = (from, to) => from.map((value, index) => (
    THREE.MathUtils.lerp(value, to[index], mix)
  ));

  return {
    fov: THREE.MathUtils.lerp(start.fov, end.fov, mix),
    position: lerpTuple(start.position, end.position),
    target: lerpTuple(start.target, end.target),
    up: lerpTuple(start.up, end.up),
  };
}
