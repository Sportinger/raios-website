import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createDataStream } from "../../objects/effects/data-stream/index.js";
import { createHorizontalLabel } from "../../objects/labels/create-horizontal-label.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";
import { KERNEL_PLATFORM_CONFIG } from "./config.js";

export function createKernelPlatform() {
  const group = new THREE.Group();
  group.name = "kernel-platform";
  const platformGroup = new THREE.Group();
  group.add(platformGroup);
  const cellWidth = KERNEL_PLATFORM_CONFIG.width / KERNEL_PLATFORM_CONFIG.columns;
  const cellDepth = KERNEL_PLATFORM_CONFIG.depth / KERNEL_PLATFORM_CONFIG.rows;
  const blockGeometry = new THREE.BoxGeometry(
    cellWidth - 0.08,
    KERNEL_PLATFORM_CONFIG.height,
    cellDepth - 0.08,
  );
  const blockMaterial = new THREE.MeshStandardMaterial({
    color: 0x070e17,
    emissive: 0x0e5f88,
    emissiveIntensity: 0.12,
    metalness: 0.5,
    roughness: 0.38,
  });
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x65cfff,
    opacity: 0.7,
    transparent: true,
  });
  const blocks = Array.from({
    length: KERNEL_PLATFORM_CONFIG.columns * KERNEL_PLATFORM_CONFIG.rows,
  }, (_, index) => {
    const column = index % KERNEL_PLATFORM_CONFIG.columns;
    const row = Math.floor(index / KERNEL_PLATFORM_CONFIG.columns);
    const joinedPosition = new THREE.Vector3(
      (column - (KERNEL_PLATFORM_CONFIG.columns - 1) / 2) * cellWidth,
      0,
      (row - (KERNEL_PLATFORM_CONFIG.rows - 1) / 2) * cellDepth,
    );
    const mesh = new THREE.Mesh(blockGeometry, blockMaterial);
    mesh.position.copy(joinedPosition);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(blockGeometry), edgeMaterial);
    mesh.add(edges);
    platformGroup.add(mesh);
    return { joinedPosition, mesh };
  });
  const label = createHorizontalLabel(
    "RUST KERNEL · SURVIVAL CORE",
    "",
    KERNEL_PLATFORM_CONFIG.width * 0.65,
    KERNEL_PLATFORM_CONFIG.depth * 0.42,
  );
  label.plane.position.y = KERNEL_PLATFORM_CONFIG.height / 2 + 0.018;
  platformGroup.add(label.plane);
  const landingLight = new THREE.PointLight(0x4ecbff, 0, 7, 2);
  landingLight.position.y = 0.8;
  platformGroup.add(landingLight);

  const transferStream = createDataStream({
    points: [
      new THREE.Vector3(4.35, 0.55, 1.4),
      new THREE.Vector3(2.1, -0.15, 0.1),
      new THREE.Vector3(0.45, -0.48, -1.55),
      new THREE.Vector3(0.4, 1.05, -1.1),
      new THREE.Vector3(0, KERNEL_PLATFORM_CONFIG.hoverY, 0),
    ],
    count: 24,
    blockSize: [0.22, 0.1, 0.38],
    trailLength: 0.62,
  });
  group.add(transferStream.group);

  const setState = ({
    transferProgress = 0,
    assemblyProgress = 0,
    landingProgress = 0,
    runningProgress = 0,
    opacity = 1,
  } = {}) => {
    transferStream.setState({ progress: transferProgress, opacity });
    const assembly = smootherstep(assemblyProgress);
    const landing = smootherstep(landingProgress);
    platformGroup.visible = assembly > 0.001;
    platformGroup.position.y = THREE.MathUtils.lerp(
      KERNEL_PLATFORM_CONFIG.hoverY,
      KERNEL_PLATFORM_CONFIG.landedY,
      landing,
    );
    blocks.forEach(({ mesh, joinedPosition }, index) => {
      const blockDelay = (index / Math.max(1, blocks.length - 1)) * 0.385;
      const blockProgress = smootherstep(intervalProgress(
        assembly,
        blockDelay,
        0.42 + blockDelay,
      ));
      mesh.visible = blockProgress > 0.001;
      mesh.position.copy(joinedPosition);
      mesh.position.y += THREE.MathUtils.lerp(1.5, 0, blockProgress);
      mesh.scale.setScalar(THREE.MathUtils.lerp(0.35, 1, blockProgress));
    });
    const running = smootherstep(runningProgress);
    label.material.opacity = smootherstep(intervalProgress(landing, 0.72, 1)) * opacity;
    blockMaterial.emissiveIntensity = THREE.MathUtils.lerp(0.12, 0.42, running);
    edgeMaterial.opacity = opacity * THREE.MathUtils.lerp(0.7, 1, running);
    landingLight.intensity = Math.sin(landing * Math.PI) * 4
      + (0.45 + Math.sin(running * Math.PI * 6) * 0.12) * running;
  };
  setState();

  return {
    group,
    platformGroup,
    setState,
    dispose() {
      transferStream.dispose();
      disposeObject3D(platformGroup);
      group.removeFromParent();
    },
  };
}
