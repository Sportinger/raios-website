import * as THREE from "three";

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (value) => {
  const amount = clamp01(value);
  return amount * amount * (3 - 2 * amount);
};

const trackGeometry = (tracker, geometry) => tracker?.geometry?.(geometry) ?? geometry;
const trackMaterial = (tracker, material) => tracker?.material?.(material) ?? material;

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
      material.transparent = baseOpacity < 0.999 || value < 0.999;
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
  rotationY = 0,
} = {}) {
  const group = new THREE.Group();
  group.name = "sliding-floor-hatch";
  group.rotation.y = rotationY;
  const outline = createFootprintOutline(tracker, width, depth, color);
  const recess = new THREE.Mesh(
    trackGeometry(tracker, new THREE.BoxGeometry(width * 0.94, 0.035, depth * 0.94)),
    createMaterial(tracker, 0x03070d),
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
  const doorVoid = new THREE.Mesh(
    trackGeometry(tracker, new THREE.PlaneGeometry(0.94, 1.36)),
    createMaterial(tracker, 0x04080e, { opacity: 0.7, side: THREE.DoubleSide }),
  );
  doorVoid.position.set(0, 0.78, -0.055);
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
  frame.add(doorVoid, left, right, lintel, threshold, leafPivot, hinges);
  frame.rotation.y = rotationY;
  const hatch = createSlidingFloorHatch({
    tracker,
    width: 1.56,
    depth: 1.56,
    color: edgeColor,
    rotationY: hatchRotationY,
  });
  group.add(hatch.group, frame);
  return { group, frame, hatch, leafPivot, hinge: leafPivot, leaf };
}

export function setVectorDoorEmergence(door, {
  outlineAmount = 1,
  openAmount = 1,
  riseAmount = 1,
  opacity = 1,
  frameOpacity = opacity * riseAmount,
  undergroundY = -1.62,
} = {}) {
  const rise = clamp01(riseAmount);
  setSlidingFloorHatch(door.hatch, outlineAmount, openAmount, opacity);
  door.frame.position.y = THREE.MathUtils.lerp(undergroundY, 0, rise);
  door.frame.scale.y = 1;
  setVectorOpacity(door.frame, frameOpacity);
}
