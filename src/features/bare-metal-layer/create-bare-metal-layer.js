import * as THREE from "three";
import { smootherstep } from "../../animation/progress.js";
import { createSurfaceCurrent } from "../../objects/effects/surface-current/index.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";
import { BARE_METAL_CONFIG } from "./config.js";

export function createBareMetalLayer() {
  const group = new THREE.Group();
  group.name = "bare-metal-layer";
  const geometry = new THREE.BoxGeometry(
    BARE_METAL_CONFIG.width,
    BARE_METAL_CONFIG.height,
    BARE_METAL_CONFIG.depth,
  );
  const material = new THREE.MeshStandardMaterial({
    color: BARE_METAL_CONFIG.color,
    emissive: BARE_METAL_CONFIG.edgeColor,
    emissiveIntensity: 0,
    metalness: 0.72,
    roughness: 0.36,
    transparent: true,
  });
  group.add(new THREE.Mesh(geometry, material));

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: BARE_METAL_CONFIG.edgeColor,
    transparent: true,
  });
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial));

  const surfaceCurrent = createSurfaceCurrent({
    width: BARE_METAL_CONFIG.width,
    depth: BARE_METAL_CONFIG.depth,
    height: BARE_METAL_CONFIG.height,
  });
  group.add(surfaceCurrent.group);

  return {
    group,

    setState({
      revealProgress = 1,
      opacity = 1,
      elevationProgress = 1,
      currentProgress = 0,
    }) {
      const reveal = smootherstep(revealProgress);
      const elevation = smootherstep(elevationProgress);
      const verticalScale = reveal * THREE.MathUtils.lerp(0.18, 1, elevation);
      const surge = Math.sin(elevation * Math.PI);
      group.visible = opacity > 0.001 && reveal > 0.001;
      group.scale.set(1, verticalScale, 1);
      group.position.y = BARE_METAL_CONFIG.bottomY
        + (BARE_METAL_CONFIG.height * reveal) / 2;
      material.opacity = reveal * opacity;
      material.emissiveIntensity = surge * 0.34;
      edgeMaterial.opacity = reveal * opacity * 0.82;
      surfaceCurrent.setState(currentProgress, opacity);
    },

    dispose() {
      surfaceCurrent.dispose();
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
