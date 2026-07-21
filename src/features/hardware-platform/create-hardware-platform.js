import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createBareMetalLayer } from "../bare-metal-layer/index.js";
import { createInfoCard } from "../../objects/cards/index.js";
import { HARDWARE_PLATFORM_CONFIG } from "./config.js";

export function createHardwarePlatform() {
  const group = new THREE.Group();
  group.name = "hardware-platform";
  const bareMetal = createBareMetalLayer();
  group.add(bareMetal.group);

  const components = HARDWARE_PLATFORM_CONFIG.components.map((definition) => {
    const [width, height, depth] = definition.size;
    const card = createInfoCard({
      title: definition.title,
      width,
      height,
      depth,
      color: 0x111820,
      edgeColor: 0x47718e,
    });
    card.group.position.set(
      definition.position[0],
      HARDWARE_PLATFORM_CONFIG.topY + definition.position[1],
      definition.position[2],
    );
    group.add(card.group);
    return card;
  });
  const initializationLight = new THREE.PointLight(0x5bd2ff, 0, 3.1, 2);
  initializationLight.position.set(0, 0.8, 0);
  group.add(initializationLight);

  const setState = ({
    hardwareProgress = 0,
    initializationProgress = 0,
    opacity = 1,
  } = {}) => {
    bareMetal.setState({ revealProgress: 1, labelProgress: 1, opacity });
    components.forEach((component, index) => {
      const reveal = intervalProgress(
        hardwareProgress,
        index * 0.075,
        0.42 + index * 0.075,
      );
      const initializationPulse = Math.sin(
        intervalProgress(initializationProgress, index * 0.08, 0.5 + index * 0.08)
        * Math.PI,
      );
      component.setState({
        progress: reveal,
        opacity: opacity * (0.58 + initializationPulse * 0.42),
      });
    });
    initializationLight.intensity = smootherstep(initializationProgress)
      * (1 - smootherstep(intervalProgress(initializationProgress, 0.72, 1)))
      * 1.8;
  };
  setState();

  return {
    group,
    setState,
    dispose() {
      bareMetal.dispose();
      components.forEach((component) => component.dispose());
      group.removeFromParent();
    },
  };
}
