import * as THREE from "three";
import {
  intervalProgress,
  smootherstepWithMomentum,
} from "../../animation/progress.js";
import { BARE_METAL_BOOT_POSE } from "../shared/camera-poses.js";

const UEFI_REVEAL_ORBIT = Object.freeze({
  start: 0,
  end: 0.12772330827067677,
  angle: THREE.MathUtils.degToRad(-70),
});

const USB_RETURN_ORBIT = Object.freeze({
  // Stored in local boot progress so story weight changes do not retime the orbit.
  start: 0.12772330827067677,
  end: 0.17443609022556397,
  angle: THREE.MathUtils.degToRad(80),
});

const CAMERA_FREEZE = Object.freeze({
  // Final local boot pose; all later boot phases keep this camera state.
  progress: 0.18938947368421058,
  position: Object.freeze([
    10.181333473174197,
    5.311330455914445,
    7.905153963253411,
  ]),
  target: Object.freeze([
    0.02678466081151004,
    -0.547704171930442,
    -0.01913190057965003,
  ]),
});

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
  const uefiRevealOrbit = cameraRig.createOrbit({
    center: startTarget,
    startPosition,
    angle: UEFI_REVEAL_ORBIT.angle,
    easing: (progress) => smootherstepWithMomentum(progress, 0.14),
  });
  const usbReturnOrbit = cameraRig.createOrbit({
    center: startTarget,
    startPosition: uefiRevealOrbit.endPosition,
    angle: USB_RETURN_ORBIT.angle,
    easing: (progress) => smootherstepWithMomentum(progress, 0.14),
  });
  const freezeTransition = cameraRig.createPoseTransition({
    startPosition: usbReturnOrbit.endPosition,
    startTarget,
    endPosition: new THREE.Vector3().fromArray(CAMERA_FREEZE.position),
    endTarget: new THREE.Vector3().fromArray(CAMERA_FREEZE.target),
    startUp,
    endUp: startUp,
  });

  return {
    update(progress) {
      if (progress <= UEFI_REVEAL_ORBIT.end) {
        uefiRevealOrbit.update(intervalProgress(
          progress,
          UEFI_REVEAL_ORBIT.start,
          UEFI_REVEAL_ORBIT.end,
        ));
        return;
      }
      if (progress <= USB_RETURN_ORBIT.end) {
        usbReturnOrbit.update(intervalProgress(
          progress,
          USB_RETURN_ORBIT.start,
          USB_RETURN_ORBIT.end,
        ));
        return;
      }
      freezeTransition.update(intervalProgress(
        progress,
        USB_RETURN_ORBIT.end,
        CAMERA_FREEZE.progress,
      ));
    },
  };
}
