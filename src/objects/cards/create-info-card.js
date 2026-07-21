import * as THREE from "three";
import { smootherstep } from "../../animation/progress.js";
import { createHorizontalLabel } from "../labels/create-horizontal-label.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";

export function createInfoCard({
  title,
  description = "",
  width = 1.4,
  height = 0.08,
  depth = 0.72,
  color = 0x0a1622,
  edgeColor = 0x68c9ff,
  labelPlacement = "top",
  labelOptions,
}) {
  const group = new THREE.Group();
  group.name = `info-card:${title.toLowerCase().replaceAll(" ", "-")}`;
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: edgeColor,
    emissiveIntensity: 0.08,
    metalness: 0.45,
    opacity: 0,
    roughness: 0.34,
    transparent: true,
  });
  group.add(new THREE.Mesh(geometry, material));
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: edgeColor,
    opacity: 0,
    transparent: true,
  });
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial));
  const labelDepth = labelPlacement === "front" ? height / 0.7 : depth;
  const label = createHorizontalLabel(
    title,
    description,
    width,
    labelDepth,
    labelOptions,
  );
  if (labelPlacement === "front") {
    label.plane.position.z = depth / 2 + 0.008;
    label.plane.rotation.x = 0;
  } else {
    label.plane.position.y = height / 2 + 0.008;
  }
  group.add(label.plane);

  const setState = ({
    progress = 0,
    activationProgress = progress,
    pulseProgress = 0,
    opacity = 1,
  } = {}) => {
    const reveal = smootherstep(progress);
    const activation = smootherstep(activationProgress);
    const pulse = smootherstep(pulseProgress);
    group.visible = opacity > 0.001 && reveal > 0.001;
    group.scale.setScalar(THREE.MathUtils.lerp(0.72, 1, reveal));
    material.opacity = reveal * opacity * THREE.MathUtils.lerp(0.3, 1, activation);
    material.emissiveIntensity = 0.025 + activation * 0.58 + pulse * 0.72;
    edgeMaterial.opacity = reveal * opacity * THREE.MathUtils.lerp(
      0.12,
      0.9,
      activation,
    );
    label.material.opacity = reveal * opacity * THREE.MathUtils.lerp(
      0.2,
      1,
      activation,
    );
  };
  setState();

  return {
    group,
    setState,
    dispose() {
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
