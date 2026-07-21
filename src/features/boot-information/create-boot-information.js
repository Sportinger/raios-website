import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createInfoCard } from "../../objects/cards/index.js";
import { BOOT_INFORMATION_CONFIG } from "./config.js";

export function createBootInformation() {
  const group = new THREE.Group();
  group.name = "boot-information";
  const cards = BOOT_INFORMATION_CONFIG.cards.map((title, index) => {
    const card = createInfoCard({
      title,
      width: 1.42,
      height: 0.07,
      depth: 0.62,
      color: 0x0a1824,
      edgeColor: 0x8bdfff,
    });
    const start = new THREE.Vector3(
      0.45 + (index % 3 - 1) * 0.42,
      0.85 + Math.floor(index / 3) * 0.25,
      -1.3,
    );
    const destination = new THREE.Vector3(
      (index % 3 - 1) * 1.85,
      2.69,
      (Math.floor(index / 3) - 0.5) * 1.55,
    );
    card.group.position.copy(start);
    group.add(card.group);
    return { card, destination, start };
  });

  const setState = ({
    prepareProgress = 0,
    dockProgress = 0,
    consumeProgress = 0,
    opacity = 1,
  } = {}) => {
    const consume = smootherstep(consumeProgress);
    cards.forEach(({ card, destination, start }, index) => {
      const prepare = intervalProgress(
        prepareProgress,
        index * 0.07,
        0.48 + index * 0.07,
      );
      const dock = smootherstep(intervalProgress(
        dockProgress,
        index * 0.08,
        0.52 + index * 0.08,
      ));
      card.group.position.lerpVectors(start, destination, dock);
      card.setState({
        progress: prepare,
        opacity: opacity * (1 - consume),
      });
    });
  };
  setState();

  return {
    group,
    setState,
    dispose() {
      cards.forEach(({ card }) => card.dispose());
      group.removeFromParent();
    },
  };
}
