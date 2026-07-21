import * as THREE from "three";
import { smootherstep } from "../../animation/progress.js";
import { createLightSweep } from "../../objects/effects/create-light-sweep.js";
import { createPushButton } from "../../objects/mechanisms/create-push-button.js";
import { POWER_BUTTON_CONFIG } from "./config.js";
import { createPowerMark } from "./create-power-mark.js";

export function createPowerButton() {
  const group = new THREE.Group();
  group.name = "power-button";
  const presentation = new THREE.Group();
  group.add(presentation);
  const button = createPushButton({
    accentColor: POWER_BUTTON_CONFIG.accentColor,
    topMark: createPowerMark(POWER_BUTTON_CONFIG.accentColor),
  });
  presentation.add(button.group);
  const lightSweep = createLightSweep();
  presentation.add(lightSweep.group);
  presentation.scale.setScalar(POWER_BUTTON_CONFIG.scale);

  return {
    group,

    setState({ revealProgress, pressProgress, powerProgress, exitProgress }) {
      const reveal = smootherstep(revealProgress);
      const exit = smootherstep(exitProgress);
      const opacity = THREE.MathUtils.lerp(0.015, 1, reveal) * (1 - exit);

      group.visible = opacity > 0.001;
      button.setOpacity(opacity);
      button.setPressProgress(pressProgress);
      button.setPowerProgress(powerProgress);
      lightSweep.setProgress(revealProgress);
    },

    dispose() {
      lightSweep.dispose();
      button.dispose();
      group.removeFromParent();
    },
  };
}
