import * as THREE from "three";
import { smootherstep } from "../../animation/progress.js";

const ORBIT_ANGLE = THREE.MathUtils.degToRad(-240);
const ORBIT_RADIUS = 2.05;
const REAR_HOLD = 0.18;

export function createOrbitingLight({ color = 0xffffff } = {}) {
  const group = new THREE.Group();
  group.name = "orbiting-light";

  const light = new THREE.PointLight(color, 0, 5.8, 2);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.near = 0.05;
  light.shadow.camera.far = 6;
  light.shadow.bias = -0.001;
  light.shadow.radius = 0;
  group.add(light);

  return {
    group,

    setProgress(value) {
      const orbitProgress = smootherstep(
        (value - REAR_HOLD) / (1 - REAR_HOLD),
      );
      const angle = orbitProgress * ORBIT_ANGLE;
      const fadeIn = smootherstep(value / 0.08);
      const fadeOut = smootherstep((1 - value) / 0.08);

      group.position.set(
        Math.sin(angle) * ORBIT_RADIUS,
        -Math.cos(angle) * ORBIT_RADIUS,
        0,
      );
      light.intensity = fadeIn * fadeOut * 7.8;
    },

    dispose() {
      group.removeFromParent();
    },
  };
}
