export function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function intervalProgress(value, start, end) {
  return clamp((value - start) / Math.max(0.0001, end - start));
}

export function smootherstep(value) {
  const progress = clamp(value);
  return progress * progress * progress * (progress * (progress * 6 - 15) + 10);
}
