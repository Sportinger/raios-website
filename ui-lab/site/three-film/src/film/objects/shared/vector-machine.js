import * as THREE from "three";

const UNIT_Y = new THREE.Vector3(0, 1, 0);
const clamp01 = (value) => Math.min(1, Math.max(0, value));
const trackGeometry = (tracker, geometry) => tracker?.geometry?.(geometry) ?? geometry;
const trackMaterial = (tracker, material) => tracker?.material?.(material) ?? material;
const trackTexture = (tracker, texture) => tracker?.texture?.(texture) ?? texture;
const VECTOR_MACHINE_LABEL_COLOR = 0xf1f7ff;
const VECTOR_MACHINE_LABEL_FONT = "Consolas, monospace";
const VECTOR_MACHINE_LABEL_FONT_SIZE = 170;
const VECTOR_MACHINE_LABEL_WIDTH = 1.45;
const VECTOR_MACHINE_PROGRESS_WIDTH = 3.15;
const VECTOR_MACHINE_LAMP_COLORS = Object.freeze({
  pending: 0xf6c769,
  passed: 0x64c991,
  failed: 0xf05b57,
});

function roundedRectPath(context, x, y, width, height, radius) {
  const corner = Math.min(radius, width * 0.5, height * 0.5);
  context.beginPath();
  context.moveTo(x + corner, y);
  context.lineTo(x + width - corner, y);
  context.quadraticCurveTo(x + width, y, x + width, y + corner);
  context.lineTo(x + width, y + height - corner);
  context.quadraticCurveTo(x + width, y + height, x + width - corner, y + height);
  context.lineTo(x + corner, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - corner);
  context.lineTo(x, y + corner);
  context.quadraticCurveTo(x, y, x + corner, y);
  context.closePath();
}

function createMaterial(tracker, color, opacity = 1, options = {}) {
  const material = trackMaterial(tracker, new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 0.999,
    opacity,
    depthWrite: options.depthWrite ?? opacity >= 0.999,
    side: options.side ?? THREE.FrontSide,
  }));
  material.userData.vectorMachineBaseOpacity = opacity;
  return material;
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

function createMachineLabel(tracker, text) {
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
    depthTest: false,
    depthWrite: false,
  }));
  material.userData.preserveTransparency = true;
  material.userData.vectorMachineBaseOpacity = 1;
  const label = new THREE.Sprite(material);
  label.scale.set(
    VECTOR_MACHINE_LABEL_WIDTH,
    VECTOR_MACHINE_LABEL_WIDTH * canvas.height / canvas.width,
    1,
  );
  label.renderOrder = 52;
  let renderedText = null;
  const drawText = (nextText) => {
    const copy = String(nextText);
    if (copy === renderedText) return;
    renderedText = copy;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = `900 ${VECTOR_MACHINE_LABEL_FONT_SIZE}px ${VECTOR_MACHINE_LABEL_FONT}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineJoin = "round";
    context.lineWidth = Math.max(10, VECTOR_MACHINE_LABEL_FONT_SIZE * 0.14);
    context.strokeStyle = "#05080d";
    context.fillStyle = `#${new THREE.Color(VECTOR_MACHINE_LABEL_COLOR).getHexString()}`;
    context.strokeText(copy, canvas.width / 2, canvas.height / 2, 940);
    context.fillText(copy, canvas.width / 2, canvas.height / 2, 940);
    texture.needsUpdate = true;
  };
  label.userData.setText = drawText;
  drawText(text);
  return label;
}

function createMachineProgressOverlay(tracker, initialLabel) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 320;
  const context = canvas.getContext("2d");
  const texture = trackTexture(tracker, new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = trackMaterial(tracker, new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  }));
  material.userData.preserveTransparency = true;
  material.userData.vectorMachineBaseOpacity = 1;
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(
    VECTOR_MACHINE_PROGRESS_WIDTH,
    VECTOR_MACHINE_PROGRESS_WIDTH * canvas.height / canvas.width,
    1,
  );
  sprite.renderOrder = 78;
  sprite.visible = false;

  const overlay = {
    sprite,
    material,
    texture,
    context,
    renderedState: null,
    defaultLabel: initialLabel,
  };
  return overlay;
}

function drawMachineProgress(overlay, progress, label) {
  const value = clamp01(progress);
  const renderKey = `${label}:${Math.round(value * 1000)}`;
  if (overlay.renderedState === renderKey) return;
  overlay.renderedState = renderKey;

  const { context, texture } = overlay;
  context.clearRect(0, 0, 1024, 320);

  const trackX = 70;
  const trackY = 42;
  const trackWidth = 884;
  const trackHeight = 82;
  roundedRectPath(context, trackX, trackY, trackWidth, trackHeight, 41);
  context.fillStyle = "rgba(4, 12, 22, 0.94)";
  context.fill();
  context.lineWidth = 10;
  context.strokeStyle = "#8bc5ff";
  context.stroke();

  const fillX = trackX + 15;
  const fillY = trackY + 15;
  const fillWidth = (trackWidth - 30) * value;
  const fillHeight = trackHeight - 30;
  if (fillWidth > 0.5) {
    roundedRectPath(context, fillX, fillY, fillWidth, fillHeight, 26);
    context.fillStyle = "#8bc5ff";
    context.fill();
  }

  context.font = "700 74px Consolas, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineJoin = "round";
  context.lineWidth = 13;
  context.strokeStyle = "#05080d";
  context.fillStyle = "#f1f7ff";
  context.strokeText(label, 512, 225, 900);
  context.fillText(label, 512, 225, 900);
  texture.needsUpdate = true;
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
  const value = clamp01(opacity);
  root.traverse((object) => {
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (material.userData.vectorMachineBaseOpacity === undefined) {
        material.userData.vectorMachineBaseOpacity = material.opacity;
      }
      const baseOpacity = material.userData.vectorMachineBaseOpacity;
      material.transparent = material.userData.preserveTransparency
        || baseOpacity < 0.999
        || value < 0.999;
      material.opacity = baseOpacity * value;
    });
  });
}

