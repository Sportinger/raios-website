import * as THREE from "three";
import {
  departWithMomentum,
  intervalProgress,
  smootherstep,
} from "../../animation/progress.js";
import {
  BARE_METAL_DRIFT_POSE,
  BARE_METAL_IMPACT_POSE,
  BARE_METAL_BOOT_POSE,
} from "../shared/camera-poses.js";
import { POWER_ON_TIMELINE } from "./timeline.js";

export function orientObjectToCamera(group, objectPosition, cameraPosition) {
  const normal = cameraPosition.clone().sub(objectPosition).normalize();
  const screenUp = new THREE.Vector3(0, 1, 0)
    .addScaledVector(normal, -normal.y)
    .normalize();
  const localY = normal;
  const localZ = screenUp.negate();
  const localX = new THREE.Vector3().crossVectors(localY, localZ).normalize();
  group.quaternion.setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(localX, localY, localZ),
  );
}

export function createPowerOnCameraChoreography({
  cameraRig,
  curve,
  cameraStart,
  buttonPosition,
}) {
  const orbit = cameraRig.createOrbit({
    center: buttonPosition,
    startPosition: cameraStart,
    angle: Math.PI / 2,
  });
  const bootPosition = new THREE.Vector3().fromArray(
    BARE_METAL_BOOT_POSE.position,
  );
  const bootTarget = new THREE.Vector3().fromArray(
    BARE_METAL_BOOT_POSE.target,
  );
  const bootUp = new THREE.Vector3().fromArray(
    BARE_METAL_BOOT_POSE.up,
  );
  const impactPosition = new THREE.Vector3().fromArray(
    BARE_METAL_IMPACT_POSE.position,
  );
  const impactTarget = new THREE.Vector3().fromArray(
    BARE_METAL_IMPACT_POSE.target,
  );
  const impactUp = new THREE.Vector3().fromArray(BARE_METAL_IMPACT_POSE.up);
  const driftPosition = new THREE.Vector3().fromArray(
    BARE_METAL_DRIFT_POSE.position,
  );
  const driftUp = new THREE.Vector3().fromArray(BARE_METAL_DRIFT_POSE.up);
  const driftStartSignal = intervalProgress(
    POWER_ON_TIMELINE.cameraDrift[0],
    ...POWER_ON_TIMELINE.signalTravel,
  );
  const driftTarget = curve.getPointAt(smootherstep(driftStartSignal));
  const followFlight = cameraRig.createPoseTransition({
    startPosition: orbit.endPosition,
    startTarget: buttonPosition,
    startUp: driftUp,
    endPosition: driftPosition,
    endTarget: driftTarget,
    endUp: driftUp,
    easing: (progress) => progress,
  });
  const slowDrift = cameraRig.createPoseTransition({
    startPosition: driftPosition,
    startTarget: driftTarget,
    startUp: driftUp,
    endPosition: impactPosition,
    endTarget: impactTarget,
    endUp: impactUp,
    easing: (progress) => progress,
  });
  const bootOverviewTransition = cameraRig.createPoseTransition({
    startPosition: impactPosition,
    startTarget: impactTarget,
    startUp: impactUp,
    endPosition: bootPosition,
    endTarget: bootTarget,
    endUp: bootUp,
    easing: (progress) => departWithMomentum(progress, 0.12),
  });
  const impulseTarget = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();

  return {
    update(progress, signalProgress) {
      curve.getPointAt(smootherstep(signalProgress), impulseTarget);
      cameraTarget.lerpVectors(
        buttonPosition,
        impulseTarget,
        smootherstep(intervalProgress(
          progress,
          ...POWER_ON_TIMELINE.cameraFollow,
        )),
      );
      if (progress < POWER_ON_TIMELINE.cameraFlight[0]) {
        orbit.update(intervalProgress(
          progress,
          ...POWER_ON_TIMELINE.cameraOrbit,
        ), cameraTarget);
        return;
      }
      if (progress >= POWER_ON_TIMELINE.cameraBootOverview[0]) {
        bootOverviewTransition.update(intervalProgress(
          progress,
          ...POWER_ON_TIMELINE.cameraBootOverview,
        ));
        return;
      }
      if (progress >= POWER_ON_TIMELINE.cameraDrift[0]) {
        const followWeight = 1 - smootherstep(intervalProgress(
          progress,
          ...POWER_ON_TIMELINE.cameraRelease,
        ));
        slowDrift.update(
          intervalProgress(progress, ...POWER_ON_TIMELINE.cameraDrift),
          impulseTarget,
          followWeight,
        );
        return;
      }
      const followWeight = 1 - smootherstep(intervalProgress(
        progress,
        ...POWER_ON_TIMELINE.cameraRelease,
      ));
      followFlight.update(
        intervalProgress(progress, ...POWER_ON_TIMELINE.cameraFlight),
        cameraTarget,
        followWeight,
      );
    },
  };
}
