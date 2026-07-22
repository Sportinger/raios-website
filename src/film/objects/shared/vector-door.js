import * as THREE from "three";

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (value) => {
  const amount = clamp01(value);
  return amount * amount * (3 - 2 * amount);
};

const trackGeometry = (tracker, geometry) => tracker?.geometry?.(geometry) ?? geometry;
const trackMaterial = (tracker, material) => tracker?.material?.(material) ?? material;
const trackTexture = (tracker, texture) => tracker?.texture?.(texture) ?? texture;
const VECTOR_DOOR_LABEL_FONT = "Consolas, monospace";
const VECTOR_DOOR_LABEL_FONT_SIZE = 190;
const VECTOR_DOOR_LABEL_WIDTH = 2.1;

function createMaterial(tracker, color, options = {}) {
  const material = trackMaterial(tracker, new THREE.MeshBasicMaterial({
    color,
    transparent: options.opacity !== undefined && options.opacity < 1,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide,
  }));
  material.userData.vectorDoorBaseOpacity = options.opacity ?? 1;
  return material;
}

function createBeamBetween(tracker, start, end, radius, color, radialSegments = 8) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const material = createMaterial(tracker, color);
  const beam = new THREE.Mesh(
    trackGeometry(tracker, new THREE.CylinderGeometry(
      radius,
      radius,
      direction.length(),
      radialSegments,
    )),
    material,
  );
  beam.position.copy(start).add(end).multiplyScalar(0.5);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return beam;
}

function createThickBoxEdges(tracker, size, color, radius = 0.024) {
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

function createOutlinedBox(tracker, size, color, edgeColor) {
  const group = new THREE.Group();
  const geometry = trackGeometry(tracker, new THREE.BoxGeometry(size.x, size.y, size.z));
  group.add(
    new THREE.Mesh(geometry, createMaterial(tracker, color)),
    createThickBoxEdges(tracker, size, edgeColor),
  );
  return group;
}

function setVectorOpacity(root, opacity) {
  const value = clamp01(opacity);
  root.visible = value > 0.001;
  root.traverse((object) => {
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (material.userData.vectorDoorBaseOpacity === undefined) {
        material.userData.vectorDoorBaseOpacity = material.opacity;
      }
      const baseOpacity = material.userData.vectorDoorBaseOpacity;
      material.transparent = material.userData.preserveTransparency
        || baseOpacity < 0.999
        || value < 0.999;
      material.opacity = baseOpacity * value;
    });
  });
}

function createFootprintOutline(tracker, width, depth, color) {
  const halfWidth = width * 0.5;
  const halfDepth = depth * 0.5;
  const points = [
    new THREE.Vector3(-halfWidth, 0.025, halfDepth),
    new THREE.Vector3(halfWidth, 0.025, halfDepth),
    new THREE.Vector3(halfWidth, 0.025, -halfDepth),
    new THREE.Vector3(-halfWidth, 0.025, -halfDepth),
  ];
  const group = new THREE.Group();
  const segments = points.map((start, index) => {
    const end = points[(index + 1) % points.length];
    const beam = createBeamBetween(tracker, start, end, 0.026, color);
    beam.material.transparent = true;
    beam.material.opacity = 0;
    group.add(beam);
    return { beam, start, end };
  });
  return { group, segments };
}

