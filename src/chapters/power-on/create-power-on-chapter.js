import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createBareMetalLayer } from "../../features/bare-metal-layer/index.js";
import { createPowerButton } from "../../features/power-button/index.js";
import { createCable } from "../../objects/connections/create-cable.js";
import { POWER_ON_LAYOUT } from "./layout.js";
import { POWER_ON_TIMELINE } from "./timeline.js";

function createCablePoints(buttonPosition, layerContact) {
  const towardLayer = layerContact.clone().sub(buttonPosition).normalize();
  const sideways = new THREE.Vector3(-towardLayer.z, 0, towardLayer.x).normalize();
  const start = buttonPosition.clone().addScaledVector(towardLayer, 0.72);
  const pointAt = (progress, sideOffset, verticalOffset) => (
    start.clone()
      .lerp(layerContact, progress)
      .addScaledVector(sideways, sideOffset)
      .add(new THREE.Vector3(0, verticalOffset, 0))
  );

  return [
    start,
    pointAt(0.18, 0.62, -0.12),
    pointAt(0.38, -0.78, -0.3),
    pointAt(0.58, 0.56, -0.2),
    pointAt(0.78, -0.32, -0.1),
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

function createCameraPath(cameraRig, cable, cameraStart, buttonPosition) {
  const outward = cameraStart.clone().sub(buttonPosition).setY(0).normalize();
  const aboveCable = (progress, height, distance) => (
    cable.curve.getPoint(progress)
      .add(new THREE.Vector3(0, height, 0))
      .addScaledVector(outward, distance)
  );

  return cameraRig.createHomeboundPath({
    positions: [
      cameraStart,
      aboveCable(0.08, 3.7, 1.4),
      aboveCable(0.3, 3.45, 1.15),
      aboveCable(0.54, 3.2, 0.95),
      aboveCable(0.78, 3.05, 0.72),
    ],
    targets: [
      buttonPosition,
      cable.curve.getPoint(0.23),
      cable.curve.getPoint(0.46),
      cable.curve.getPoint(0.7),
      cable.curve.getPoint(1),
    ],
  });
}

export function createPowerOnChapter({ cameraRig }) {
  const group = new THREE.Group();
  group.name = "power-on-sequence";
  const cameraStart = new THREE.Vector3().fromArray(POWER_ON_LAYOUT.cameraStart);
  const buttonPosition = new THREE.Vector3().fromArray(POWER_ON_LAYOUT.buttonPosition);
  const layerContact = new THREE.Vector3().fromArray(POWER_ON_LAYOUT.layerContact);

  const powerButton = createPowerButton();
  powerButton.group.position.copy(buttonPosition);
  orientButtonToCamera(powerButton.group, buttonPosition, cameraStart);

  const cable = createCable({ points: createCablePoints(buttonPosition, layerContact) });
  const bareMetal = createBareMetalLayer();
  const cameraPath = createCameraPath(
    cameraRig,
    cable,
    cameraStart,
    buttonPosition,
  );
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
        exitProgress: intervalProgress(progress, ...POWER_ON_TIMELINE.buttonExit),
      });
      cable.setRevealProgress(intervalProgress(
        progress, ...POWER_ON_TIMELINE.cableReveal,
      ));
      cable.setOpacity(1);
      bareMetal.setState({ revealProgress: 1, labelProgress: 1, opacity: 1 });
      cameraPath.update(intervalProgress(
        progress, ...POWER_ON_TIMELINE.cameraFlight,
      ));
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
