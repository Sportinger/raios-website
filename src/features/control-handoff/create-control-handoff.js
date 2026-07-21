import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createDataStream } from "../../objects/effects/data-stream/index.js";
import { createHorizontalLabel } from "../../objects/labels/create-horizontal-label.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";

export function createControlHandoff() {
  const group = new THREE.Group();
  group.name = "control-handoff";
  const doorGroup = new THREE.Group();
  doorGroup.position.set(0.2, 1.3, -0.65);
  const material = new THREE.MeshStandardMaterial({
    color: 0x0c2233,
    emissive: 0x4bd3ff,
    emissiveIntensity: 0.34,
    metalness: 0.48,
    roughness: 0.25,
  });
  const pillarGeometry = new THREE.BoxGeometry(0.16, 1.25, 0.2);
  [-0.75, 0.75].forEach((x) => {
    const pillar = new THREE.Mesh(pillarGeometry, material);
    pillar.position.set(x, 0, 0);
    doorGroup.add(pillar);
  });
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.16, 0.2), material);
  top.position.y = 0.62;
  doorGroup.add(top);
  const label = createHorizontalLabel("UEFI → RAIOS", "ONE-WAY HANDOFF", 2.25, 0.8);
  label.plane.position.set(0, 0.76, 0);
  doorGroup.add(label.plane);
  group.add(doorGroup);

  const impulse = createDataStream({
    points: [
      new THREE.Vector3(0.45, 0.7, -1.55),
      new THREE.Vector3(0.2, 1.3, -0.65),
      new THREE.Vector3(0, 2.35, 0),
    ],
    count: 12,
    blockSize: [0.16, 0.1, 0.28],
    trailLength: 0.48,
    color: 0xc5f4ff,
  });
  group.add(impulse.group);

  const setState = ({
    openProgress = 0,
    impulseProgress = 0,
    closeProgress = 0,
    opacity = 1,
  } = {}) => {
    const open = smootherstep(openProgress);
    const close = smootherstep(closeProgress);
    doorGroup.visible = open > 0.001 && close < 0.999;
    doorGroup.scale.set(
      THREE.MathUtils.lerp(0.7, 1, open),
      open * (1 - close),
      THREE.MathUtils.lerp(0.7, 1, open),
    );
    label.material.opacity = smootherstep(intervalProgress(open, 0.45, 1))
      * (1 - close)
      * opacity;
    impulse.setState({ progress: impulseProgress, opacity });
  };
  setState();

  return {
    group,
    setState,
    dispose() {
      impulse.dispose();
      disposeObject3D(doorGroup);
      group.removeFromParent();
    },
  };
}
