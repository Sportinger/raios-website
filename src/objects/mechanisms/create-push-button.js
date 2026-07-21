import * as THREE from "three";
import { smootherstep } from "../../animation/progress.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";

const CAP_REST_Y = 0.19;
const PRESS_DEPTH = 0.17;

export function createPushButton({ accentColor = 0x78c8ff, topMark = null } = {}) {
  const group = new THREE.Group();
  group.name = "push-button";

  const housingMaterial = new THREE.MeshStandardMaterial({
    color: 0x171a1e,
    metalness: 0.72,
    roughness: 0.28,
    transparent: true,
  });
  const housing = new THREE.Mesh(
    new THREE.CylinderGeometry(1.06, 1.2, 0.38, 64),
    housingMaterial,
  );
  housing.position.y = -0.19;
  housing.castShadow = true;
  housing.receiveShadow = true;
  group.add(housing);

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0x3b4147,
    emissive: accentColor,
    emissiveIntensity: 0,
    metalness: 0.64,
    roughness: 0.24,
    transparent: true,
  });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.105, 20, 72), rimMaterial);
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.015;
  rim.castShadow = true;
  rim.receiveShadow = true;
  group.add(rim);

  const capMaterial = new THREE.MeshStandardMaterial({
    color: 0x292e33,
    emissive: accentColor,
    emissiveIntensity: 0,
    metalness: 0.52,
    roughness: 0.32,
    transparent: true,
  });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.67, 0.7, 0.3, 64), capMaterial);
  cap.position.y = CAP_REST_Y;
  cap.castShadow = true;
  cap.receiveShadow = true;
  group.add(cap);
  if (topMark) {
    topMark.group.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    cap.add(topMark.group);
  }

  const underglowMaterial = new THREE.MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const underglow = new THREE.Mesh(
    new THREE.RingGeometry(0.77, 1.08, 72),
    underglowMaterial,
  );
  underglow.rotation.x = -Math.PI / 2;
  underglow.position.y = 0.025;
  underglow.renderOrder = 3;
  group.add(underglow);

  const materials = [housingMaterial, rimMaterial, capMaterial];
  let opacity = 1;
  let power = 0;

  const renderGlow = () => {
    underglowMaterial.opacity = 0.5 * power * opacity;
  };

  return {
    group,

    setOpacity(value) {
      opacity = value;
      materials.forEach((material) => { material.opacity = opacity; });
      if (topMark?.material) topMark.material.opacity = opacity;
      renderGlow();
    },

    setPowerProgress(value) {
      power = smootherstep(value);
      capMaterial.emissiveIntensity = THREE.MathUtils.lerp(0, 2.8, power);
      rimMaterial.emissiveIntensity = THREE.MathUtils.lerp(0, 1.5, power);
      if (topMark?.material) {
        topMark.material.color.setHex(accentColor).lerp(new THREE.Color(0xffffff), power * 0.45);
      }
      renderGlow();
    },

    setPressProgress(value) {
      cap.position.y = CAP_REST_Y - PRESS_DEPTH * smootherstep(value);
    },

    dispose() {
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
