export const clamp01 = (value) => Math.min(1, Math.max(0, value));

export function interval(time, start, end) {
  if (end <= start) return time >= end ? 1 : 0;
  return clamp01((time - start) / (end - start));
}

export function smootherstep(value) {
  const t = clamp01(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function smoothstep(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

export function pulse(time, start, end) {
  const progress = interval(time, start, end);
  return Math.sin(progress * Math.PI) * Number(time >= start && time <= end);
}

export function showScene(group, time, scene, overlap = 0.45) {
  const visible = time >= scene.start - overlap && time <= scene.end + overlap;
  group.visible = visible;
  if (!visible) return 0;
  const enter = smootherstep(interval(time, scene.start - overlap, scene.start + overlap));
  const exit = 1 - smootherstep(interval(time, scene.end - overlap, scene.end + overlap));
  const alpha = Math.min(enter, exit);
  const scale = 0.94 + alpha * 0.06;
  group.scale.setScalar(scale);
  return alpha;
}