export function createVectorMachine({
  tracker,
  id,
  title,
  size = [1.34, 1.12, 1.18],
  panelColor = 0x1c2a3d,
  panelTopColor = 0x263a52,
  edgeColor = 0x8bc5ff,
  lampCount = 0,
  progressLabel = null,
} = {}) {
  const [width, height, depth] = size;
  const group = new THREE.Group();
  group.name = `vector-machine-${id}`;
  const solid = new THREE.Group();
  const body = new THREE.Group();
  body.name = `${id}-animated-body`;
  const shadow = new THREE.Mesh(
    trackGeometry(tracker, new THREE.CircleGeometry(Math.max(width, depth) * 0.66, 4)),
    createMaterial(tracker, 0x000000, 0.38, { depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.rotation.z = Math.PI / 4;
  shadow.scale.y = 0.48;
  shadow.position.y = 0.015;
  const block = createOutlinedBox(
    tracker,
    new THREE.Vector3(width, height, depth),
    panelColor,
    edgeColor,
  );
  block.position.y = height / 2;
  const topInset = new THREE.Mesh(
    trackGeometry(tracker, new THREE.BoxGeometry(width * 0.7, 0.035, depth * 0.68)),
    createMaterial(tracker, panelTopColor),
  );
  topInset.position.y = height + 0.065;
  const lamps = new THREE.Group();
  const lampHeightRatios = lampCount === 1
    ? [0.56]
    : Array.from({ length: lampCount }, (_, index) => (
      THREE.MathUtils.lerp(0.34, 0.78, index / Math.max(1, lampCount - 1))
    ));
  const lampMeshes = lampHeightRatios.map((heightRatio) => {
    const lamp = new THREE.Mesh(
      trackGeometry(tracker, new THREE.BoxGeometry(0.035, 0.065, depth * 0.25)),
      createMaterial(tracker, VECTOR_MACHINE_LAMP_COLORS.pending),
    );
    lamp.position.set(width / 2 + 0.018, height * heightRatio, depth * 0.23);
    lamps.add(lamp);
    return lamp;
  });
  const titleLabel = createMachineLabel(tracker, title);
  titleLabel.position.set(0, height * 0.5, depth / 2 + 0.035);
  body.add(block, topInset, lamps, titleLabel);
  solid.add(shadow, body);
  const outline = createFootprintOutline(tracker, width, depth, edgeColor);
  group.add(outline.group, solid);
  const progressOverlay = progressLabel
    ? createMachineProgressOverlay(tracker, progressLabel)
    : null;
  if (progressOverlay) {
    progressOverlay.sprite.position.set(0, height + 1.02, 0);
    group.add(progressOverlay.sprite);
  }
  const machine = {
    group,
    solid,
    body,
    block,
    shadow,
    outline,
    titleLabel,
    lamps,
    lampMeshes,
    progressOverlay,
    width,
    height,
    depth,
  };
  setVectorMachineBuild(machine, { outlineAmount: 0, riseAmount: 0 });
  return machine;
}

export function setVectorMachineProgress(machine, {
  visible = false,
  progress = 0,
  label = machine?.progressOverlay?.defaultLabel ?? "",
} = {}) {
  const overlay = machine?.progressOverlay;
  if (!overlay) return;
  overlay.sprite.visible = Boolean(visible);
  if (!visible) return;
  drawMachineProgress(overlay, progress, label);
}

export function setVectorMachineLampStates(machine, states = []) {
  machine.lampMeshes.forEach((lamp, index) => {
    const state = states[index] ?? "pending";
    lamp.material.color.setHex(
      VECTOR_MACHINE_LAMP_COLORS[state] ?? VECTOR_MACHINE_LAMP_COLORS.pending,
    );
  });
}

export function setVectorMachineTitle(machine, title) {
  machine?.titleLabel?.userData.setText?.(title);
}

export function setVectorMachineBuild(machine, {
  outlineAmount = 1,
  riseAmount = 1,
  opacity = 1,
  outlineOpacity = opacity,
} = {}) {
  const rise = clamp01(riseAmount);
  const alpha = clamp01(opacity);
  const solidVisible = rise > 0.001 && alpha > 0.001;
  machine.solid.scale.y = Math.max(0.001, rise);
  setObjectOpacity(machine.solid, alpha);
  machine.solid.visible = solidVisible;
  setFootprintOutline(machine.outline, outlineAmount, outlineOpacity);
  machine.group.visible = solidVisible
    || clamp01(outlineAmount) * clamp01(outlineOpacity) > 0.001;
}

export function anchorVectorMachineToSurface(machine, {
  surface,
  x,
  z,
} = {}) {
  if (!Number.isFinite(surface?.top) || !Number.isFinite(x) || !Number.isFinite(z)) {
    throw new TypeError("A vector machine requires a support surface and finite x/z coordinates.");
  }
  machine.group.position.set(x, surface.top, z);
  machine.supportSurface = surface;
  return machine;
}
