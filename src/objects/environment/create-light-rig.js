import * as THREE from "three";

const HEMISPHERE_INTENSITY = 0.72;
const SUN_INTENSITY = 5.2;

export function createLightRig() {
  const group = new THREE.Group();
  group.name = "light-rig";

  const hemisphereLight = new THREE.HemisphereLight(
    0xb9d7ec,
    0x080706,
    HEMISPHERE_INTENSITY,
  );
  group.add(hemisphereLight);

  const sunLight = new THREE.DirectionalLight(0xffe0a3, SUN_INTENSITY);
  sunLight.name = "warm-sun-light";
  sunLight.position.set(-5, 9, 6);
  group.add(sunLight);

  return {
    group,

    setIntensity(value) {
      const intensity = THREE.MathUtils.clamp(value, 0, 1);
      hemisphereLight.intensity = HEMISPHERE_INTENSITY * intensity;
      sunLight.intensity = SUN_INTENSITY * intensity;
    },
  };
}
