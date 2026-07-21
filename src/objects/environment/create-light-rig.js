import * as THREE from "three";

const HEMISPHERE_INTENSITY = 1.15;
const KEY_INTENSITY = 3.8;

export function createLightRig() {
  const group = new THREE.Group();
  group.name = "light-rig";

  const hemisphereLight = new THREE.HemisphereLight(
    0x8cc3ff,
    0x020408,
    HEMISPHERE_INTENSITY,
  );
  group.add(hemisphereLight);

  const keyLight = new THREE.DirectionalLight(0xb9d9ff, KEY_INTENSITY);
  keyLight.position.set(4, 7, 6);
  group.add(keyLight);

  return {
    group,

    setIntensity(value) {
      const intensity = THREE.MathUtils.clamp(value, 0, 1);
      hemisphereLight.intensity = HEMISPHERE_INTENSITY * intensity;
      keyLight.intensity = KEY_INTENSITY * intensity;
    },
  };
}
