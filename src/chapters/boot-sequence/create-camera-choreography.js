import * as THREE from "three";
import {
  intervalProgress,
  smootherstepWithMomentum,
} from "../../animation/progress.js";
import { BARE_METAL_BOOT_POSE } from "../shared/camera-poses.js";

const UEFI_ORBIT = Object.freeze({
  start: 0,
  end: 0.143,
  angle: THREE.MathUtils.degToRad(-70),
});

const BOOT_CAMERA_POSES = Object.freeze([
  Object.freeze({
    position: Object.freeze([7.8, 4.8, 8.6]),
    target: Object.freeze([-0.35, -0.58, 0.25]),
    up: Object.freeze([0, 1, 0]),
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
    BARE_METAL_BOOT_POSE.position,
  );
  const startTarget = new THREE.Vector3().fromArray(
    BARE_METAL_BOOT_POSE.target,
  );
  const startUp = new THREE.Vector3().fromArray(
    BARE_METAL_BOOT_POSE.up,
  );
  const uefiOrbit = cameraRig.createOrbit({
    center: startTarget,
    startPosition,
    angle: UEFI_ORBIT.angle,
    easing: (progress) => smootherstepWithMomentum(progress, 0.14),
  });
  const orbitRadius = uefiOrbit.endPosition.clone().sub(startTarget);
  const orbitTangent = new THREE.Vector3(
    orbitRadius.z,
    0,
    -orbitRadius.x,
  ).normalize().multiplyScalar(Math.sign(UEFI_ORBIT.angle));
  const orbitExitPosition = uefiOrbit.endPosition.clone()
    .addScaledVector(orbitTangent, 1.15)
    .add(new THREE.Vector3(0, 0.18, 0));
  const path = cameraRig.createHomeboundPath({
    positions: [
      uefiOrbit.endPosition,
      orbitExitPosition,
      ...BOOT_CAMERA_POSES.map(({ position }) => (
      new THREE.Vector3().fromArray(position)
      )),
    ],
    targets: [startTarget, startTarget, ...BOOT_CAMERA_POSES.map(({ target }) => (
      new THREE.Vector3().fromArray(target)
    ))],
    ups: [startUp, startUp, ...BOOT_CAMERA_POSES.map(({ up }) => (
      new THREE.Vector3().fromArray(up)
    ))],
    easing: (progress) => smootherstepWithMomentum(progress, 0.18),
  });

  return {
    update(progress) {
      if (progress <= UEFI_ORBIT.end) {
        uefiOrbit.update(intervalProgress(
          progress,
          UEFI_ORBIT.start,
          UEFI_ORBIT.end,
        ));
        return;
      }
      path.update(intervalProgress(progress, UEFI_ORBIT.end, 1));
    },
  };
}
