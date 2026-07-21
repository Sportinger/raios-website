import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createInfoCard } from "../../objects/cards/index.js";
import { createCircuitTrace } from "../../objects/connections/circuit-trace/index.js";
import { createExpandingStageLayer } from "../../objects/layers/expanding-stage-layer/index.js";
import { LIMINE_STAGE_CONFIG } from "./config.js";

export function createLimineStage() {
  const config = LIMINE_STAGE_CONFIG;
  const group = new THREE.Group();
  group.name = "limine-stage";
  const stageLayer = createExpandingStageLayer({
    name: "limine-boot-stage",
    title: "LIMINE BOOT ENVIRONMENT",
    sourcePosition: config.source,
    targetPosition: config.layer.position,
    sourceSize: config.sourceSize,
    size: [config.layer.width, config.layer.height, config.layer.depth],
    color: config.color,
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

  const zones = config.zones.map((definition) => {
    const card = createInfoCard({
      title: definition.title,
      description: definition.description,
      width: 2.25,
      height: 0.28,
      depth: 0.76,
      color: config.color,
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

  const configToLoader = createCircuitTrace({
    points: [
      new THREE.Vector3(1.45, config.layer.height / 2 + 0.04, 0.72),
      new THREE.Vector3(0, config.layer.height / 2 + 0.04, 0.62),
      new THREE.Vector3(-1.45, config.layer.height / 2 + 0.04, 0.52),
    ],
  });
  stageGroup.add(configToLoader.group);

  const setState = ({
    layerProgress = 0,
    configProgress = 0,
    kernelLoaderProgress = 0,
    handoffProgress = 0,
    retreatProgress = 0,
    opacity = 1,
  } = {}) => {
    const lift = intervalProgress(layerProgress, 0, 0.48);
    const expansionProgress = intervalProgress(layerProgress, 0.48, 1);
    const layerVisibility = intervalProgress(layerProgress, 0, 0.16);
    const configIn = smootherstep(configProgress);
    const loaderIn = smootherstep(kernelLoaderProgress);
    const control = smootherstep(handoffProgress);
    const stageState = stageLayer.setState({
      revealProgress: layerVisibility,
      surfaceProgress: intervalProgress(layerProgress, 0.62, 1),
      liftProgress: lift,
      expansionProgress,
      labelProgress: intervalProgress(expansionProgress, 0.18, 0.72),
      labelOpacity: 1,
      retreatProgress,
      opacity,
    });
    const { activeOpacity } = stageState;

    const zoneProgress = [configIn, loaderIn];
    zones.forEach(({ card }, index) => {
      card.setState({
        progress: zoneProgress[index],
        activationProgress: zoneProgress[index],
        opacity: activeOpacity * (1 - control),
      });
    });

    const configFlow = Math.sin(loaderIn * Math.PI);
    configToLoader.setState({
      progress: loaderIn,
      opacity: configFlow * activeOpacity * (1 - control),
      pulse: 1,
    });
  };
  setState();

  return {
    group,
    setState,
    dispose() {
      configToLoader.dispose();
      zones.forEach(({ card }) => card.dispose());
      stageLayer.dispose();
      group.removeFromParent();
    },
  };
}
