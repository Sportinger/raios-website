import * as THREE from "three";
import { BARE_METAL_TOP_DOWN_POSE } from "../shared/camera-poses.js";

const BOOT_CAMERA_POSES = Object.freeze([
  Object.freeze({
    position: Object.freeze([0.25, 9.2, 0.3]),
    target: Object.freeze([0, -0.55, 0]),
    up: Object.freeze([0, 0, -1]),
  }),
  Object.freeze({
    position: Object.freeze([6.15, 3.75, 7.25]),
    target: Object.freeze([-0.55, -0.12, 0.35]),
    up: Object.freeze([0, 1, 0]),
  }),
  Object.freeze({
    position: Object.freeze([8.35, 3.15, 6.25]),
    target: Object.freeze([2.35, -0.28, 0.72]),
    up: Object.freeze([0, 1, 0]),
  }),
  Object.freeze({
    position: Object.freeze([6.75, 3.45, 5.75]),
    target: Object.freeze([0.85, 0.35, -0.62]),
    up: Object.freeze([0, 1, 0]),
  }),
  Object.freeze({
    position: Object.freeze([5.65, 4.55, 6.65]),
    target: Object.freeze([0.45, 1.08, -0.3]),
    up: Object.freeze([0, 1, 0]),
  }),
  Object.freeze({
    position: Object.freeze([4.95, 5.25, 7.15]),
    target: Object.freeze([0, 1.55, 0]),
    up: Object.freeze([0, 1, 0]),
  }),
  Object.freeze({
    position: Object.freeze([4.35, 3.65, 6.05]),
    target: Object.freeze([0.1, 1.05, -0.45]),
    up: Object.freeze([0, 1, 0]),
  }),
]);

export function createBootCameraChoreography(cameraRig) {
  const startPosition = new THREE.Vector3().fromArray(
    BARE_METAL_TOP_DOWN_POSE.position,
  );
  const startTarget = new THREE.Vector3().fromArray(
    BARE_METAL_TOP_DOWN_POSE.target,
  );
  const startUp = new THREE.Vector3().fromArray(
    BARE_METAL_TOP_DOWN_POSE.up,
  );
  const track = cameraRig.createHomeboundPoseTrack({
    startPosition,
    startTarget,
    startUp,
    positions: BOOT_CAMERA_POSES.map(({ position }) => (
      new THREE.Vector3().fromArray(position)
    )),
    targets: BOOT_CAMERA_POSES.map(({ target }) => (
      new THREE.Vector3().fromArray(target)
    )),
    ups: BOOT_CAMERA_POSES.map(({ up }) => (
      new THREE.Vector3().fromArray(up)
    )),
  });

  return {
    update(sceneIndex, progress) {
      track.update(sceneIndex, progress);
    },
  };
}
