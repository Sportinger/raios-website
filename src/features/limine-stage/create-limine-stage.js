import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createInfoCard } from "../../objects/cards/index.js";
import { createCircuitTrace } from "../../objects/connections/circuit-trace/index.js";
import { createDataStream } from "../../objects/effects/data-stream/index.js";
import { createLabeledDataPacket } from "../../objects/effects/labeled-data-packet/index.js";
import { createExpandingStageLayer } from "../../objects/layers/expanding-stage-layer/index.js";
import { createConfigSelection } from "./create-config-selection.js";
import { createHandoffCards } from "./create-handoff-cards.js";
import { LIMINE_STAGE_CONFIG } from "./config.js";

function createHandoffDoor() {
  const points = [
    new THREE.Vector3(-2.55, 1.62, 0.76),
    new THREE.Vector3(-2.55, 2.06, 0.76),
    new THREE.Vector3(-1.85, 2.06, 0.76),
    new THREE.Vector3(-1.85, 1.62, 0.76),
  ];
  const material = new THREE.LineBasicMaterial({
    color: 0xd8f8ff,
    opacity: 0,
    transparent: true,
  });
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    material,
  );
  line.name = "limine-handoff-door";
  line.renderOrder = 8;
  return { line, material };
}

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
      titleColor: "#ffffff",
      titleFont: "900 320px ui-monospace, SFMono-Regular, Consolas, monospace",
    },
  });
  const stageGroup = stageLayer.contentGroup;
  group.add(stageLayer.group);

  const zoneWidth = config.layer.width / config.zones.length;
  const zones = config.zones.map((definition) => {
    const card = createInfoCard({
      title: definition.title,
      description: definition.description,
      width: zoneWidth * 0.78,
      height: 0.28,
      depth: 0.76,
      color: 0x081827,
      edgeColor: 0x7de1ff,
      labelPlacement: "front",
      labelOptions: {
        panel: false,
        titleColor: "#ffffff",
        descriptionColor: "#e4f8ff",
        titleFont: "900 310px ui-monospace, SFMono-Regular, Consolas, monospace",
        descriptionFont: "700 118px ui-monospace, SFMono-Regular, Consolas, monospace",
      },
    });
    card.group.position.set(
      definition.x,
      config.layer.height / 2 + 0.14,
      0.72,
    );
    stageLayer.registerScalingLabel(card.label);
    stageGroup.add(card.group);
    return { card, definition };
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

  const configSelection = createConfigSelection();
  configSelection.labels.forEach((label) => stageLayer.registerScalingLabel(label));
  stageGroup.add(configSelection.group);

  const configToLoader = createCircuitTrace({
    points: [
      new THREE.Vector3(2.2, config.layer.height / 2 + 0.04, 0.72),
      new THREE.Vector3(1.1, config.layer.height / 2 + 0.04, 0.72),
      new THREE.Vector3(0, config.layer.height / 2 + 0.04, 0.72),
    ],
  });
  const loaderToHandoff = createCircuitTrace({
    points: [
      new THREE.Vector3(0, config.layer.height / 2 + 0.04, 0.52),
      new THREE.Vector3(-1.1, config.layer.height / 2 + 0.04, 0.52),
      new THREE.Vector3(-2.2, config.layer.height / 2 + 0.04, 0.52),
    ],
  });
  stageGroup.add(configToLoader.group, loaderToHandoff.group);

  const limineConfigPoints = [
      new THREE.Vector3(2.2, 0.72, 0.9),
      new THREE.Vector3(2.2, 1.08, 0.9),
      new THREE.Vector3(2.2, 1.63, 0.72),
  ];
  const limineConfigStream = createDataStream({
    points: limineConfigPoints,
    count: 10,
    blockSize: [0.18, 0.08, 0.24],
    trailLength: 0.48,
    color: 0xbdefff,
  });
  limineConfigStream.group.name = "limine-conf-stream";
  const limineConfigPacket = createLabeledDataPacket({
    name: "limine-conf-packet",
    title: "limine.conf",
    points: limineConfigPoints,
  });

  const kernelFilePoints = [
      new THREE.Vector3(0, 0.72, 0.9),
      new THREE.Vector3(0, 1.12, 0.9),
      new THREE.Vector3(0, 1.63, 0.72),
  ];
  const kernelFileStream = createDataStream({
    points: kernelFilePoints,
    count: 14,
    blockSize: [0.2, 0.09, 0.3],
    trailLength: 0.55,
    color: 0x8ee8ff,
  });
  kernelFileStream.group.name = "kernel-elf-stream";
  const kernelFilePacket = createLabeledDataPacket({
    name: "kernel-elf-packet",
    title: "kernel.elf",
    points: kernelFilePoints,
    width: 0.9,
    color: 0x08243a,
    edgeColor: 0x8ee8ff,
  });

  const handoffCards = createHandoffCards();
  const handoffDoor = createHandoffDoor();
  const handoffImpulse = createDataStream({
    points: [
      new THREE.Vector3(-2.2, 1.64, 0.76),
      new THREE.Vector3(-2.2, 1.94, 0.76),
      new THREE.Vector3(-1.35, 2.24, 0.46),
      new THREE.Vector3(0, 2.35, 0),
    ],
    count: 12,
    blockSize: [0.16, 0.08, 0.24],
    trailLength: 0.42,
    color: 0xcaf6ff,
  });
  group.add(
    limineConfigStream.group,
    limineConfigPacket.group,
    kernelFileStream.group,
    kernelFilePacket.group,
    handoffCards.group,
    handoffDoor.line,
    handoffImpulse.group,
  );

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
    const control = smootherstep(handoffProgress);
    const stageState = stageLayer.setState({
      revealProgress: layerVisibility,
      surfaceProgress: intervalProgress(layerProgress, 0.62, 1),
      liftProgress: lift,
      expansionProgress,
      labelProgress: intervalProgress(expansionProgress, 0.18, 0.72),
      labelOpacity: 1 - configIn,
      retreatProgress,
      opacity,
    });
    const { activeOpacity, expansion } = stageState;
    dividerMaterial.opacity = expansion * activeOpacity * 0.34;

    const zoneProgress = [configIn, loaderIn, handoffIn];
    zones.forEach(({ card }, index) => {
      const dimmedByHandoff = index < 2 ? 1 - control : 1;
      card.setState({
        progress: zoneProgress[index],
        activationProgress: zoneProgress[index],
        pulseProgress: index === 2 ? control : 0,
        opacity: activeOpacity * dimmedByHandoff,
      });
    });

    limineConfigStream.setState({
      progress: intervalProgress(configProgress, 0, 0.68),
      opacity: activeOpacity * (1 - control),
    });
    limineConfigPacket.setState({
      progress: intervalProgress(configProgress, 0, 0.68),
      opacity: activeOpacity * (1 - control),
    });
    configSelection.setState(
      intervalProgress(configProgress, 0.36, 1),
      activeOpacity * (1 - control),
    );

    const configFlow = Math.sin(loaderIn * Math.PI);
    configToLoader.setState({
      progress: loaderIn,
      opacity: configFlow * activeOpacity * (1 - control),
      pulse: 1,
    });
    kernelFileStream.setState({
      progress: intervalProgress(kernelLoaderProgress, 0.08, 0.72),
      opacity: activeOpacity * (1 - control),
    });
    kernelFilePacket.setState({
      progress: intervalProgress(kernelLoaderProgress, 0.08, 0.72),
      opacity: activeOpacity * (1 - control),
    });

    const handoffFlow = Math.sin(handoffIn * Math.PI);
    loaderToHandoff.setState({
      progress: handoffIn,
      opacity: handoffFlow * activeOpacity,
      pulse: 1,
    });
    handoffCards.setState(handoffPrepareProgress, activeOpacity * (1 - control * 0.35));
    handoffDoor.material.opacity = control * activeOpacity;
    handoffImpulse.setState({
      progress: control,
      opacity: activeOpacity,
    });
  };
  setState();

  return {
    group,
    setState,
    dispose() {
      handoffImpulse.dispose();
      handoffCards.dispose();
      handoffDoor.line.geometry.dispose();
      handoffDoor.material.dispose();
      limineConfigStream.dispose();
      limineConfigPacket.dispose();
      kernelFileStream.dispose();
      kernelFilePacket.dispose();
      configSelection.dispose();
      configToLoader.dispose();
      loaderToHandoff.dispose();
      zones.forEach(({ card }) => card.dispose());
      stageLayer.dispose();
      group.removeFromParent();
    },
  };
}
