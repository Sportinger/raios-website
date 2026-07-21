import * as THREE from "three";
import { smootherstep } from "../../animation/progress.js";

const ORBIT_ANGLE = THREE.MathUtils.degToRad(240);
const ORBIT_RADIUS = 1.72;

export function createOrbitingLight({ color = 0xffffff } = {}) {
  const group = new THREE.Group();
  group.name = "orbiting-light";

  const light = new THREE.PointLight(color, 0, 5.2, 2);
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
      const progress = smootherstep(value);
      const angle = progress * ORBIT_ANGLE;
      const fadeIn = smootherstep(Math.min(1, progress / 0.08));
      const fadeOut = smootherstep(Math.min(1, (1 - progress) / 0.08));

      group.position.set(
        Math.sin(angle) * ORBIT_RADIUS,
        -Math.cos(angle) * ORBIT_RADIUS,
        0,
      );
      light.intensity = fadeIn * fadeOut * 7.4;
    },

    dispose() {
      group.removeFromParent();
    },
  };
}
