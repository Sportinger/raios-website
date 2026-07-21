import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createHorizontalLabel } from "../labels/create-horizontal-label.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";

function createFootprintPoints(width, height, depth, segmentsPerEdge = 16) {
  const y = -height / 2 + 0.004;
  const corners = [
    new THREE.Vector3(-width / 2, y, -depth / 2),
    new THREE.Vector3(width / 2, y, -depth / 2),
    new THREE.Vector3(width / 2, y, depth / 2),
    new THREE.Vector3(-width / 2, y, depth / 2),
  ];
  const points = [];
  const point = new THREE.Vector3();
  corners.forEach((corner, index) => {
    const nextCorner = corners[(index + 1) % corners.length];
    for (let step = 0; step < segmentsPerEdge; step += 1) {
      points.push(point.clone().lerpVectors(corner, nextCorner, step / segmentsPerEdge));
    }
  });
  points.push(corners[0].clone());
  return points;
}

export function createInfoCard({
  title,
  description = "",
  width = 1.4,
  height = 0.08,
  depth = 0.72,
  color = 0x0a1622,
  edgeColor = 0x68c9ff,
  labelPlacement = "front",
  labelOptions,
}) {
  const group = new THREE.Group();
  group.name = `info-card:${title.toLowerCase().replaceAll(" ", "-")}`;
  const contentGroup = new THREE.Group();
  contentGroup.name = `${group.name}:content`;
  group.add(contentGroup);
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({
    color,
    depthWrite: false,
    emissive: edgeColor,
    emissiveIntensity: 0.08,
    metalness: 0.45,
    opacity: 0,
    roughness: 0.34,
    transparent: true,
  });
  const body = new THREE.Mesh(geometry, material);
  body.renderOrder = 5;
  contentGroup.add(body);
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: edgeColor,
    opacity: 0,
    transparent: true,
  });
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    edgeMaterial,
  );
  edges.renderOrder = 6;
  contentGroup.add(edges);
  const footprintPoints = createFootprintPoints(width, height, depth);
  const outlineGeometry = new THREE.BufferGeometry().setFromPoints(footprintPoints);
  outlineGeometry.setDrawRange(0, 0);
  const outlineMaterial = new THREE.LineBasicMaterial({
    color: edgeColor,
    opacity: 0,
    transparent: true,
  });
  const outline = new THREE.Line(outlineGeometry, outlineMaterial);
  outline.renderOrder = 6;
  group.add(outline);
  const labelDepth = labelPlacement === "front" ? height / 0.7 : depth;
  const label = createHorizontalLabel(
    title,
    description,
    width,
    labelDepth,
    labelOptions ?? (labelPlacement === "front" ? {
      panel: false,
      titleColor: "#ffffff",
      titleFont: "900 320px ui-monospace, SFMono-Regular, Consolas, monospace",
      descriptionFont: "600 72px ui-monospace, SFMono-Regular, Consolas, monospace",
    } : undefined),
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
    const outlineProgress = smootherstep(intervalProgress(progress, 0, 0.46));
    const extrusion = smootherstep(intervalProgress(progress, 0.38, 1));
    const activation = smootherstep(activationProgress);
    const pulse = smootherstep(pulseProgress);
    const labelReveal = smootherstep(intervalProgress(extrusion, 0.58, 1));
    group.visible = opacity > 0.001
      && (outlineProgress > 0.001 || extrusion > 0.001);
    group.scale.setScalar(1);
    contentGroup.scale.set(1, Math.max(extrusion, 0.001), 1);
    contentGroup.position.y = -height * 0.5 * (1 - extrusion);
    outlineGeometry.setDrawRange(
      0,
      Math.ceil(outlineProgress * footprintPoints.length),
    );
    outlineMaterial.opacity = outlineProgress * opacity * (1 - extrusion);
    material.opacity = extrusion * opacity * THREE.MathUtils.lerp(0.3, 1, activation);
    material.emissiveIntensity = 0.025 + activation * 0.58 + pulse * 0.72;
    edgeMaterial.opacity = extrusion * opacity * THREE.MathUtils.lerp(
      0.12,
      0.9,
      activation,
    );
    label.material.opacity = labelReveal * opacity * THREE.MathUtils.lerp(
      0.2,
      1,
      activation,
    );
  };
  setState();

  return {
    group,
    contentGroup,
    label,
    setState,
    dispose() {
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
