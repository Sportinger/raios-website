import * as THREE from "three";

export function createPowerMark(color) {
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0,
    metalness: 0.32,
    roughness: 0.34,
    transparent: true,
  });
  const glowMaterial = new THREE.MeshBasicMaterial({
    color,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0,
    transparent: true,
    toneMapped: false,
  });
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
  const arcCurve = new THREE.CatmullRomCurve3(arcPoints);
  const arc = new THREE.Mesh(
    new THREE.TubeGeometry(arcCurve, 42, 0.032, 8, false),
    material,
  );
  group.add(arc);
  const arcGlow = new THREE.Mesh(
    new THREE.TubeGeometry(arcCurve, 42, 0.068, 8, false),
    glowMaterial,
  );
  arcGlow.renderOrder = 7;
  group.add(arcGlow);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.34, 12), material);
  stem.rotation.x = Math.PI / 2;
  stem.position.z = -0.16;
  group.add(stem);
  const stemGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.068, 0.34, 12),
    glowMaterial,
  );
  stemGlow.rotation.copy(stem.rotation);
  stemGlow.position.copy(stem.position);
  stemGlow.renderOrder = 7;
  group.add(stemGlow);

  group.position.y = 0.158;
  return { glowMaterial, group, material };
}
