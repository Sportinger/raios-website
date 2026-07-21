import * as THREE from "three";
import { smootherstep } from "../../animation/progress.js";
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

  return {
    group,

    setState({ revealProgress, pressProgress, powerProgress, exitProgress }) {
      const reveal = smootherstep(revealProgress);
      const exit = smootherstep(exitProgress);
      const opacity = reveal * (1 - exit);
      const scale = POWER_BUTTON_CONFIG.scale
        * THREE.MathUtils.lerp(0.76, 1, reveal)
        * THREE.MathUtils.lerp(1, 0.82, exit);

      group.visible = opacity > 0.001;
      presentation.scale.setScalar(scale);
      presentation.position.y = THREE.MathUtils.lerp(-0.24, 0, reveal) + exit * 0.24;
      presentation.rotation.y = THREE.MathUtils.lerp(-0.18, 0, reveal);
      button.setOpacity(opacity);
      button.setPressProgress(pressProgress);
      button.setPowerProgress(powerProgress);
    },

    dispose() {
      button.dispose();
      group.removeFromParent();
    },
  };
}
