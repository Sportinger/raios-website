import * as THREE from "three";
import { createOrbitingLight } from "../../objects/effects/create-orbiting-light.js";
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
    markGlowColor: POWER_BUTTON_CONFIG.symbolGlowColor,
    topMark: createPowerMark(0x555d64),
  });
  presentation.add(button.group);
  const orbitingLight = createOrbitingLight();
  presentation.add(orbitingLight.group);
  presentation.scale.setScalar(POWER_BUTTON_CONFIG.scale);

  return {
    group,

    setState({
      revealProgress,
      pressProgress,
      powerProgress,
      symbolGlowProgress,
    }) {
      button.setPressProgress(pressProgress);
      button.setPowerProgress(powerProgress);
      button.setMarkGlowProgress(symbolGlowProgress);
      orbitingLight.setProgress(revealProgress);
    },

    dispose() {
      orbitingLight.dispose();
      button.dispose();
      group.removeFromParent();
    },
  };
}
