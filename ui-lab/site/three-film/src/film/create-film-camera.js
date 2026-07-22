import * as THREE from "three";
import { createOriginalThreeCameraMapper } from "./presentation/index.js";

const VIEW_HEIGHT = 23;
const CAMERA_DISTANCE = 44;
const CAMERA_DIRECTION = new THREE.Vector3(1, 0.8164965809, 1).normalize();
const COMPOSITION_VERTICAL_OFFSET = 2.2;

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
  };

  resize(1, 1);
  setTime(0);

  return { camera, resize, setTime, target: mapper.target };
}
