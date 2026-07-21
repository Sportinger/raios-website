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

export function arriveWithMomentum(value) {
  const progress = clamp(value);
  return progress * progress * (2 - progress);
}

export function departWithMomentum(value, initialVelocity = 0.35) {
  const progress = clamp(value);
  return initialVelocity * progress
    + (3 - 2 * initialVelocity) * progress * progress
    + (initialVelocity - 2) * progress * progress * progress;
}

export function fastThenSmooth(value, rushEnd = 0.22, rushDistance = 0.32) {
  const progress = clamp(value);
  if (progress <= rushEnd) {
    const rushProgress = progress / Math.max(0.0001, rushEnd);
    return (1 - Math.pow(1 - rushProgress, 3)) * rushDistance;
  }
  return rushDistance + (1 - rushDistance) * smootherstep(
    (progress - rushEnd) / Math.max(0.0001, 1 - rushEnd),
  );
}
