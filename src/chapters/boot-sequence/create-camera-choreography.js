import * as THREE from "three";

const BOOT_CAMERA_POSES = Object.freeze([
  Object.freeze({
    position: Object.freeze([6.9, 5.35, 7.7]),
    target: Object.freeze([0, -0.52, 0]),
  }),
  Object.freeze({
    position: Object.freeze([6.15, 3.75, 7.25]),
    target: Object.freeze([-0.55, -0.12, 0.35]),
  }),
  Object.freeze({
    position: Object.freeze([8.35, 3.15, 6.25]),
    target: Object.freeze([2.35, -0.28, 0.72]),
  }),
  Object.freeze({
    position: Object.freeze([6.75, 3.45, 5.75]),
    target: Object.freeze([0.85, 0.35, -0.62]),
  }),
  Object.freeze({
    position: Object.freeze([5.65, 4.55, 6.65]),
    target: Object.freeze([0.45, 1.08, -0.3]),
  }),
  Object.freeze({
    position: Object.freeze([4.95, 5.25, 7.15]),
    target: Object.freeze([0, 1.55, 0]),
  }),
  Object.freeze({
    position: Object.freeze([4.35, 3.65, 6.05]),
    target: Object.freeze([0.1, 1.05, -0.45]),
  }),
]);

export function createBootCameraChoreography(cameraRig) {
  const track = cameraRig.createHomeboundPoseTrack({
    positions: BOOT_CAMERA_POSES.map(({ position }) => (
      new THREE.Vector3().fromArray(position)
    )),
    targets: BOOT_CAMERA_POSES.map(({ target }) => (
      new THREE.Vector3().fromArray(target)
    )),
  });

  return {
    update(sceneIndex, progress) {
      track.update(sceneIndex, progress);
    },
  };
}
