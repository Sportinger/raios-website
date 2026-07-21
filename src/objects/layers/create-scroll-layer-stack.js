import * as THREE from "three";
import { clamp, intervalProgress, smootherstep } from "../../animation/progress.js";

const DEFAULT_PHASES = Object.freeze({
  outlineStart: 0.03,
  outlineEnd: 0.5,
  extrusionStart: 0.54,
  extrusionEnd: 0.96,
});

function createTopOutline(width, height, depth, color) {
  const corners = [
    new THREE.Vector3(-width / 2, height / 2, -depth / 2),
    new THREE.Vector3(width / 2, height / 2, -depth / 2),
    new THREE.Vector3(width / 2, height / 2, depth / 2),
    new THREE.Vector3(-width / 2, height / 2, depth / 2),
    new THREE.Vector3(-width / 2, height / 2, -depth / 2),
  ];
  const edgeLengths = corners.slice(0, -1).map((corner, index) => (
    corner.distanceTo(corners[index + 1])
  ));
  const positions = new Float32Array(corners.length * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setDrawRange(0, 0);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 });

  return {
    corners,
    edgeLengths,
    geometry,
    line: new THREE.Line(geometry, material),
    material,
    perimeter: edgeLengths.reduce((total, length) => total + length, 0),
    positions,
    cursor: new THREE.Vector3(),
  };
}

function renderOutline(outline, progress) {
  let remaining = outline.perimeter * progress;
  let vertexCount = progress > 0 ? 1 : 0;

  outline.corners[0].toArray(outline.positions, 0);
  for (let index = 0; index < outline.edgeLengths.length && remaining > 0; index += 1) {
    const edgeLength = outline.edgeLengths[index];
    const edgeProgress = clamp(remaining / edgeLength);
    outline.cursor.copy(outline.corners[index]).lerp(outline.corners[index + 1], edgeProgress);
    outline.cursor.toArray(outline.positions, vertexCount * 3);
    vertexCount += 1;
    remaining -= edgeLength;
  }

  outline.geometry.attributes.position.needsUpdate = true;
  outline.geometry.setDrawRange(0, vertexCount);
  outline.material.opacity = progress > 0 ? 0.96 : 0;
}

function createScrollLayer(definition, bottomY) {
  const {
    width, height, depth, color, edgeColor, outlineColor = edgeColor,
    metalness = 0.4, roughness = 0.5,
  } = definition;
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({
    color, metalness, roughness, transparent: true, opacity: 0,
  });
  group.add(new THREE.Mesh(geometry, material));

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: edgeColor, transparent: true, opacity: 0,
  });
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial));
  const outline = createTopOutline(width, height, depth, outlineColor);
  group.add(outline.line);

  const render = ({ outlineProgress, extrusionProgress }) => {
    const verticalScale = THREE.MathUtils.lerp(0.001, 1, extrusionProgress);
    group.scale.set(1, verticalScale, 1);
    group.position.y = bottomY + (height * verticalScale) / 2;
    material.opacity = extrusionProgress;
    edgeMaterial.opacity = extrusionProgress * 0.72;
    renderOutline(outline, outlineProgress);
  };

  render({ outlineProgress: 0, extrusionProgress: 0 });
  return { bottomY, group, height, render, topY: bottomY + height };
}

export function createScrollLayerStack(definitions, options = {}) {
  const group = new THREE.Group();
  const phases = { ...DEFAULT_PHASES, ...(options.phases || {}) };
  let nextBottomY = Number.isFinite(options.baseY) ? options.baseY : 0;

  const layers = definitions.map((definition) => {
    const layer = createScrollLayer(definition, nextBottomY);
    nextBottomY = layer.topY;
    group.add(layer.group);
    return layer;
  });

  const render = (totalProgress) => {
    layers.forEach((layer, index) => {
      const layerProgress = clamp(totalProgress * layers.length - index);
      layer.render({
        outlineProgress: smootherstep(intervalProgress(
          layerProgress, phases.outlineStart, phases.outlineEnd,
        )),
        extrusionProgress: smootherstep(intervalProgress(
          layerProgress, phases.extrusionStart, phases.extrusionEnd,
        )),
      });
    });
  };

  render(0);
  return { group, layers, render };
}
