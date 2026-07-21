import * as THREE from "three";
import {
  intervalProgress,
  smootherstep,
} from "../../animation/progress.js";
import { createBareMetalLayer } from "../../features/bare-metal-layer/index.js";
import { createPowerButton } from "../../features/power-button/index.js";
import { createCable } from "../../objects/connections/create-cable.js";
import { POWER_ON_LAYOUT } from "./layout.js";
import { POWER_ON_TIMELINE } from "./timeline.js";

function createCablePoints(buttonPosition, layerContact, cameraPosition) {
  const buttonNormal = cameraPosition.clone().sub(buttonPosition).normalize();
  const behindButton = buttonNormal.clone().negate();
  const behindOnLevel = behindButton.clone().setY(0).normalize();
  const socket = buttonPosition.clone().addScaledVector(
    behindButton,
    POWER_ON_LAYOUT.buttonSocketDepth,
  );
  const rearRun = socket.clone().addScaledVector(
    behindOnLevel,
    POWER_ON_LAYOUT.buttonRearRun,
  );

  const floorEntry = rearRun.clone()
    .lerp(layerContact, 0.08)
    .setY(POWER_ON_LAYOUT.cableFloorY);
  const towardButton = buttonPosition.clone().sub(layerContact).setY(0).normalize();
  const floorEnd = layerContact.clone()
    .addScaledVector(towardButton, 0.62)
    .setY(POWER_ON_LAYOUT.cableFloorY);
  const floorDirection = floorEnd.clone().sub(floorEntry).normalize();
  const sideways = new THREE.Vector3(-floorDirection.z, 0, floorDirection.x);
  const floorPointAt = (progress, sideOffset) => (
    floorEntry.clone()
      .lerp(floorEnd, progress)
      .addScaledVector(sideways, sideOffset)
  );

  return [
    socket,
    rearRun,
    floorEntry,
    floorPointAt(0.2, 0.62),
    floorPointAt(0.42, -0.78),
    floorPointAt(0.64, 0.56),
    floorPointAt(0.84, -0.3),
    floorEnd,
    layerContact,
  ];
}

function orientButtonToCamera(group, buttonPosition, cameraPosition) {
  const normal = cameraPosition.clone().sub(buttonPosition).normalize();
  const screenUp = new THREE.Vector3(0, 1, 0)
    .addScaledVector(normal, -normal.y)
    .normalize();
  const localY = normal;
  const localZ = screenUp.negate();
  const localX = new THREE.Vector3().crossVectors(localY, localZ).normalize();
  const basis = new THREE.Matrix4().makeBasis(localX, localY, localZ);
  group.quaternion.setFromRotationMatrix(basis);
}

function createCameraPath(
  cameraRig,
  cable,
  pathStart,
  originalCameraStart,
  buttonPosition,
) {
  const profileSide = pathStart.clone().sub(buttonPosition).setY(0).normalize();
  const originalSide = originalCameraStart.clone()
    .sub(buttonPosition)
    .setY(0)
    .normalize();
  const sideDirection = new THREE.Vector3();
  const aboveCable = (progress, height, distance, orbitReturn) => {
    sideDirection.lerpVectors(profileSide, originalSide, orbitReturn).normalize();
    return cable.curve.getPoint(progress)
      .add(new THREE.Vector3(0, height, 0))
      .addScaledVector(sideDirection, distance);
  };

  return cameraRig.createHomeboundPath({
    easing: smootherstep,
    positions: [
      pathStart,
      aboveCable(0.12, 3.2, 1, 0.18),
      aboveCable(0.32, 3.8, 1.3, 0.42),
      aboveCable(0.56, 4.6, 1.7, 0.7),
      aboveCable(0.78, 5.4, 2.1, 0.92),
    ],
    targets: [
      buttonPosition,
      cable.curve.getPoint(0.26),
      cable.curve.getPoint(0.5),
      cable.curve.getPoint(0.73),
      cable.curve.getPoint(1),
    ],
  });
}

export function createPowerOnChapter({ cameraRig, lightRig }) {
  const group = new THREE.Group();
  group.name = "power-on-sequence";
  const cameraStart = new THREE.Vector3().fromArray(POWER_ON_LAYOUT.cameraStart);
  const buttonPosition = new THREE.Vector3().fromArray(POWER_ON_LAYOUT.buttonPosition);
  const layerContact = new THREE.Vector3().fromArray(POWER_ON_LAYOUT.layerContact);

  const powerButton = createPowerButton();
  powerButton.group.position.copy(buttonPosition);
  orientButtonToCamera(powerButton.group, buttonPosition, cameraStart);

  const cable = createCable({
    points: createCablePoints(buttonPosition, layerContact, cameraStart),
  });
  const bareMetal = createBareMetalLayer();
  const cameraOrbit = cameraRig.createOrbit({
    center: buttonPosition,
    startPosition: cameraStart,
    angle: Math.PI / 2,
  });
  const cameraPath = createCameraPath(
    cameraRig,
    cable,
    cameraOrbit.endPosition,
    cameraStart,
    buttonPosition,
  );
  const impulseTarget = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();
  group.add(powerButton.group, cable.group, bareMetal.group);

  return {
    id: "power-on",
    group,

    update(progress) {
      const pressIn = smootherstep(intervalProgress(
        progress, ...POWER_ON_TIMELINE.buttonPress,
      ));
      const settle = smootherstep(intervalProgress(
        progress, ...POWER_ON_TIMELINE.buttonSettle,
      ));

      powerButton.setState({
        revealProgress: intervalProgress(progress, ...POWER_ON_TIMELINE.buttonReveal),
        pressProgress: pressIn * (1 - settle * 0.18),
        powerProgress: intervalProgress(progress, ...POWER_ON_TIMELINE.power),
        symbolGlowProgress: intervalProgress(
          progress, ...POWER_ON_TIMELINE.symbolGlow,
        ),
        exitProgress: 0,
      });
      cable.setRevealProgress(intervalProgress(
        progress, ...POWER_ON_TIMELINE.cableReveal,
      ));
      const signalProgress = intervalProgress(
        progress, ...POWER_ON_TIMELINE.signalTravel,
      );
      cable.setSignalProgress(
        signalProgress,
        progress >= POWER_ON_TIMELINE.signalTravel[0]
          && progress < POWER_ON_TIMELINE.signalTravel[1],
      );
      cable.setOpacity(1);
      bareMetal.setState({ revealProgress: 1, labelProgress: 1, opacity: 1 });
      lightRig.setIntensity(smootherstep(intervalProgress(
        progress, ...POWER_ON_TIMELINE.environmentLight,
      )));
      if (progress < POWER_ON_TIMELINE.cameraFlight[0]) {
        cameraOrbit.update(intervalProgress(
          progress, ...POWER_ON_TIMELINE.cameraOrbit,
        ));
      } else {
        cable.curve.getPointAt(smootherstep(signalProgress), impulseTarget);
        cameraTarget.lerpVectors(
          buttonPosition,
          impulseTarget,
          smootherstep(intervalProgress(
            progress, ...POWER_ON_TIMELINE.cameraFollow,
          )),
        );
        cameraPath.update(intervalProgress(
          progress, ...POWER_ON_TIMELINE.cameraFlight,
        ), cameraTarget);
      }
    },

    resize() {},
    dispose() {
      powerButton.dispose();
      cable.dispose();
      bareMetal.dispose();
      group.removeFromParent();
    },
  };
}
