import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createInfoCard } from "../../objects/cards/index.js";
import { createCircuitTrace } from "../../objects/connections/circuit-trace/index.js";
import { createLayerAnchor } from "../../objects/layers/create-layer-anchor.js";
import { createExpandingStageLayer } from "../../objects/layers/expanding-stage-layer/index.js";
import { monospaceFont } from "../../objects/labels/typography.js";
import { LIMINE_STAGE_CONFIG } from "./config.js";

export function createLimineStage({ sourceAnchor }) {
  const config = LIMINE_STAGE_CONFIG;
  const group = new THREE.Group();
  group.name = "limine-stage";
  const stageLayer = createExpandingStageLayer({
    name: "limine-boot-stage",
    title: "LIMINE BOOT ENVIRONMENT",
    sourcePosition: sourceAnchor.position,
    targetPosition: config.layer.position,
    sourceSize: sourceAnchor.size,
    size: [config.layer.width, config.layer.height, config.layer.depth],
    color: 0xe8edff,
    edgeColor: 0x829cff,
    emissive: 0x000000,
    emissiveIntensity: 0,
    envMapIntensity: 0.3,
    metalness: 0,
    roughness: 0.02,
    transmission: 1,
    thickness: 3.2,
    ior: 1.04,
    dispersion: 0,
    clearcoat: 0.24,
    clearcoatRoughness: 0.12,
    attenuationColor: 0xd5ddff,
    attenuationDistance: 25,
    specularIntensity: 0.36,
    transmissionResolution: 768,
    transmissionSamples: 8,
    transmissionBackside: true,
    transmissionBacksideThickness: 0.45,
    chromaticAberration: 0.008,
    anisotropicBlur: 0.02,
    distortion: 0.03,
    distortionScale: 0.24,
    surfaceRandomness: 0.48,
    surfaceVariation: 0.2,
    tintHue: 228,
    tintIntensity: 0.58,
    transmissionBrightness: 1.45,
    surfaceRenderOrder: 30,
    depthWrite: false,
    bevelRadius: 0.09,
    bevelSegments: 5,
    edgeOpacity: 0,
    recenterOnExpansion: true,
    labelWidth: config.layer.width * 0.92,
    labelOptions: {
      panel: false,
      titleColor: "#ffffff",
      titleFont: monospaceFont(900, 320),
    },
  });
  const stageGroup = stageLayer.contentGroup;
  group.add(stageLayer.group);
  const configZone = config.zones.find(({ id }) => id === "config");
  const kernelLoader = config.zones.find(({ id }) => id === "kernel-loader");

  const zones = config.zones.map((definition) => {
    const card = createInfoCard({
      title: definition.title,
      width: config.zone.size[0],
      height: config.zone.size[1],
      depth: config.zone.size[2],
      color: config.color,
      edgeColor: 0x7de1ff,
      labelPlacement: "front",
      labelOptions: {
        panel: false,
        titleColor: "#ffffff",
        titleFont: monospaceFont(900, 310),
      },
      renderOrder: 35,
    });
    card.group.position.set(
      definition.x,
      config.layer.height / 2 + config.zone.size[1] / 2,
      config.zone.z,
    );
    stageLayer.registerScalingLabel(card.label);
    stageLayer.registerTransmissionForeground(card.group);
    stageGroup.add(card.group);
    return { card, definition };
  });

  const configToLoader = createCircuitTrace({
    points: [
      new THREE.Vector3(
        configZone.x,
        config.layer.height / 2 + 0.04,
        config.zone.z,
      ),
      new THREE.Vector3(0, config.layer.height / 2 + 0.04, config.zone.z - 0.1),
      new THREE.Vector3(
        kernelLoader.x,
        config.layer.height / 2 + 0.04,
        config.zone.z - 0.2,
      ),
    ],
    renderOrder: 36,
  });
  stageGroup.add(configToLoader.group);
  stageLayer.registerTransmissionForeground(configToLoader.group);
  const anchors = Object.freeze({
    kernelLoader: createLayerAnchor([
      config.layer.position[0] + kernelLoader.x,
      config.layer.position[1] + config.layer.height / 2 + config.zone.size[1] / 2,
      config.layer.position[2] + config.zone.z,
    ], config.zone.size),
  });

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
    anchors,
    group,
    prepareRender(renderer, scene, camera) {
      stageLayer.prepareRender(renderer, scene, camera);
    },
    setState,
    dispose() {
      configToLoader.dispose();
      zones.forEach(({ card }) => card.dispose());
      stageLayer.dispose();
      group.removeFromParent();
    },
  };
}
