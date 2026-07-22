import * as THREE from "three";
import { createOriginalThreeCameraMapper } from "./presentation/index.js";

const VIEW_HEIGHT = 23;
const CAMERA_DISTANCE = 44;
const CAMERA_DIRECTION = new THREE.Vector3(1, 0.8164965809, 1).normalize();
const COMPOSITION_VERTICAL_OFFSET = 2.2;
const CAMERA_ORBIT_AXIS = new THREE.Vector3(0, 1, 0);

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (value) => {
  const amount = clamp01(value);
  return amount * amount * (3 - 2 * amount);
};

function orbitPulse(time, start, peak, end) {
  if (time <= start || time >= end) return 0;
  if (time <= peak) return smoothstep((time - start) / (peak - start));
  return 1 - smoothstep((time - peak) / (end - peak));
}

function cinematicOrbitAt(time) {
  const builderOrbit = THREE.MathUtils.degToRad(-28)
    * orbitPulse(time, 24.2, 30.2, 39);
  const failedShadowOrbit = THREE.MathUtils.degToRad(24)
    * orbitPulse(time, 57.6, 64, 70.4);
  const shadowActsOrbit = THREE.MathUtils.degToRad(38)
    * smoothstep((time - 80.2) / (107.2 - 80.2))
    * (1 - smoothstep((time - 107.2) / (110.2 - 107.2)));
  return builderOrbit + failedShadowOrbit + shadowActsOrbit;
}

export function createFilmCamera() {
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 160);
  camera.up.set(0, 1, 0);
  const mapper = createOriginalThreeCameraMapper(camera, {
    baseTarget: new THREE.Vector3(0, 1.6 + COMPOSITION_VERTICAL_OFFSET, 0),
    cameraDirection: CAMERA_DIRECTION,
    cameraDistance: CAMERA_DISTANCE,
    worldWidth: 31,
    worldHeight: 20,
  });
  let viewportWidth = 1;
  let viewportHeight = 1;

  const resize = (width, height) => {
    viewportWidth = Math.max(1, width);
    viewportHeight = Math.max(1, height);
    const aspect = viewportWidth / viewportHeight;
    camera.left = -VIEW_HEIGHT * aspect / 2;
    camera.right = VIEW_HEIGHT * aspect / 2;
    camera.top = VIEW_HEIGHT / 2;
    camera.bottom = -VIEW_HEIGHT / 2;
    camera.updateProjectionMatrix();
  };

  const setTime = (time) => {
    mapper.setTime(time, viewportWidth, viewportHeight);
    const orbitAngle = cinematicOrbitAt(time);
    if (Math.abs(orbitAngle) > 0.000001) {
      camera.position.sub(mapper.target).applyAxisAngle(CAMERA_ORBIT_AXIS, orbitAngle)
        .add(mapper.target);
      camera.lookAt(mapper.target);
      camera.updateMatrixWorld();
    }
  };

  resize(1, 1);
  setTime(0);

  return { camera, resize, setTime, target: mapper.target };
}
