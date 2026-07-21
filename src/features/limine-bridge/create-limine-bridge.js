import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createInfoCard } from "../../objects/cards/index.js";
import { createDataStream } from "../../objects/effects/data-stream/index.js";
import { createHorizontalLabel } from "../../objects/labels/create-horizontal-label.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";
import { LIMINE_BRIDGE_CONFIG } from "./config.js";

function createBridgeGeometry() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0x122535,
    emissive: 0x51cfff,
    emissiveIntensity: 0.28,
    metalness: 0.55,
    roughness: 0.26,
  });
  const pillarGeometry = new THREE.BoxGeometry(0.14, 0.7, 0.18);
  [-0.48, 0.48].forEach((x) => {
    const pillar = new THREE.Mesh(pillarGeometry, material);
    pillar.position.set(x, 0.35, 0);
    group.add(pillar);
  });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.18), material);
  lintel.position.y = 0.7;
  group.add(lintel);
  const label = createHorizontalLabel("LIMINE · BOOT BRIDGE", "", 1.6, 0.58);
  label.plane.position.set(0, 0.79, 0);
  group.add(label.plane);
  return { group, label, material };
}

export function createLimineBridge() {
  const group = new THREE.Group();
  group.name = "limine-bridge";
  const bridge = createBridgeGeometry();
  bridge.group.position.fromArray(LIMINE_BRIDGE_CONFIG.position);
  group.add(bridge.group);

  const loadStream = createDataStream({
    points: [
      new THREE.Vector3(4.85, -0.2, 1.4),
      new THREE.Vector3(3.0, 0.15, 0.8),
      new THREE.Vector3(1.7, 0.65, -0.55),
      new THREE.Vector3(0.45, 0.45, -1.55),
    ],
    count: 18,
    blockSize: [0.16, 0.07, 0.28],
    trailLength: 0.52,
  });
  const searchStream = createDataStream({
    points: [
      new THREE.Vector3(0.45, 0.6, -1.55),
      new THREE.Vector3(1.8, 0.8, -0.45),
      new THREE.Vector3(3.2, 0.35, 0.75),
      new THREE.Vector3(4.85, -0.05, 1.4),
    ],
    count: 10,
    blockSize: [0.1, 0.05, 0.22],
    trailLength: 0.34,
  });
  group.add(loadStream.group, searchStream.group);

  const configurationCards = LIMINE_BRIDGE_CONFIG.cards.map((definition) => {
    const card = createInfoCard({
      title: definition.title,
      width: definition.title.startsWith("KERNEL") ? 2.2 : 1.7,
      depth: 0.66,
      height: 0.07,
    });
    card.group.position.fromArray(definition.position);
    group.add(card.group);
    return card;
  });

  const packageGroup = new THREE.Group();
  packageGroup.position.set(4.35, 0.35, 1.4);
  const packageGeometry = new THREE.BoxGeometry(1.7, 0.38, 1.0);
  const packageMaterial = new THREE.MeshStandardMaterial({
    color: 0x08121d,
    emissive: 0x238fbd,
    emissiveIntensity: 0.18,
    metalness: 0.6,
    opacity: 0,
    roughness: 0.3,
    transparent: true,
  });
  packageGroup.add(new THREE.Mesh(packageGeometry, packageMaterial));
  const packageEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(packageGeometry),
    new THREE.LineBasicMaterial({ color: 0x8ce4ff, opacity: 0, transparent: true }),
  );
  packageGroup.add(packageEdges);
  const packageLabel = createHorizontalLabel("kernel.elf", "SEALED IMAGE", 1.7, 1.0);
  packageLabel.plane.position.y = 0.21;
  packageGroup.add(packageLabel.plane);
  group.add(packageGroup);

  const setState = ({
    loadProgress = 0,
    bridgeProgress = 0,
    searchProgress = 0,
    configurationProgress = 0,
    packageProgress = 0,
    retreatProgress = 0,
    opacity = 1,
  } = {}) => {
    const bridgeIn = smootherstep(bridgeProgress);
    const retreat = smootherstep(retreatProgress);
    loadStream.setState({ progress: loadProgress, opacity });
    searchStream.setState({ progress: searchProgress, opacity: opacity * (1 - retreat) });
    bridge.group.visible = bridgeIn > 0.001 && retreat < 0.999;
    bridge.group.scale.set(
      bridgeIn,
      bridgeIn * (1 - retreat),
      bridgeIn,
    );
    bridge.material.emissiveIntensity = THREE.MathUtils.lerp(0.28, 0.02, retreat);
    bridge.label.material.opacity = bridgeIn * (1 - retreat) * opacity;
    configurationCards.forEach((card, index) => {
      card.setState({
        progress: intervalProgress(
          configurationProgress,
          index * 0.16,
          0.56 + index * 0.16,
        ),
        opacity: opacity * (1 - retreat),
      });
    });
    const packageIn = smootherstep(packageProgress);
    packageGroup.visible = packageIn > 0.001 && retreat < 0.999;
    packageGroup.scale.setScalar(THREE.MathUtils.lerp(0.7, 1, packageIn));
    packageMaterial.opacity = packageIn * (1 - retreat) * opacity;
    packageEdges.material.opacity = packageIn * (1 - retreat) * opacity;
    packageLabel.material.opacity = packageIn * (1 - retreat) * opacity;
  };
  setState();

  return {
    group,
    setState,
    dispose() {
      loadStream.dispose();
      searchStream.dispose();
      configurationCards.forEach((card) => card.dispose());
      disposeObject3D(bridge.group);
      disposeObject3D(packageGroup);
      group.removeFromParent();
    },
  };
}
