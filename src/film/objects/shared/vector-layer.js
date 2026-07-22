import * as THREE from "three";

const UNIT_Y = new THREE.Vector3(0, 1, 0);
const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (value) => {
  const amount = clamp01(value);
  return amount * amount * (3 - 2 * amount);
};
const timedProgress = (time, start, end) => {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return smoothstep((time - start) / (end - start));
};
const trackGeometry = (tracker, geometry) => tracker?.geometry?.(geometry) ?? geometry;
const trackMaterial = (tracker, material) => tracker?.material?.(material) ?? material;

function createMaterial(tracker, color, opacity = 1) {
  const material = trackMaterial(tracker, new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 0.999,
    opacity,
    depthWrite: opacity >= 0.999,
  }));
  material.userData.vectorLayerBaseOpacity = opacity;
  return material;
}

function trackObjectResources(tracker, object) {
  if (!tracker || !object) return;
  if (object.geometry) tracker.geometry?.(object.geometry);
  if (!object.material) return;
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  materials.forEach((material) => tracker.material?.(material));
}

function createBeamBetween(tracker, start, end, radius, color) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const beam = new THREE.Mesh(
    trackGeometry(tracker, new THREE.CylinderGeometry(radius, radius, direction.length(), 8)),
    createMaterial(tracker, color),
  );
  beam.position.copy(start).add(end).multiplyScalar(0.5);
  beam.quaternion.setFromUnitVectors(UNIT_Y, direction.normalize());
  return beam;
}

function createThickBoxEdges(tracker, size, color, radius) {
  const group = new THREE.Group();
  const half = size.clone().multiplyScalar(0.5);
  [-1, 1].forEach((ySign) => {
    [-1, 1].forEach((zSign) => {
      group.add(createBeamBetween(
        tracker,
        new THREE.Vector3(-half.x, ySign * half.y, zSign * half.z),
        new THREE.Vector3(half.x, ySign * half.y, zSign * half.z),
        radius,
        color,
      ));
    });
    [-1, 1].forEach((xSign) => {
      group.add(createBeamBetween(
        tracker,
        new THREE.Vector3(xSign * half.x, ySign * half.y, -half.z),
        new THREE.Vector3(xSign * half.x, ySign * half.y, half.z),
        radius,
        color,
      ));
    });
  });
  [-1, 1].forEach((xSign) => {
    [-1, 1].forEach((zSign) => {
      group.add(createBeamBetween(
        tracker,
        new THREE.Vector3(xSign * half.x, -half.y, zSign * half.z),
        new THREE.Vector3(xSign * half.x, half.y, zSign * half.z),
        radius,
        color,
      ));
    });
  });
  return group;
}

function createOutlinedBody(tracker, size, color, edgeColor, edgeRadius) {
  const group = new THREE.Group();
  const geometry = trackGeometry(tracker, new THREE.BoxGeometry(size.x, size.y, size.z));
  group.add(
    new THREE.Mesh(geometry, createMaterial(tracker, color)),
    createThickBoxEdges(tracker, size, edgeColor, edgeRadius),
  );
  return group;
}

function createFootprintOutline(tracker, width, depth, baseY, color, radius) {
  const halfWidth = width * 0.5;
  const halfDepth = depth * 0.5;
  const points = [
    new THREE.Vector3(-halfWidth, baseY + 0.025, halfDepth),
    new THREE.Vector3(halfWidth, baseY + 0.025, halfDepth),
    new THREE.Vector3(halfWidth, baseY + 0.025, -halfDepth),
    new THREE.Vector3(-halfWidth, baseY + 0.025, -halfDepth),
  ];
  const group = new THREE.Group();
  const segments = points.map((start, index) => {
    const end = points[(index + 1) % points.length];
    const beam = createBeamBetween(tracker, start, end, radius, color);
    beam.material.transparent = true;
    beam.material.opacity = 0;
    group.add(beam);
    return { beam, start, end };
  });
  return { group, segments };
}

