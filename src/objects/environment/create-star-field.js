import * as THREE from "three";

export function createStarField(count) {
  const positions = new Float32Array(count * 3);
  let seed = 0x5241494f;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * 28;
    positions[index * 3 + 1] = (random() - 0.25) * 18;
    positions[index * 3 + 2] = (random() - 0.5) * 24 - 4;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0x8cc3ff,
    size: 0.025,
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.name = "star-field";
  return points;
}
