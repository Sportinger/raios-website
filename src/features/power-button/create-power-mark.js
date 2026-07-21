import * as THREE from "three";

export function createPowerMark(color) {
  const material = new THREE.MeshBasicMaterial({ color, transparent: true });
  const group = new THREE.Group();

  const arcPoints = [];
  for (let index = 0; index <= 28; index += 1) {
    const angle = THREE.MathUtils.lerp(-Math.PI * 0.25, Math.PI * 1.25, index / 28);
    arcPoints.push(new THREE.Vector3(
      Math.cos(angle) * 0.31,
      0,
      Math.sin(angle) * 0.31,
    ));
  }
  const arc = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPoints), 42, 0.032, 8, false),
    material,
  );
  group.add(arc);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.34, 12), material);
  stem.rotation.x = Math.PI / 2;
  stem.position.z = -0.16;
  group.add(stem);

  group.position.y = 0.158;
  return { group, material };
}
