import * as THREE from "three";
import { intervalProgress } from "../animation/progress.js";
import { FILM_CAMERA_KEYFRAMES } from "./film-data.js";

const VIEW_HEIGHT = 23;
const CAMERA_DISTANCE = 44;
const CAMERA_DIRECTION = new THREE.Vector3(1, 0.8164965809, 1).normalize();

const smoothstep = (value) => {
  const progress = THREE.MathUtils.clamp(value, 0, 1);
  return progress * progress * (3 - 2 * progress);
};

function cameraFrameAt(time) {
  let before = FILM_CAMERA_KEYFRAMES[0];
  let after = FILM_CAMERA_KEYFRAMES[FILM_CAMERA_KEYFRAMES.length - 1];
  for (let index = 1; index < FILM_CAMERA_KEYFRAMES.length; index += 1) {
    if (time <= FILM_CAMERA_KEYFRAMES[index].at) {
      before = FILM_CAMERA_KEYFRAMES[index - 1];
      after = FILM_CAMERA_KEYFRAMES[index];
      break;
    }
  }
  const mix = smoothstep(intervalProgress(time, before.at, after.at));
  return {
    focusX: THREE.MathUtils.lerp(before.focusX, after.focusX, mix),
    focusY: THREE.MathUtils.lerp(before.focusY, after.focusY, mix),
    scale: THREE.MathUtils.lerp(before.scale, after.scale, mix),
  };
}

export function createFilmCamera() {
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 160);
  camera.up.set(0, 1, 0);
  const target = new THREE.Vector3();
  const viewDirection = CAMERA_DIRECTION.clone().negate();
  const screenRight = new THREE.Vector3().crossVectors(viewDirection, camera.up).normalize();
  const screenUp = new THREE.Vector3().crossVectors(screenRight, viewDirection).normalize();
  let aspect = 1;

  const resize = (width, height) => {
    aspect = Math.max(1, width) / Math.max(1, height);
    camera.left = -VIEW_HEIGHT * aspect / 2;
    camera.right = VIEW_HEIGHT * aspect / 2;
    camera.top = VIEW_HEIGHT / 2;
    camera.bottom = -VIEW_HEIGHT / 2;
    camera.updateProjectionMatrix();
  };

  const setTime = (time) => {
    const frame = cameraFrameAt(time);
    target.set(0, 1.6, 0)
      .addScaledVector(screenRight, (frame.focusX - 0.5) * 31)
      .addScaledVector(screenUp, (0.5 - frame.focusY) * 20);
    camera.position.copy(target).addScaledVector(CAMERA_DIRECTION, CAMERA_DISTANCE);
    camera.zoom = frame.scale * 0.92;
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  };

  resize(1, 1);
  setTime(0);

  return { camera, resize, setTime, target };
}
