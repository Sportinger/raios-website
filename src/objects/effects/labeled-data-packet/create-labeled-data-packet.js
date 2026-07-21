import * as THREE from "three";
import { smootherstep } from "../../../animation/progress.js";
import { createInfoCard } from "../../cards/index.js";

export function createLabeledDataPacket({
  name = "labeled-data-packet",
  title,
  points,
  width = 0.82,
  height = 0.07,
  depth = 0.3,
  color = 0x0a2335,
  edgeColor = 0xbdefff,
}) {
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const card = createInfoCard({
    title,
    width,
    height,
    depth,
    color,
    edgeColor,
    labelPlacement: "top",
    labelOptions: {
      panel: false,
      titleColor: "#ffffff",
      titleFont: "900 180px ui-monospace, SFMono-Regular, Consolas, monospace",
    },
  });
  card.group.name = name;

  const setState = ({ progress = 0, opacity = 1 } = {}) => {
    const travel = smootherstep(progress);
    curve.getPointAt(travel, card.group.position);
    card.setState({
      progress: Math.min(travel * 4, 1),
      activationProgress: travel,
      opacity: opacity * (1 - smootherstep(Math.max(0, travel - 0.86) / 0.14)),
    });
  };
  setState();

  return {
    curve,
    group: card.group,
    setState,
    dispose() {
      card.dispose();
    },
  };
}