function setFootprintOutline(outline, drawAmount, opacity = 1) {
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

export function createSlidingFloorHatch({
  tracker,
  width = 1.08,
  depth = 1.08,
  color = 0x8bc5ff,
  fillColor = 0x03070d,
  rotationY = 0,
} = {}) {
  const group = new THREE.Group();
  group.name = "sliding-floor-hatch";
  group.rotation.y = rotationY;
  const outline = createFootprintOutline(tracker, width, depth, color);
  const recess = new THREE.Mesh(
    trackGeometry(tracker, new THREE.BoxGeometry(width, 0.035, depth)),
    createMaterial(tracker, fillColor),
  );
  recess.position.y = 0.012;
  const panels = new THREE.Group();
  const panelWidth = width * 0.48;
  const panelDepth = depth * 0.94;
  const leftPanel = createOutlinedBox(
    tracker,
    new THREE.Vector3(panelWidth, 0.05, panelDepth),
    0x101d2b,
    color,
  );
  const rightPanel = createOutlinedBox(
    tracker,
    new THREE.Vector3(panelWidth, 0.05, panelDepth),
    0x101d2b,
    color,
  );
  leftPanel.position.set(-width * 0.245, 0.05, 0);
  rightPanel.position.set(width * 0.245, 0.05, 0);
  panels.add(leftPanel, rightPanel);
  group.add(recess, outline.group, panels);
  const hatch = {
    group,
    outline,
    recess,
    panels,
    leftPanel,
    rightPanel,
    width,
    depth,
    panelClosedX: width * 0.245,
    panelTravel: width * 0.62,
  };
  setSlidingFloorHatch(hatch, 0, 0, 0);
  return hatch;
}

export function setSlidingFloorHatch(hatch, outlineAmount, openAmount, opacity = 1) {
  const outlineDraw = clamp01(outlineAmount);
  const open = clamp01(openAmount);
  const alpha = clamp01(opacity);
  hatch.group.visible = (outlineDraw > 0.001 || open > 0.001) && alpha > 0.001;
  setFootprintOutline(hatch.outline, outlineDraw, alpha);
  setVectorOpacity(hatch.recess, alpha);
  hatch.recess.visible = open > 0.001 && alpha > 0.001;
  const panelRetract = smoothstep((open - 0.18) / 0.68);
  const panelAlpha = alpha * (1 - panelRetract);
  setVectorOpacity(hatch.panels, panelAlpha);
  hatch.panels.visible = (outlineDraw > 0.999 || open > 0.001) && panelAlpha > 0.001;
  const panelOffset = hatch.panelClosedX + hatch.panelTravel * open;
  const panelY = 0.05 - panelRetract * 0.1;
  hatch.leftPanel.position.set(-panelOffset, panelY, 0);
  hatch.rightPanel.position.set(panelOffset, panelY, 0);
}

export function createVectorDoor({
  tracker,
  edgeColor = 0x8bc5ff,
  panelColor = 0x101a28,
  panelEdgeColor = 0x4c91d9,
  lineDark = 0x29425d,
  amber = 0xf6c769,
  thresholdColor = 0xb6d9ff,
  rotationY = 0,
  hatchRotationY = rotationY,
  porchOffset = 0.82,
  porchSide = 1,
} = {}) {
  const group = new THREE.Group();
  group.name = "reusable-vector-door";
  const frame = new THREE.Group();
  const frameMaterial = createMaterial(tracker, edgeColor);
  const verticalGeometry = trackGeometry(tracker, new THREE.BoxGeometry(0.12, 1.55, 0.16));
  const lintelGeometry = trackGeometry(tracker, new THREE.BoxGeometry(1.18, 0.12, 0.16));
  const left = new THREE.Mesh(verticalGeometry, frameMaterial);
  const right = new THREE.Mesh(verticalGeometry, frameMaterial);
  const lintel = new THREE.Mesh(lintelGeometry, frameMaterial);
  const threshold = new THREE.Mesh(
    trackGeometry(tracker, new THREE.BoxGeometry(1.18, 0.075, 0.18)),
    createMaterial(tracker, thresholdColor),
  );
  left.position.set(-0.53, 0.775, 0);
  right.position.set(0.53, 0.775, 0);
  lintel.position.set(0, 1.49, 0);
  threshold.position.set(0, 0.1, 0);
  const leafPivot = new THREE.Group();
  leafPivot.position.set(-0.47, 0.75, 0);
  const leaf = createOutlinedBox(
    tracker,
    new THREE.Vector3(0.92, 1.36, 0.08),
    panelColor,
    panelEdgeColor,
  );
  leaf.position.x = 0.46;
  const inset = createOutlinedBox(
    tracker,
    new THREE.Vector3(0.68, 0.94, 0.04),
    0x0b1420,
    lineDark,
  );
  inset.position.set(0, 0, 0.062);
  const handle = new THREE.Mesh(
    trackGeometry(tracker, new THREE.SphereGeometry(0.045, 8, 5)),
    createMaterial(tracker, amber),
  );
  handle.position.set(0.33, 0, 0.09);
  leaf.add(inset, handle);
  leafPivot.add(leaf);
  const hinges = new THREE.Group();
  [0.32, 1.16].forEach((height) => {
    const hinge = new THREE.Mesh(
      trackGeometry(tracker, new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8)),
      createMaterial(tracker, amber),
    );
    hinge.position.set(-0.55, height, 0.1);
    hinges.add(hinge);
  });
  frame.add(left, right, lintel, threshold, leafPivot, hinges);
  frame.rotation.y = rotationY;
  const hatch = createSlidingFloorHatch({
    tracker,
    width: 1.56,
    depth: 1.56,
    color: edgeColor,
    fillColor: panelColor,
    rotationY: hatchRotationY,
  });
  // The frame marks the deck edge. The hatch/landing sits completely outside
  // that edge instead of straddling the layer underneath the frame.
  hatch.group.position.set(
    Math.sin(rotationY) * porchOffset * porchSide,
    0,
    Math.cos(rotationY) * porchOffset * porchSide,
  );
  group.add(hatch.group, frame);
  return {
    group,
    frame,
    hatch,
    leafPivot,
    hinge: leafPivot,
    leaf,
    rotationY,
    porchOffset,
    porchSide,
  };
}

