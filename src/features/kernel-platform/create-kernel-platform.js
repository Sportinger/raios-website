import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createExpandingStageLayer } from "../../objects/layers/expanding-stage-layer/index.js";
import { monospaceFont } from "../../objects/labels/typography.js";
import { KERNEL_PLATFORM_CONFIG } from "./config.js";

export function createKernelPlatform({ sourceAnchor }) {
  const config = KERNEL_PLATFORM_CONFIG;
  const group = new THREE.Group();
  group.name = "kernel-platform";

  const kernelLayer = createExpandingStageLayer({
    name: "rust-kernel-layer",
    title: "RUST KERNEL",
    sourcePosition: sourceAnchor.position,
    targetPosition: [0, config.hoverY, 0],
    sourceSize: sourceAnchor.size,
    size: [config.width, config.height, config.depth],
    color: 0xffffff,
    edgeColor: 0x80909b,
    emissive: 0x000000,
    emissiveIntensity: 0,
    envMapIntensity: 0.22,
    metalness: 0,
    roughness: 0.055,
    transmission: 1,
    thickness: 3.2,
    ior: 1.04,
    dispersion: 0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.16,
    attenuationColor: 0xffffff,
    attenuationDistance: 30,
    specularIntensity: 0.28,
    transmissionResolution: 768,
    transmissionSamples: 8,
    transmissionBackside: true,
    transmissionBacksideThickness: 0.45,
    chromaticAberration: 0.002,
    anisotropicBlur: 0.025,
    distortion: 0.025,
    distortionScale: 0.24,
    surfaceRandomness: 0.58,
    surfaceVariation: 0.16,
    tintHue: 0,
    tintIntensity: 0,
    transmissionBrightness: 0.62,
    surfaceRenderOrder: 40,
    depthWrite: false,
    bevelRadius: 0.09,
    bevelSegments: 5,
    edgeOpacity: 0,
    recenterOnExpansion: true,
    labelWidth: config.width * 0.92,
    labelOptions: {
      panel: false,
      titleColor: "#ffffff",
      titleFont: monospaceFont(900, 320),
    },
  });
  group.add(kernelLayer.group);

  const setState = ({
    assemblyProgress = 0,
    landingProgress = 0,
    runningProgress = 0,
    opacity = 1,
  } = {}) => {
    const assembly = smootherstep(assemblyProgress);
    const landing = smootherstep(landingProgress);
    const running = smootherstep(runningProgress);
    kernelLayer.setState({
      revealProgress: intervalProgress(assembly, 0, 0.12),
      surfaceProgress: intervalProgress(assembly, 0, 0.12),
      liftProgress: intervalProgress(assembly, 0, 0.46),
      expansionProgress: intervalProgress(assembly, 0.42, 1),
      labelProgress: intervalProgress(assembly, 0.7, 1),
      emissiveIntensityScale: THREE.MathUtils.lerp(1, 3.5, running),
      opacity,
    });
    kernelLayer.group.position.y -= (
      config.hoverY - config.landedY
    ) * landing;
  };
  setState();

  return {
    group,
    prepareRender(renderer, scene, camera) {
      kernelLayer.prepareRender(renderer, scene, camera);
    },
    setState,
    dispose() {
      kernelLayer.dispose();
      group.removeFromParent();
    },
  };
}
