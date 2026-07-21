import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createCircuitTrace } from "../../objects/connections/circuit-trace/index.js";
import { createDataStream } from "../../objects/effects/data-stream/index.js";
import { createHorizontalLabel } from "../../objects/labels/create-horizontal-label.js";
import { createExpandingStageLayer } from "../../objects/layers/expanding-stage-layer/index.js";
import { LIMINE_STAGE_CONFIG } from "./config.js";

const LABEL_FONT = "900 190px ui-monospace, SFMono-Regular, Consolas, monospace";

export function createLimineStage() {
  const config = LIMINE_STAGE_CONFIG;
  const group = new THREE.Group();
  group.name = "limine-stage";
  const stageLayer = createExpandingStageLayer({
    name: "limine-boot-stage",
    title: "LIMINE BOOT STAGE",
    sourcePosition: config.source,
    targetPosition: config.layer.position,
    sourceSize: config.sourceSize,
    size: [config.layer.width, config.layer.height, config.layer.depth],
    color: 0x0b1b29,
    edgeColor: 0x72dbff,
    emissive: 0x37bce8,
    emissiveIntensity: 0.18,
    metalness: 0.46,
    roughness: 0.3,
    surfaceOpacity: 0.88,
    surfaceRenderOrder: 4,
    depthWrite: true,
    recenterOnExpansion: true,
    labelWidth: config.layer.width * 0.92,
    labelOptions: {
      panel: false,
      titleFont: "900 270px ui-monospace, SFMono-Regular, Consolas, monospace",
    },
  });
  const stageGroup = stageLayer.contentGroup;
  group.add(stageLayer.group);

  const zoneWidth = config.layer.width / config.zones.length;
  const zones = config.zones.map((definition) => {
    const zoneGroup = new THREE.Group();
    zoneGroup.position.x = definition.x;
    const symbolMaterial = new THREE.MeshBasicMaterial({
      color: 0x7de1ff,
      opacity: 0,
      transparent: true,
      toneMapped: false,
    });
    const symbol = new THREE.Mesh(
      new THREE.BoxGeometry(zoneWidth * 0.54, 0.018, 0.46),
      symbolMaterial,
    );
    symbol.position.y = config.layer.height / 2 + 0.014;
    zoneGroup.add(symbol);
    const label = createHorizontalLabel(
      definition.title,
      "",
      zoneWidth * 0.94,
      config.layer.height / 0.7,
      {
        panel: false,
        titleFont: LABEL_FONT,
      },
    );
    label.plane.position.z = config.layer.depth / 2 + 0.014;
    label.plane.rotation.x = 0;
    zoneGroup.add(label.plane);
    stageGroup.add(zoneGroup);
    return { definition, label, symbolMaterial };
  });

  const dividerMaterial = new THREE.MeshBasicMaterial({
    color: 0x51cfff,
    opacity: 0,
    transparent: true,
    toneMapped: false,
  });
  [-config.layer.width / 6, config.layer.width / 6].forEach((x) => {
    const divider = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.018, config.layer.depth * 0.78),
      dividerMaterial,
    );
    divider.position.set(x, config.layer.height / 2 + 0.014, 0);
    stageGroup.add(divider);
  });

  const configToLoader = createCircuitTrace({
    points: [
      new THREE.Vector3(2.2, config.layer.height / 2 + 0.03, 0.1),
      new THREE.Vector3(1.1, config.layer.height / 2 + 0.03, 0.1),
      new THREE.Vector3(0, config.layer.height / 2 + 0.03, 0.1),
    ],
  });
  const loaderToHandoff = createCircuitTrace({
    points: [
      new THREE.Vector3(0, config.layer.height / 2 + 0.03, -0.1),
      new THREE.Vector3(-1.1, config.layer.height / 2 + 0.03, -0.1),
      new THREE.Vector3(-2.2, config.layer.height / 2 + 0.03, -0.1),
    ],
  });
  stageGroup.add(configToLoader.group, loaderToHandoff.group);

  const handoffCells = Array.from({ length: 4 }, (_, index) => {
    const cellMaterial = new THREE.MeshBasicMaterial({
      color: 0xa9edff,
      opacity: 0,
      transparent: true,
      toneMapped: false,
    });
    const cell = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.025, 0.2), cellMaterial);
    cell.position.set(
      -2.2 + (index % 2 - 0.5) * 0.42,
      config.layer.height / 2 + 0.035,
      (Math.floor(index / 2) - 0.5) * 0.32,
    );
    stageGroup.add(cell);
    return { cell, material: cellMaterial };
  });

  const handoffImpulse = createDataStream({
    points: [
      new THREE.Vector3(-2.2, config.layer.position[1] + 0.24, 0),
      new THREE.Vector3(-1.1, 1.78, 0.18),
      new THREE.Vector3(0, 2.35, 0),
    ],
    count: 10,
    blockSize: [0.16, 0.08, 0.24],
    trailLength: 0.42,
    color: 0xcaf6ff,
  });
  group.add(handoffImpulse.group);

  const setState = ({
    layerProgress = 0,
    configProgress = 0,
    kernelLoaderProgress = 0,
    handoffPrepareProgress = 0,
    handoffProgress = 0,
    retreatProgress = 0,
    opacity = 1,
  } = {}) => {
    const lift = intervalProgress(layerProgress, 0, 0.48);
    const expansionProgress = intervalProgress(layerProgress, 0.48, 1);
    const layerVisibility = intervalProgress(layerProgress, 0, 0.16);
    const configIn = smootherstep(configProgress);
    const loaderIn = smootherstep(kernelLoaderProgress);
    const handoffIn = smootherstep(handoffPrepareProgress);
    const stageState = stageLayer.setState({
      revealProgress: layerVisibility,
      liftProgress: lift,
      expansionProgress,
      labelProgress: intervalProgress(expansionProgress, 0.18, 0.72),
      labelOpacity: 1 - configIn,
      retreatProgress,
      opacity,
    });
    const { activeOpacity, expansion } = stageState;
    dividerMaterial.opacity = expansion * activeOpacity * 0.42;

    const zoneProgress = [configIn, loaderIn, handoffIn];
    zones.forEach(({ label, symbolMaterial }, index) => {
      label.material.opacity = zoneProgress[index] * activeOpacity;
      symbolMaterial.opacity = zoneProgress[index] * activeOpacity * 0.7;
    });
    const configFlow = Math.sin(loaderIn * Math.PI);
    configToLoader.setState({
      progress: loaderIn,
      opacity: configFlow * activeOpacity,
      pulse: 1,
    });
    const handoffFlow = Math.sin(handoffIn * Math.PI);
    loaderToHandoff.setState({
      progress: handoffIn,
      opacity: handoffFlow * activeOpacity,
      pulse: 1,
    });
    handoffCells.forEach(({ cell, material: cellMaterial }, index) => {
      const cellIn = smootherstep(intervalProgress(
        handoffIn,
        index * 0.12,
        0.58 + index * 0.1,
      ));
      cell.visible = cellIn > 0.001;
      cell.scale.setScalar(THREE.MathUtils.lerp(0.55, 1, cellIn));
      cellMaterial.opacity = cellIn * activeOpacity;
    });
    handoffImpulse.setState({
      progress: handoffProgress,
      opacity: activeOpacity,
    });
  };
  setState();

  return {
    group,
    setState,
    dispose() {
      handoffImpulse.dispose();
      configToLoader.dispose();
      loaderToHandoff.dispose();
      stageLayer.dispose();
      group.removeFromParent();
    },
  };
}