export function anchorVectorDoorToSurface(door, {
  surface,
  edge,
  along = 0,
} = {}) {
  if (!door?.group || !Number.isFinite(surface?.top)) {
    throw new TypeError("A vector door requires a support surface with a finite top.");
  }
  const mechanism = door.mechanism ?? door;
  const hasBounds = Number.isFinite(surface.centerX)
    && Number.isFinite(surface.centerZ)
    && Number.isFinite(surface.width)
    && Number.isFinite(surface.depth);
  if (!hasBounds || !["front", "back", "left", "right"].includes(edge)) {
    throw new TypeError("A surface door requires bounded surface geometry and a valid edge.");
  }
  const edgeState = {
    front: { x: surface.centerX + along, z: surface.centerZ + surface.depth / 2, rotationY: 0, porchSide: 1 },
    back: { x: surface.centerX + along, z: surface.centerZ - surface.depth / 2, rotationY: 0, porchSide: -1 },
    right: { x: surface.centerX + surface.width / 2, z: surface.centerZ + along, rotationY: Math.PI / 2, porchSide: 1 },
    left: { x: surface.centerX - surface.width / 2, z: surface.centerZ + along, rotationY: Math.PI / 2, porchSide: -1 },
  }[edge];
  mechanism.rotationY = edgeState.rotationY;
  mechanism.porchSide = edgeState.porchSide;
  mechanism.frame.rotation.y = edgeState.rotationY;
  mechanism.hatch.group.rotation.y = edgeState.rotationY;
  mechanism.hatch.group.position.set(
    Math.sin(edgeState.rotationY) * mechanism.porchOffset * edgeState.porchSide,
    0,
    Math.cos(edgeState.rotationY) * mechanism.porchOffset * edgeState.porchSide,
  );
  if (surface.color !== undefined) {
    mechanism.hatch.recess.material.color.set(surface.color);
  }
  if (mechanism.label) {
    positionVectorDoorLabel(mechanism, mechanism.label);
  }
  door.group.position.set(edgeState.x, surface.top, edgeState.z);
  door.supportSurface = surface;
  door.supportEdge = edge;
  door.edgeOffset = along;
  mechanism.supportSurface = surface;
  mechanism.supportEdge = edge;
  mechanism.edgeOffset = along;
  return door;
}

