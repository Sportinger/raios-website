import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createSurfaceCurrent } from "../../objects/effects/surface-current/index.js";
import { createHorizontalLabel } from "../../objects/labels/create-horizontal-label.js";
import { monospaceFont } from "../../objects/labels/typography.js";
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

  const label = createHorizontalLabel(
    BARE_METAL_CONFIG.label.title,
    "",
    BARE_METAL_CONFIG.label.width,
    BARE_METAL_CONFIG.label.height,
    {
      panel: false,
      titleFont: monospaceFont(900, 310),
    },
  );
  label.plane.position.set(0, 0, BARE_METAL_CONFIG.depth / 2 + 0.011);
  label.plane.rotation.x = 0;
  group.add(label.plane);

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
      label.setScaleCompensation(1, verticalScale, verticalScale);
      group.position.y = BARE_METAL_CONFIG.bottomY
        + (BARE_METAL_CONFIG.height * reveal) / 2;
      material.opacity = reveal * opacity;
      material.emissiveIntensity = surge * 0.34;
      edgeMaterial.opacity = reveal * opacity * 0.82;
      label.material.opacity = smootherstep(intervalProgress(
        elevation,
        0.28,
        0.72,
      )) * reveal * opacity;
      surfaceCurrent.setState(currentProgress, opacity);
    },

    dispose() {
      surfaceCurrent.dispose();
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
