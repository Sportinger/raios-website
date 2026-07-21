import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createDataStream } from "../../objects/effects/data-stream/index.js";
import { createExpandingStageLayer } from "../../objects/layers/expanding-stage-layer/index.js";
import { KERNEL_PLATFORM_CONFIG } from "./config.js";

export function createKernelPlatform() {
  const config = KERNEL_PLATFORM_CONFIG;
  const group = new THREE.Group();
  group.name = "kernel-platform";

  const kernelLayer = createExpandingStageLayer({
    name: "rust-kernel-layer",
    title: "RUST KERNEL",
    sourcePosition: config.source,
    targetPosition: [0, config.hoverY, 0],
    sourceSize: config.sourceSize,
    size: [config.width, config.height, config.depth],
    color: config.color,
    edgeColor: 0x65cfff,
    emissive: 0x0e6f9e,
    emissiveIntensity: 0.12,
    metalness: 0.5,
    roughness: 0.38,
    surfaceOpacity: 0.9,
    surfaceRenderOrder: 5,
    depthWrite: true,
    recenterOnExpansion: true,
    labelWidth: config.width * 0.92,
    labelOptions: {
      panel: false,
      titleColor: "#ffffff",
      titleFont: "900 320px ui-monospace, SFMono-Regular, Consolas, monospace",
    },
  });
  group.add(kernelLayer.group);

  const transferStream = createDataStream({
    points: [
      new THREE.Vector3(-1.45, 1.72, 0.72),
      new THREE.Vector3(-1.45, 1.96, 0.72),
      new THREE.Vector3(-0.78, 2.18, 0.46),
      new THREE.Vector3(0, config.hoverY, 0),
    ],
    count: 24,
    blockSize: [0.22, 0.1, 0.38],
    trailLength: 0.62,
    color: 0x8ee8ff,
  });
  transferStream.group.name = "kernel-loader-to-rust-kernel";
  group.add(transferStream.group);

  const landingLight = new THREE.PointLight(0x4ecbff, 0, 7, 2);
  landingLight.position.set(0, 0.8, 0);
  kernelLayer.contentGroup.add(landingLight);

  const setState = ({
    transferProgress = 0,
    assemblyProgress = 0,
    landingProgress = 0,
    runningProgress = 0,
    opacity = 1,
  } = {}) => {
    const assembly = smootherstep(assemblyProgress);
    const landing = smootherstep(landingProgress);
    const running = smootherstep(runningProgress);
    transferStream.setState({
      progress: transferProgress,
      opacity: opacity * (1 - intervalProgress(assembly, 0.78, 1)),
    });
    kernelLayer.setState({
      revealProgress: intervalProgress(assembly, 0, 0.12),
      surfaceProgress: intervalProgress(assembly, 0.62, 1),
      liftProgress: intervalProgress(assembly, 0, 0.46),
      expansionProgress: intervalProgress(assembly, 0.42, 1),
      labelProgress: intervalProgress(assembly, 0.7, 1),
      emissiveIntensityScale: THREE.MathUtils.lerp(1, 3.5, running),
      opacity,
    });
    kernelLayer.group.position.y -= (
      config.hoverY - config.landedY
    ) * landing;
    landingLight.intensity = Math.sin(landing * Math.PI) * 4
      + (0.45 + Math.sin(running * Math.PI * 6) * 0.12) * running;
  };
  setState();

  return {
    group,
    platformGroup: kernelLayer.group,
    setState,
    dispose() {
      transferStream.dispose();
      kernelLayer.dispose();
      group.removeFromParent();
    },
  };
}
