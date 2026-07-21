import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createInfoCard } from "../../objects/cards/index.js";

const CARD_TITLES = Object.freeze([
  "MEMORY MAP",
  "FRAMEBUFFER",
  "ACPI",
  "KERNEL ADDRESS",
  "INITIAL STACK",
  "MODULES",
]);

const START = new THREE.Vector3(-2.2, 1.63, 0.2);

export function createHandoffCards() {
  const group = new THREE.Group();
  group.name = "limine-handoff-cards";
  const target = new THREE.Vector3();

  const cards = CARD_TITLES.map((title, index) => {
    const card = createInfoCard({
      title,
      width: 0.92,
      height: 0.05,
      depth: 0.32,
      color: 0x071522,
      edgeColor: 0xa9edff,
      labelPlacement: "top",
      labelOptions: {
        panel: false,
        titleColor: "#ffffff",
        titleFont: "900 118px ui-monospace, SFMono-Regular, Consolas, monospace",
      },
    });
    group.add(card.group);
    return { card, index };
  });

  return {
    group,
    setState(progress = 0, opacity = 1) {
      cards.forEach(({ card, index }) => {
        const travel = smootherstep(intervalProgress(
          progress,
          index * 0.075,
          0.58 + index * 0.075,
        ));
        target.set(
          -2.15 + index * 0.86,
          2.02,
          0.28 + (index % 2) * 0.4,
        );
        card.group.position.copy(START).lerp(target, travel);
        card.group.position.y += Math.sin(travel * Math.PI) * 0.18;
        card.setState({
          progress: intervalProgress(progress, index * 0.075, 0.24 + index * 0.075),
          activationProgress: travel,
          opacity,
        });
      });
    },
    dispose() {
      cards.forEach(({ card }) => card.dispose());
      group.removeFromParent();
    },
  };
}
