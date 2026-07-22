import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createHorizontalLabel } from "../labels/create-horizontal-label.js";
import { monospaceFont } from "../labels/typography.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";
import { applyBoxTextureScale } from "../materials/apply-box-texture-scale.js";
import { loadLightGoldTextures } from "../materials/load-light-gold-textures.js";

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
  edgeColor = 0x68c9ff,
  labelPlacement = "front",
  labelOptions,
  renderOrder = 5,
}) {
  const group = new THREE.Group();
  group.name = `info-card:${title.toLowerCase().replaceAll(" ", "-")}`;
  const contentGroup = new THREE.Group();
  contentGroup.name = `${group.name}:content`;
  group.add(contentGroup);
  const geometry = new THREE.BoxGeometry(width, height, depth);
  applyBoxTextureScale(geometry, {
    width,
    height,
    depth,
    tileSize: 0.65,
  });
  const textures = loadLightGoldTextures();
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    depthWrite: false,
    emissive: 0x000000,
    emissiveIntensity: 0,
    envMapIntensity: 0,
    map: textures.map,
    metalness: 1,
    metalnessMap: textures.metalnessMap,
    normalMap: textures.normalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    opacity: 0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    roughness: 1,
    roughnessMap: textures.roughnessMap,
    side: THREE.FrontSide,
    transparent: true,
  });
  material.userData.vectorStyleColor = 0xc6a24f;
  material.userData.vectorStyleEdgeColor = 0xf0cf77;
  const body = new THREE.Mesh(geometry, material);
  body.renderOrder = renderOrder;
  contentGroup.add(body);
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: edgeColor,
    depthWrite: false,
    opacity: 0,
    transparent: true,
  });
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    edgeMaterial,
  );
  edges.renderOrder = renderOrder + 1;
  contentGroup.add(edges);
  const footprintPoints = createFootprintPoints(width, height, depth);
  const outlineGeometry = new THREE.BufferGeometry().setFromPoints(footprintPoints);
  outlineGeometry.setDrawRange(0, 0);
  const outlineMaterial = new THREE.LineBasicMaterial({
    color: edgeColor,
    depthTest: false,
    depthWrite: false,
    opacity: 0,
    transparent: true,
  });
  const outline = new THREE.Line(outlineGeometry, outlineMaterial);
  outline.renderOrder = renderOrder + 1;
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
      titleFont: monospaceFont(900, 320),
      descriptionFont: monospaceFont(600, 72),
    } : undefined),
  );
  if (labelPlacement === "front") {
    label.plane.position.z = depth / 2 + 0.008;
    label.plane.rotation.x = 0;
  } else {
    label.plane.position.y = height / 2 + 0.008;
  }
  label.plane.renderOrder = renderOrder + 2;
  group.add(label.plane);

  const setState = ({
    progress = 0,
    activationProgress = progress,
    opacity = 1,
  } = {}) => {
    const outlineProgress = smootherstep(intervalProgress(progress, 0, 0.46));
    const extrusion = smootherstep(intervalProgress(progress, 0.5, 1));
    const faceReveal = smootherstep(intervalProgress(extrusion, 0.03, 0.22));
    const edgeReveal = smootherstep(intervalProgress(extrusion, 0.16, 0.46));
    const activation = smootherstep(activationProgress);
    const labelReveal = smootherstep(intervalProgress(extrusion, 0.58, 1));
    group.visible = opacity > 0.001
      && (outlineProgress > 0.001 || extrusion > 0.001);
    contentGroup.scale.set(1, Math.max(extrusion, 0.001), 1);
    contentGroup.position.y = -height * 0.5 * (1 - extrusion);
    outlineGeometry.setDrawRange(
      0,
      Math.ceil(outlineProgress * footprintPoints.length),
    );
    outlineMaterial.opacity = outlineProgress * opacity * (
      1 - smootherstep(intervalProgress(extrusion, 0.08, 0.36))
    );
    material.opacity = faceReveal * opacity * THREE.MathUtils.lerp(
      0.3,
      1,
      activation,
    );
    const edgeOutro = 1 - smootherstep(intervalProgress(extrusion, 0.58, 0.94));
    edgeMaterial.opacity = edgeReveal * edgeOutro * opacity * THREE.MathUtils.lerp(
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
    label,
    setState,
    dispose() {
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
