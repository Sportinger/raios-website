import * as THREE from "three";
import { intervalProgress } from "../../animation/progress.js";
import { createInfoCard } from "../../objects/cards/index.js";

const ENTRIES = Object.freeze([
  "ENTRY · raiOS",
  "PATH · /kernel/kernel.elf",
  "PROTOCOL · LIMINE",
]);

export function createConfigSelection({ position = [2.2, 0.52, -0.42] } = {}) {
  const group = new THREE.Group();
  group.name = "limine-config-selection";
  group.position.fromArray(position);

  const cards = ENTRIES.map((title, index) => {
    const card = createInfoCard({
      title,
      width: 1.78,
      height: 0.055,
      depth: 0.34,
      color: 0x081725,
      edgeColor: 0x7de1ff,
      labelPlacement: "top",
      labelOptions: {
        panel: false,
        titleColor: "#ffffff",
        titleFont: "900 150px ui-monospace, SFMono-Regular, Consolas, monospace",
      },
    });
    card.group.position.z = -index * 0.42;
    group.add(card.group);
    return card;
  });

  return {
    group,
    labels: cards.map(({ label }) => label),
    setState(progress = 0, opacity = 1) {
      cards.forEach((card, index) => {
        const cardProgress = intervalProgress(progress, index * 0.17, 0.58 + index * 0.17);
        card.setState({
          progress: cardProgress,
          activationProgress: cardProgress,
          opacity,
        });
      });
    },
    dispose() {
      cards.forEach((card) => card.dispose());
      group.removeFromParent();
    },
  };
}
