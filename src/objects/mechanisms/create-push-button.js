import * as THREE from "three";
import { smootherstep } from "../../animation/progress.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";

const CAP_REST_Y = 0.19;
const HOUSING_HEIGHT = 0.076;
const PRESS_DEPTH = 0.17;

export function createPushButton({
  accentColor = 0x78c8ff,
  markGlowColor = 0x69c7ff,
  topMark = null,
} = {}) {
  const group = new THREE.Group();
  group.name = "push-button";

  const housingMaterial = new THREE.MeshStandardMaterial({
    color: 0x171a1e,
    metalness: 0.72,
    roughness: 0.28,
    transparent: true,
  });
  const housing = new THREE.Mesh(
    new THREE.CylinderGeometry(1.06, 1.2, HOUSING_HEIGHT, 64),
    housingMaterial,
  );
  housing.position.y = -HOUSING_HEIGHT / 2;
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
  const markOffColor = new THREE.Color(0x555d64);
  const markPowerColor = new THREE.Color(markGlowColor);
  const markHotColor = new THREE.Color(0xffffff);
  let opacity = 1;
  let power = 0;
  let markGlow = 0;

  const renderGlow = () => {
    underglowMaterial.opacity = 0.5 * power * opacity;
    if (topMark?.light) {
      topMark.light.intensity = 0.8 * markGlow * opacity;
    }
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
      renderGlow();
    },

    setMarkGlowProgress(value) {
      markGlow = smootherstep(value);
      if (topMark?.material) {
        topMark.material.color.copy(markOffColor)
          .lerp(markPowerColor, markGlow)
          .lerp(markHotColor, markGlow * 0.22);
        topMark.material.emissive.copy(markPowerColor);
        topMark.material.emissiveIntensity = markGlow * 2.2;
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