export function createVectorDoorLabel({
  tracker,
  text,
  color = 0xf6c769,
} = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const texture = trackTexture(tracker, new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = trackMaterial(tracker, new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  }));
  material.userData.preserveTransparency = true;
  material.userData.vectorDoorBaseOpacity = 1;
  const label = new THREE.Sprite(material);
  label.scale.set(
    VECTOR_DOOR_LABEL_WIDTH,
    VECTOR_DOOR_LABEL_WIDTH * (canvas.height / canvas.width),
    1,
  );
  label.renderOrder = 50;
  label.userData.labelTexture = texture;
  label.userData.vectorDoorFullText = String(text);
  let renderedText = null;
  const drawText = (nextText) => {
    const copy = String(nextText);
    if (copy === renderedText) return;
    renderedText = copy;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = `800 ${VECTOR_DOOR_LABEL_FONT_SIZE}px ${VECTOR_DOOR_LABEL_FONT}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.letterSpacing = "4px";
    context.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
    context.fillText(copy, canvas.width / 2, canvas.height / 2, 920);
    texture.needsUpdate = true;
  };
  label.userData.setText = drawText;
  drawText(text);
  return label;
}

function positionVectorDoorLabel(door, label, {
  height = 0.12,
  offset = door.porchOffset + 0.04,
} = {}) {
  label.position.set(
    Math.sin(door.rotationY) * offset * door.porchSide,
    height,
    Math.cos(door.rotationY) * offset * door.porchSide,
  );
}

export function attachVectorDoorLabel(door, label, options = {}) {
  positionVectorDoorLabel(door, label, options);
  door.group.add(label);
  door.label = label;
  return label;
}

export function setVectorDoorOpen(door, amount, maxAngle = Math.PI * 0.62) {
  const open = clamp01(amount);
  // A negative local swing moves the leaf toward the positive porch normal.
  // porchSide reverses both the landing and the swing as one invariant.
  door.leafPivot.rotation.y = -door.porchSide * maxAngle * open;
}

function setVectorDoorPorchGrowth(door, amount, opacity) {
  const grow = smoothstep(amount);
  const alpha = clamp01(opacity);
  const halfDepth = door.hatch.depth * 0.5;
  const edgeGap = Math.max(0, door.porchOffset - halfDepth);
  const offset = edgeGap + halfDepth * grow;
  door.hatch.group.visible = grow > 0.001 && alpha > 0.001;
  door.hatch.group.scale.set(1, 1, Math.max(0.001, grow));
  door.hatch.group.position.set(
    Math.sin(door.rotationY) * offset * door.porchSide,
    0,
    Math.cos(door.rotationY) * offset * door.porchSide,
  );
  setFootprintOutline(door.hatch.outline, 1, alpha);
  setVectorOpacity(door.hatch.recess, alpha);
  door.hatch.recess.visible = grow > 0.001 && alpha > 0.001;
  door.hatch.panels.visible = false;
}

function setVectorDoorLabelTyping(door, amount, opacity) {
  if (!door.label) return;
  const write = clamp01(amount);
  const copy = door.label.userData.vectorDoorFullText ?? "";
  const characterCount = Math.ceil(copy.length * write);
  door.label.userData.setText(copy.slice(0, characterCount));
  setVectorOpacity(door.label, write > 0 ? clamp01(opacity) : 0);
}

export function setVectorDoorEmergence(door, {
  porchAmount = 1,
  labelAmount = 1,
  riseAmount = 1,
  opacity = 1,
  frameOpacity,
  undergroundY = -1.62,
} = {}) {
  const alpha = clamp01(opacity);
  const labelWrite = clamp01(labelAmount);
  const labelFinished = smoothstep((labelWrite - 0.9) / 0.1);
  const rise = clamp01(riseAmount) * labelFinished;
  setVectorDoorPorchGrowth(door, porchAmount, alpha);
  setVectorDoorLabelTyping(door, labelWrite, alpha);
  door.frame.position.y = THREE.MathUtils.lerp(undergroundY, 0, rise);
  door.frame.scale.y = 1;
  const resolvedFrameOpacity = frameOpacity ?? alpha * rise;
  setVectorOpacity(door.frame, clamp01(resolvedFrameOpacity) * labelFinished);
}
