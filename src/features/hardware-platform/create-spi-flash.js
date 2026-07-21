import * as THREE from "three";
import { smootherstep } from "../../animation/progress.js";
import { createInfoCard } from "../../objects/cards/index.js";
import { HARDWARE_PLATFORM_CONFIG } from "./config.js";

export function createSpiFlash() {
  const config = HARDWARE_PLATFORM_CONFIG.spiFlash;
  const group = new THREE.Group();
  group.name = "spi-flash-uefi-image";
  group.position.set(config.position[0], config.position[1], config.position[2]);
  const card = createInfoCard({
    title: config.title,
    description: "",
    width: config.size[0],
    height: config.size[1],
    depth: config.size[2],
    color: 0x0a1119,
    edgeColor: 0x5bd8ff,
    labelPlacement: "front",
    labelOptions: {
      panel: false,
      titleFont: "900 250px ui-monospace, SFMono-Regular, Consolas, monospace",
      descriptionFont: "600 76px ui-monospace, SFMono-Regular, Consolas, monospace",
    },
  });
  group.add(card.group);

  return {
    group,
    setState({
      revealProgress = 0,
      powerProgress = 0,
      retiredProgress = 0,
      opacity = 1,
    } = {}) {
      const reveal = smootherstep(revealProgress);
      const retired = smootherstep(retiredProgress);
      group.position.y = THREE.MathUtils.lerp(
        config.position[1] - config.size[1] * 0.72,
        config.position[1],
        reveal,
      );
      card.setState({
        progress: revealProgress,
        activationProgress: powerProgress * (1 - retired),
        pulseProgress: Math.sin(powerProgress * Math.PI) * (1 - retired),
        opacity,
      });
    },
    dispose() {
      card.dispose();
      group.removeFromParent();
    },
  };
}