function setFootprintOutline(outline, drawAmount, opacity) {
  const draw = clamp01(drawAmount);
  const alpha = clamp01(opacity);
  outline.group.visible = draw * alpha > 0.001;
  outline.segments.forEach(({ beam, start, end }, index) => {
    const segmentProgress = clamp01(draw * outline.segments.length - index);
    beam.visible = segmentProgress * alpha > 0.001;
    beam.position.lerpVectors(start, end, segmentProgress * 0.5);
    beam.scale.y = Math.max(0.001, segmentProgress);
    beam.material.opacity = alpha;
  });
}

function setObjectOpacity(root, opacity) {
  if (!root) return;
  const value = clamp01(opacity);
  root.visible = value > 0.001;
  root.traverse((object) => {
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (material.userData.vectorLayerBaseOpacity === undefined) {
        material.userData.vectorLayerBaseOpacity = material.opacity;
      }
      const baseOpacity = material.userData.vectorLayerBaseOpacity;
      material.transparent = material.userData.preserveTransparency
        || baseOpacity < 0.999
        || value < 0.999;
      material.opacity = baseOpacity * value;
      if ("depthWrite" in material) material.depthWrite = baseOpacity >= 0.999 && value >= 0.999;
    });
  });
}

export function createVectorLayer({
  tracker,
  id = "layer",
  width,
  depth,
  height,
  baseY = 0,
  color,
  edgeColor,
  edgeRadius = 0.024,
  outlineRadius = 0.026,
  topOpacity = 0.94,
  gridDivisions = 8,
  gridOpacity = 0.18,
  title,
  titlePosition = [0, baseY + height * 0.52, depth / 2 + 0.034],
  underglow,
} = {}) {
  if (![width, depth, height].every((value) => Number.isFinite(value) && value > 0)) {
    throw new TypeError("A vector layer requires positive width, depth and height.");
  }
  const group = new THREE.Group();
  group.name = `vector-layer-${id}`;
  const body = createOutlinedBody(
    tracker,
    new THREE.Vector3(width, height, depth),
    color,
    edgeColor,
    edgeRadius,
  );
  body.position.y = baseY + height / 2;
  const top = new THREE.Mesh(
    trackGeometry(tracker, new THREE.PlaneGeometry(width - 0.08, depth - 0.08)),
    createMaterial(tracker, color, topOpacity),
  );
  top.rotation.x = -Math.PI / 2;
  top.position.y = baseY + height + 0.009;
  const grid = new THREE.GridHelper(Math.max(width, depth), gridDivisions, edgeColor, edgeColor);
  trackObjectResources(tracker, grid);
  grid.scale.set(width / Math.max(width, depth), 1, depth / Math.max(width, depth));
  grid.position.y = baseY + height + 0.006;
  const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
  gridMaterials.forEach((material) => {
    material.transparent = true;
    material.opacity = gridOpacity;
    material.userData.vectorLayerBaseOpacity = gridOpacity;
  });
  const outline = createFootprintOutline(
    tracker,
    width,
    depth,
    baseY,
    edgeColor,
    outlineRadius,
  );
  if (title) title.position.set(...titlePosition);
  group.add(body, top, grid, outline.group);
  if (title) group.add(title);
  if (underglow) group.add(underglow);
  const layer = {
    group,
    body,
    top,
    grid,
    title,
    underglow,
    outline,
    width,
    depth,
    height,
    baseY,
    titlePosition: title ? title.position.clone() : null,
    underglowScale: underglow ? underglow.scale.clone() : null,
    underglowPosition: underglow ? underglow.position.clone() : null,
    gridScale: grid.scale.clone(),
    surface: Object.freeze({
      id,
      color,
      centerX: 0,
      centerZ: 0,
      width,
      depth,
      top: baseY + height,
    }),
  };
  setVectorLayerBuild(layer, { outlineAmount: 0, riseAmount: 0, opacity: 0 });
  return layer;
}

