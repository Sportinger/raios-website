import * as THREE from "three";
import {
  FILM_LAYER_HEIGHT,
  FOUNDATION_PRESENTATION_SCALE,
} from "./layout-constants.js";
import { createOriginalThreeCameraMapper } from "./presentation/index.js";

const VIEW_HEIGHT = 23;
const CAMERA_DISTANCE = 44;
const CAMERA_DIRECTION = new THREE.Vector3(1, 0.8164965809, 1).normalize();
const COMPOSITION_VERTICAL_OFFSET = 0.9;
const INTRO_SIDE_VIEW = Object.freeze({
  holdUntil: 13,
  transitionEnd: 15.3,
  azimuthOffset: -Math.PI / 4,
});
const RUST_KERNEL_MID_HEIGHT = FILM_LAYER_HEIGHT * FOUNDATION_PRESENTATION_SCALE / 2;
const INTRO_SIDE_DIRECTION = CAMERA_DIRECTION.clone()
  .setY(0)
  .normalize()
  .applyAxisAngle(new THREE.Vector3(0, 1, 0), INTRO_SIDE_VIEW.azimuthOffset)
  .normalize();

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
  const filmTarget = new THREE.Vector3();
  const filmPosition = new THREE.Vector3();
  const sideTarget = new THREE.Vector3();
  const sidePosition = new THREE.Vector3();
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
    const introMix = THREE.MathUtils.smootherstep(
      time,
      INTRO_SIDE_VIEW.holdUntil,
      INTRO_SIDE_VIEW.transitionEnd,
    );
    if (introMix >= 1) return;

    filmTarget.copy(mapper.target);
    filmPosition.copy(camera.position);
    sideTarget.set(filmTarget.x, RUST_KERNEL_MID_HEIGHT, filmTarget.z);
    sidePosition.copy(sideTarget).addScaledVector(INTRO_SIDE_DIRECTION, CAMERA_DISTANCE);
    mapper.target.lerpVectors(sideTarget, filmTarget, introMix);
    camera.position.lerpVectors(sidePosition, filmPosition, introMix);
    camera.lookAt(mapper.target);
    camera.updateMatrixWorld();
  };

  resize(1, 1);
  setTime(0);

  return { camera, resize, setTime, target: mapper.target };
}
