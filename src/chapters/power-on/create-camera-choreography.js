import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { BARE_METAL_TOP_DOWN_POSE } from "../shared/camera-poses.js";
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

function createFlightPath({
  cameraRig,
  curve,
  pathStart,
  originalCameraStart,
  buttonPosition,
  endPosition,
  endTarget,
}) {
  const profileSide = pathStart.clone().sub(buttonPosition).setY(0).normalize();
  const originalSide = originalCameraStart.clone()
    .sub(buttonPosition)
    .setY(0)
    .normalize();
  const sideDirection = new THREE.Vector3();
  const aboveCable = (progress, height, distance, orbitReturn) => {
    sideDirection.lerpVectors(profileSide, originalSide, orbitReturn).normalize();
    return curve.getPoint(progress)
      .add(new THREE.Vector3(0, height, 0))
      .addScaledVector(sideDirection, distance);
  };

  return cameraRig.createHomeboundPath({
    easing: smootherstep,
    endPosition,
    endTarget,
    positions: [
      pathStart,
      aboveCable(0.12, 3.2, 1, 0.18),
      aboveCable(0.32, 3.8, 1.3, 0.42),
      aboveCable(0.56, 4.6, 1.7, 0.7),
      aboveCable(0.78, 5.4, 2.1, 0.92),
    ],
    targets: [
      buttonPosition,
      curve.getPoint(0.26),
      curve.getPoint(0.5),
      curve.getPoint(0.73),
      curve.getPoint(1),
    ],
  });
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
  const topDownPosition = new THREE.Vector3().fromArray(
    BARE_METAL_TOP_DOWN_POSE.position,
  );
  const topDownTarget = new THREE.Vector3().fromArray(
    BARE_METAL_TOP_DOWN_POSE.target,
  );
  const flightPath = createFlightPath({
    cameraRig,
    curve,
    pathStart: orbit.endPosition,
    originalCameraStart: cameraStart,
    buttonPosition,
    endPosition: topDownPosition,
    endTarget: topDownTarget,
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
      const targetFollowWeight = 1 - smootherstep(intervalProgress(
        progress,
        ...POWER_ON_TIMELINE.cameraRelease,
      ));
      flightPath.update(
        intervalProgress(progress, ...POWER_ON_TIMELINE.cameraFlight),
        cameraTarget,
        targetFollowWeight,
      );
    },
  };
}