export function setVectorLayerBuild(layer, {
  outlineAmount = 1,
  riseAmount = 1,
  opacity = 1,
  outlineOpacity = opacity,
  titleOpacity,
} = {}) {
  const rise = clamp01(riseAmount);
  const alpha = clamp01(opacity);
  const solidVisible = rise > 0.001 && alpha > 0.001;
  layer.body.scale.y = Math.max(0.001, rise);
  layer.body.position.y = layer.baseY + layer.height * rise / 2;
  layer.top.position.y = layer.baseY + layer.height * rise + 0.009;
  layer.grid.position.y = layer.baseY + layer.height * rise + 0.006;
  if (layer.title && layer.titlePosition) {
    layer.title.position.y = THREE.MathUtils.lerp(
      layer.baseY,
      layer.titlePosition.y,
      rise,
    );
  }
  setObjectOpacity(layer.body, solidVisible ? alpha : 0);
  setObjectOpacity(layer.top, solidVisible ? alpha : 0);
  setObjectOpacity(layer.grid, solidVisible ? alpha : 0);
  setObjectOpacity(layer.underglow, solidVisible ? alpha : 0);
  const resolvedTitleOpacity = titleOpacity ?? alpha * clamp01((rise - 0.55) / 0.45);
  setObjectOpacity(layer.title, solidVisible ? resolvedTitleOpacity : 0);
  setFootprintOutline(layer.outline, outlineAmount, outlineOpacity);
  layer.group.visible = solidVisible || clamp01(outlineAmount) * clamp01(outlineOpacity) > 0.001;
}

export function setVectorLayerLifecycle(layer, time, {
  introStart,
  introEnd,
  outroStart = Number.POSITIVE_INFINITY,
  outroEnd = Number.POSITIVE_INFINITY,
  opacity = 1,
  outlineShare = 0.38,
} = {}) {
  const introDuration = Math.max(0.001, introEnd - introStart);
  const introOutlineEnd = introStart + introDuration * outlineShare;
  const outlineIn = timedProgress(time, introStart, introOutlineEnd);
  const riseIn = timedProgress(time, introOutlineEnd, introEnd);

  const hasOutro = Number.isFinite(outroStart)
    && Number.isFinite(outroEnd)
    && outroEnd > outroStart;
  const outroDuration = hasOutro ? outroEnd - outroStart : 1;
  const lowerEnd = outroStart + outroDuration * (1 - outlineShare);
  const lowerOut = hasOutro ? timedProgress(time, outroStart, lowerEnd) : 0;
  const outlineOut = hasOutro ? timedProgress(time, lowerEnd, outroEnd) : 0;
  const riseAmount = riseIn * (1 - lowerOut);
  const outlineAmount = outlineIn * (1 - outlineOut);
  const introOutlineOpacity = 1 - timedProgress(
    time,
    introOutlineEnd,
    introOutlineEnd + introDuration * 0.34,
  );
  const outroOutlineOpacity = hasOutro
    ? timedProgress(time, outroStart, outroStart + outroDuration * 0.16) * (1 - outlineOut)
    : 0;
  const alpha = clamp01(opacity);
  setVectorLayerBuild(layer, {
    outlineAmount,
    riseAmount,
    opacity: alpha,
    outlineOpacity: alpha * Math.max(introOutlineOpacity, outroOutlineOpacity),
    titleOpacity: alpha * riseAmount,
  });
  return Object.freeze({ outlineAmount, riseAmount, outroAmount: Math.max(lowerOut, outlineOut) });
}

export function setVectorLayerFootprint(layer, scaleX, scaleZ) {
  layer.body.scale.x = scaleX;
  layer.body.scale.z = scaleZ;
  layer.top.scale.set(scaleX, scaleZ, 1);
  layer.grid.scale.set(
    layer.gridScale.x * scaleX,
    layer.gridScale.y,
    layer.gridScale.z * scaleZ,
  );
  if (layer.underglow && layer.underglowScale && layer.underglowPosition) {
    layer.underglow.scale.set(
      layer.underglowScale.x * scaleX,
      layer.underglowScale.y * scaleZ,
      layer.underglowScale.z,
    );
    layer.underglow.position.z = layer.underglowPosition.z * scaleZ;
  }
  if (layer.title && layer.titlePosition) {
    layer.title.position.z = layer.titlePosition.z * scaleZ;
  }
}
