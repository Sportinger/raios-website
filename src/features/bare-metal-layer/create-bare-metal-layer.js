import * as THREE from "three";
import { smootherstep } from "../../animation/progress.js";
import { createHorizontalLabel } from "../../objects/labels/create-horizontal-label.js";
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
    BARE_METAL_CONFIG.label,
    "",
    BARE_METAL_CONFIG.width * 0.58,
    BARE_METAL_CONFIG.depth * 0.48,
  );
  label.plane.position.y = BARE_METAL_CONFIG.height / 2 + 0.012;
  group.add(label.plane);

  return {
    group,

    setState({ revealProgress, labelProgress, opacity }) {
      const reveal = smootherstep(revealProgress);
      const verticalScale = THREE.MathUtils.lerp(0.001, 1, reveal);
      group.visible = opacity > 0.001 && reveal > 0.001;
      group.scale.set(1, verticalScale, 1);
      group.position.y = BARE_METAL_CONFIG.bottomY
        + (BARE_METAL_CONFIG.height * verticalScale) / 2;
      material.opacity = reveal * opacity;
      edgeMaterial.opacity = reveal * opacity * 0.82;
      label.material.opacity = smootherstep(labelProgress) * opacity;
    },

    dispose() {
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
