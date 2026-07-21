import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createBareMetalLayer } from "../../features/bare-metal-layer/index.js";
import { createPowerButton } from "../../features/power-button/index.js";
import { createCable } from "../../objects/connections/create-cable.js";
import { POWER_ON_LAYOUT } from "./layout.js";
import { POWER_ON_TIMELINE } from "./timeline.js";

function createCablePoints(buttonPosition, layerContact) {
  const towardLayer = layerContact.clone().sub(buttonPosition).normalize();
  const start = buttonPosition.clone().addScaledVector(towardLayer, 0.62);
  return [
    start,
    start.clone().lerp(layerContact, 0.28).add(new THREE.Vector3(0, 0.5, 0)),
    start.clone().lerp(layerContact, 0.68).add(new THREE.Vector3(0, -0.18, 0)),
    layerContact,
  ];
}

export function createPowerOnChapter({ cameraRig }) {
  const group = new THREE.Group();
  group.name = "power-on-sequence";
  const cameraStart = new THREE.Vector3().fromArray(POWER_ON_LAYOUT.cameraStart);
  const buttonPosition = new THREE.Vector3().fromArray(POWER_ON_LAYOUT.buttonPosition);
  const layerContact = new THREE.Vector3().fromArray(POWER_ON_LAYOUT.layerContact);

  const powerButton = createPowerButton();
  powerButton.group.position.copy(buttonPosition);
  powerButton.group.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    cameraStart.clone().sub(buttonPosition).normalize(),
  );

  const cable = createCable({ points: createCablePoints(buttonPosition, layerContact) });
  const bareMetal = createBareMetalLayer();
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
      const sceneOpacity = 1 - smootherstep(intervalProgress(
        progress, ...POWER_ON_TIMELINE.sceneExit,
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
      cable.setOpacity(sceneOpacity);
      bareMetal.setState({
        revealProgress: intervalProgress(progress, ...POWER_ON_TIMELINE.layerReveal),
        labelProgress: intervalProgress(progress, ...POWER_ON_TIMELINE.layerLabel),
        opacity: sceneOpacity,
      });
      cameraRig.transitionFrom(
        cameraStart,
        buttonPosition,
        intervalProgress(progress, ...POWER_ON_TIMELINE.cameraFlight),
      );
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
