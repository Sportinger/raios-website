function assertVector(value, name) {
  if (!Array.isArray(value)
    || value.length !== 3
    || value.some((component) => !Number.isFinite(component))) {
    throw new Error(`${name} must contain exactly three numbers`);
  }
}

export function createLayerAnchor(position, size) {
  assertVector(position, "Layer anchor position");
  assertVector(size, "Layer anchor size");
  return Object.freeze({
    position: Object.freeze([...position]),
    size: Object.freeze([...size]),
  });
}
