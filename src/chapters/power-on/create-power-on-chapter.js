import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createBareMetalLayer } from "../../features/bare-metal-layer/index.js";
import { createPowerButton } from "../../features/power-button/index.js";
import { createPowerLink } from "../../features/power-link/index.js";
import {
  createPowerOnCameraChoreography,
  orientObjectToCamera,
} from "./create-camera-choreography.js";
import { createPowerOnCableRoute } from "./create-cable-route.js";
import { POWER_ON_LAYOUT } from "./layout.js";
import { POWER_ON_TIMELINE } from "./timeline.js";

export function createPowerOnChapter({ cameraRig, lightRig }) {
  const group = new THREE.Group();
  group.name = "power-on-sequence";
  const cameraStart = new THREE.Vector3().fromArray(POWER_ON_LAYOUT.cameraStart);
  const buttonPosition = new THREE.Vector3().fromArray(POWER_ON_LAYOUT.buttonPosition);
  const layerContact = new THREE.Vector3().fromArray(POWER_ON_LAYOUT.layerContact);

  const powerButton = createPowerButton();
  powerButton.group.position.copy(buttonPosition);
  orientObjectToCamera(powerButton.group, buttonPosition, cameraStart);

  const powerLink = createPowerLink({
    points: createPowerOnCableRoute({
      buttonPosition,
      layerContact,
      cameraPosition: cameraStart,
    }),
  });
  const bareMetal = createBareMetalLayer();
  const cameraChoreography = createPowerOnCameraChoreography({
    cameraRig,
    curve: powerLink.curve,
    cameraStart,
    buttonPosition,
  });
  group.add(powerButton.group, powerLink.group, bareMetal.group);

  return {
    id: "power-on",
    group,

    update(progress) {
      const pressIn = smootherstep(intervalProgress(
        progress,
        ...POWER_ON_TIMELINE.buttonPress,
      ));
      const release = smootherstep(intervalProgress(
        progress,
        ...POWER_ON_TIMELINE.buttonRelease,
      ));
      const buttonEnergy = 1 - release;
      const signalProgress = intervalProgress(
        progress,
        ...POWER_ON_TIMELINE.signalTravel,
      );

      powerButton.setState({
        revealProgress: intervalProgress(
          progress,
          ...POWER_ON_TIMELINE.buttonReveal,
        ),
        pressProgress: pressIn * buttonEnergy,
        powerProgress: intervalProgress(
          progress,
          ...POWER_ON_TIMELINE.power,
        ) * buttonEnergy,
        symbolGlowProgress: intervalProgress(
          progress,
          ...POWER_ON_TIMELINE.symbolGlow,
        ) * buttonEnergy,
        exitProgress: 0,
      });
      powerLink.setState({
        revealProgress: 1,
        signalProgress,
        signalActive: progress >= POWER_ON_TIMELINE.signalTravel[0]
          && progress < POWER_ON_TIMELINE.signalTravel[1],
        flowProgress: intervalProgress(
          progress,
          POWER_ON_TIMELINE.signalTravel[0],
          1,
        ),
        opacity: 1,
      });
      const activationProgress = intervalProgress(
        progress,
        ...POWER_ON_TIMELINE.bareMetalActivation,
      );
      const currentProgress = intervalProgress(
        progress,
        ...POWER_ON_TIMELINE.bareMetalCurrent,
      );
      bareMetal.setState({
        revealProgress: 1,
        labelProgress: 1,
        opacity: 1,
        elevationProgress: activationProgress,
        currentProgress,
      });
      lightRig.setIntensity(smootherstep(intervalProgress(
        progress,
        ...POWER_ON_TIMELINE.environmentLight,
      )));
      cameraChoreography.update(progress, signalProgress);
    },

    resize() {},
    dispose() {
      powerButton.dispose();
      powerLink.dispose();
      bareMetal.dispose();
      group.removeFromParent();
    },
  };
}
