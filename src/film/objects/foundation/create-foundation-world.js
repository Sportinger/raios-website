import * as THREE from "three";
import {
  BUILDER_FOOTPRINT,
  FOUNDATION_DOOR_SCALE,
  FOUNDATION_LAYER_HEIGHT,
  FOUNDATION_LAYOUT,
  FOUNDATION_SURFACES,
  FOUNDATION_TIMELINE,
  GENESIS_FOOTPRINT,
  KERNEL_FOOTPRINT,
} from "./foundation-config.js";
import { createLayerCallout, setLayerCallout } from "./layer-callout.js";
import {
  anchorVectorDoorToSurface,
  attachVectorDoorLabel,
  createSlidingFloorHatch,
  createVectorDoor,
  createVectorDoorLabel,
  setSlidingFloorHatch,
  setVectorDoorEmergence,
  setVectorDoorOpen,
} from "../shared/vector-door.js";

const PALETTE = Object.freeze({
  ink: 0xf1f7ff,
  muted: 0x8ea2b9,
  blue: 0x4c91d9,
  blueHigh: 0x8bc5ff,
  green: 0x64c991,
  greenHigh: 0xbaf3cf,
  amber: 0xf6c769,
  red: 0xf05b57,
  dark: 0x050a11,
  panel: 0x101a28,
  panelHigh: 0x1c2a3d,
  lineDark: 0x29425d,
});

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const progress = (time, start, end) => smoothstep((time - start) / (end - start));
const timedProgress = (time, timing) => progress(time, timing.start, timing.end);
const place = (object, coordinates) => object.position.set(...coordinates);
const FILM_CAMERA_DIRECTION = new THREE.Vector3(1, 0.8164965809, 1).normalize();
const DECK_HEIGHT_DELTA = FOUNDATION_LAYER_HEIGHT - 0.34;
const DECK_ROUTE_Y = FOUNDATION_SURFACES.genesis.top + 0.02;
const DECK_KEY_ROUTE_Y = FOUNDATION_SURFACES.genesis.top + 0.79;
const DECK_KEY_TARGET_Y = FOUNDATION_SURFACES.genesis.top + 0.76;

function anchorFoundationDoor(door, placement) {
  return anchorVectorDoorToSurface(door, {
    surface: FOUNDATION_SURFACES[placement.support],
    edge: placement.edge,
    along: placement.along,
  });
}

function createBeamBetween(start, end, radius, color, radialSegments = 8) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), radialSegments),
    new THREE.MeshBasicMaterial({ color }),
  );
  beam.position.copy(start).add(end).multiplyScalar(0.5);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return beam;
}

function createThickBoxEdges(size, color, radius = 0.024) {
  const group = new THREE.Group();
  const half = size.clone().multiplyScalar(0.5);
  [-1, 1].forEach((ySign) => {
    [-1, 1].forEach((zSign) => {
      group.add(createBeamBetween(
        new THREE.Vector3(-half.x, ySign * half.y, zSign * half.z),
        new THREE.Vector3(half.x, ySign * half.y, zSign * half.z),
        radius,
        color,
      ));
    });
    [-1, 1].forEach((xSign) => {
      group.add(createBeamBetween(
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
        new THREE.Vector3(xSign * half.x, -half.y, zSign * half.z),
        new THREE.Vector3(xSign * half.x, half.y, zSign * half.z),
        radius,
        color,
      ));
    });
  });
  return group;
}

function setOpacity(root, opacity) {
  root.visible = opacity > 0.001;
  root.traverse((object) => {
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      material.transparent = material.userData.preserveTransparency || opacity < 0.999;
      material.opacity = opacity;
    });
  });
}

function setFade(root, opacity) {
  const value = clamp01(opacity);
  root.visible = value > 0.001;
  root.traverse((object) => {
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (material.userData.foundationBaseOpacity === undefined) {
        material.userData.foundationBaseOpacity = material.opacity;
      }
      const baseOpacity = material.userData.foundationBaseOpacity;
      material.transparent = material.userData.preserveTransparency
        || baseOpacity < 0.999
        || value < 0.999;
      material.opacity = baseOpacity * value;
    });
  });
}

function createLabel(text, color = PALETTE.ink, width = 3, fontSize = 52) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  material.userData.preserveTransparency = true;
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width, width * (canvas.height / canvas.width), 1);
  sprite.renderOrder = 50;
  sprite.userData.labelTexture = texture;
  let renderedText = null;
  const drawText = (nextText) => {
    const copy = String(nextText);
    if (copy === renderedText) return;
    renderedText = copy;
    const renderedFontSize = Math.min(190, fontSize * 2.8);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = `800 ${renderedFontSize}px Consolas, monospace`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.letterSpacing = "4px";
    context.lineJoin = "round";
    context.lineWidth = Math.max(12, renderedFontSize * 0.16);
    context.strokeStyle = "#05080d";
    context.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
    context.strokeText(copy, canvas.width / 2, canvas.height / 2, 920);
    context.fillText(copy, canvas.width / 2, canvas.height / 2, 920);
    texture.needsUpdate = true;
  };
  sprite.userData.setText = drawText;
  drawText(text);
  return sprite;
}

function createCompilerProofToken() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, 256, 256);
  context.beginPath();
  context.arc(128, 128, 84, 0, Math.PI * 2);
  context.fillStyle = "rgba(33,116,70,.92)";
  context.fill();
  context.lineWidth = 14;
  context.strokeStyle = "#a3f3c0";
  context.stroke();
  context.beginPath();
  context.moveTo(82, 132);
  context.lineTo(113, 162);
  context.lineTo(176, 91);
  context.lineWidth = 18;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "#e2ffed";
  context.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  material.userData.preserveTransparency = true;
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.76, 0.76, 1);
  sprite.renderOrder = 58;
  return sprite;
}

function createEvidenceSeal(copy) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, 256, 256);
  context.beginPath();
  context.arc(128, 128, 82, 0, Math.PI * 2);
  context.fillStyle = "rgba(27,112,65,.96)";
  context.fill();
  context.lineWidth = 16;
  context.strokeStyle = "#a3f3c0";
  context.stroke();
  context.font = "900 112px Consolas, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineWidth = 22;
  context.strokeStyle = "#07101a";
  context.strokeText(copy, 128, 136);
  context.fillStyle = "#dcfbe8";
  context.fillText(copy, 128, 136);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  material.userData.preserveTransparency = true;
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.75, 0.75, 1);
  sprite.renderOrder = 59;
  return sprite;
}

function createTestReport() {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 384;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.beginPath();
  context.moveTo(40, 24);
  context.lineTo(220, 24);
  context.lineTo(280, 84);
  context.lineTo(280, 356);
  context.lineTo(40, 356);
  context.closePath();
  context.fillStyle = "rgba(9,27,38,.96)";
  context.fill();
  context.strokeStyle = "#9dd8b4";
  context.lineWidth = 16;
  context.lineJoin = "round";
  context.stroke();
  context.beginPath();
  context.moveTo(220, 24);
  context.lineTo(220, 84);
  context.lineTo(280, 84);
  context.stroke();
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "900 64px Consolas, monospace";
  context.lineWidth = 14;
  context.strokeStyle = "#05080d";
  context.fillStyle = "#dce8f4";
  context.strokeText("TEST", 160, 184);
  context.fillText("TEST", 160, 184);
  context.fillStyle = "#82f0ac";
  context.strokeText("PASS", 160, 262);
  context.fillText("PASS", 160, 262);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  material.userData.preserveTransparency = true;
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.48, 0.58, 1);
  sprite.renderOrder = 60;
  return sprite;
}

function createFloorDecal(text, color, width = 3.4, depth = 1.05) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 320;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.beginPath();
  context.roundRect(18, 18, canvas.width - 36, canvas.height - 36, 54);
  context.fillStyle = "rgba(128, 25, 29, 0.2)";
  context.fill();
  context.lineWidth = 18;
  context.strokeStyle = `#${color.toString(16).padStart(6, "0")}`;
  context.stroke();
  context.font = "900 188px Consolas, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 12, 920);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  material.userData.preserveTransparency = true;
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  decal.rotation.x = -Math.PI / 2;
  decal.renderOrder = 18;
  decal.userData.labelTexture = texture;
  return decal;
}

function createWideLabel(text, color = PALETTE.ink, width = 6, fontSize = 44) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 180;
  const context = canvas.getContext("2d");
  const renderedFontSize = Math.min(138, fontSize * 2.45);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = `800 ${renderedFontSize}px Consolas, monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineJoin = "round";
  context.lineWidth = Math.max(8, renderedFontSize * 0.1);
  context.strokeStyle = "#05080d";
  context.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
  context.strokeText(text, canvas.width / 2, canvas.height / 2, 1960);
  context.fillText(text, canvas.width / 2, canvas.height / 2, 1960);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  material.userData.preserveTransparency = true;
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width, width * canvas.height / canvas.width, 1);
  sprite.renderOrder = 52;
  sprite.userData.labelTexture = texture;
  return sprite;
}

function createDeckLabel(text, color, width, sideHeight) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 192;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = "900 132px Consolas, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.letterSpacing = "5px";
  context.lineJoin = "round";
  context.lineWidth = 18;
  context.strokeStyle = "#05080d";
  context.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
  context.strokeText(text, canvas.width / 2, canvas.height / 2, 940);
  context.fillText(text, canvas.width / 2, canvas.height / 2, 940);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  material.userData.preserveTransparency = true;
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(width, sideHeight * 0.72),
    material,
  );
  decal.renderOrder = 16;
  decal.userData.labelTexture = texture;
  return decal;
}

function createGlow(color, width = 2.4, height = width) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  const hex = `#${color.toString(16).padStart(6, "0")}`;
  gradient.addColorStop(0, hex);
  gradient.addColorStop(0.2, `${hex}bb`);
  gradient.addColorStop(0.55, `${hex}42`);
  gradient.addColorStop(1, `${hex}00`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  sprite.scale.set(width, height, 1);
  sprite.userData.labelTexture = texture;
  return sprite;
}

function createOutlinedBox(size, color, edgeColor = PALETTE.blueHigh) {
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color }));
  const edges = createThickBoxEdges(size, edgeColor);
  group.add(mesh, edges);
  return group;
}

function createSlabFacets(width, depth, height) {
  const group = new THREE.Group();
  const colors = [0x101824, 0x0b121c, 0x172234, 0x0d1622];
  const frontTriangles = [
    [[-width / 2, 0], [-width * 0.12, height], [0, 0]],
    [[0, 0], [-width * 0.12, height], [width * 0.22, height]],
    [[0, 0], [width * 0.22, height], [width / 2, 0]],
  ];
  frontTriangles.forEach((triangle, index) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      triangle.map(([x, y]) => new THREE.Vector3(x, y - height / 2, depth / 2 + 0.006)),
    );
    geometry.setIndex([0, 1, 2]);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: colors[index],
      side: THREE.DoubleSide,
    }));
    group.add(mesh);
  });
  const rightTriangles = [
    [[-depth / 2, 0], [-depth * 0.08, height], [0, 0]],
    [[0, 0], [-depth * 0.08, height], [depth / 2, height]],
    [[0, 0], [depth / 2, height], [depth / 2, 0]],
  ];
  rightTriangles.forEach((triangle, index) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      triangle.map(([z, y]) => new THREE.Vector3(width / 2 + 0.006, y - height / 2, z)),
    );
    geometry.setIndex([0, 1, 2]);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: colors[index + 1],
      side: THREE.DoubleSide,
    }));
    group.add(mesh);
  });
  return group;
}

function createDeck({ width, depth, height, color, edgeColor, label, labelColor = edgeColor }) {
  const group = new THREE.Group();
  const body = createOutlinedBox(new THREE.Vector3(width, height, depth), color, edgeColor);
  body.position.y = height / 2;
  const top = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.08, depth - 0.08),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.94 }),
  );
  top.rotation.x = -Math.PI / 2;
  top.position.y = height + 0.009;
  const grid = new THREE.GridHelper(Math.max(width, depth), 8, edgeColor, edgeColor);
  grid.scale.set(width / Math.max(width, depth), 1, depth / Math.max(width, depth));
  grid.position.y = height + 0.006;
  grid.material.transparent = true;
  grid.material.opacity = 0.18;
  const title = new THREE.Group();
  if (label) {
    const titleWidth = Math.min(2.25, Math.max(1.65, width * 0.34));
    const titleDecal = createDeckLabel(label, labelColor, titleWidth, height);
    title.add(titleDecal);
  }
  title.position.set(0, height * 0.52, depth / 2 + 0.034);
  const underglow = createGlow(edgeColor, width * 0.96, depth * 0.34);
  underglow.material.opacity = 0.17;
  underglow.position.set(0, 0.04, depth * 0.18);
  group.add(body, top, grid, title, underglow);
  return {
    group,
    body,
    top,
    grid,
    title,
    underglow,
    width,
    depth,
    height,
    gridScale: grid.scale.clone(),
  };
}

function setDeckRise(deck, amount) {
  const scale = Math.max(0.001, amount);
  deck.body.scale.y = scale;
  deck.body.position.y = deck.height * scale / 2;
  deck.top.position.y = deck.height * scale + 0.009;
  deck.grid.position.y = deck.height * scale + 0.006;
  deck.title.position.y = deck.height * scale * 0.56;
  setOpacity(deck.title, clamp01((amount - 0.55) / 0.45));
  deck.group.visible = amount > 0.001;
}

function setDeckFootprint(deck, scaleX, scaleZ) {
  deck.body.scale.x = scaleX;
  deck.body.scale.z = scaleZ;
  deck.top.scale.set(scaleX, scaleZ, 1);
  deck.grid.scale.set(
    deck.gridScale.x * scaleX,
    deck.gridScale.y,
    deck.gridScale.z * scaleZ,
  );
  deck.underglow.scale.set(
    deck.width * 0.96 * scaleX,
    deck.depth * 0.34 * scaleZ,
    1,
  );
  deck.underglow.position.z = deck.depth * 0.18 * scaleZ;
  deck.title.position.z = deck.depth * 0.5 * scaleZ + 0.04;
}

function createFootprintOutline(width, depth, color) {
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
    const beam = createBeamBetween(start, end, 0.026, color);
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

function createAgent() {
  const group = new THREE.Group();
  const solid = new THREE.Group();
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.92, 4),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.rotation.z = Math.PI / 4;
  shadow.scale.y = 0.48;
  shadow.position.y = 0.015;
  const body = createOutlinedBox(new THREE.Vector3(1.34, 1.12, 1.18), PALETTE.panelHigh, PALETTE.blueHigh);
  body.position.y = 0.61;
  const topInset = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, 0.035, 0.8),
    new THREE.MeshBasicMaterial({ color: 0x263a52 }),
  );
  topInset.position.y = 1.185;
  const status = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 10, 6),
    new THREE.MeshBasicMaterial({ color: PALETTE.blueHigh }),
  );
  status.position.set(0, 1.27, 0);
  const statusGlow = createGlow(PALETTE.blue, 0.75, 0.75);
  statusGlow.position.copy(status.position);
  const kerbMaterial = new THREE.LineBasicMaterial({ color: PALETTE.blueHigh });
  const kerbs = new THREE.Group();
  [-0.28, 0, 0.28].forEach((offset) => {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0.678, 0.35 + offset, 0.26),
        new THREE.Vector3(0.678, 0.35 + offset, 0.48),
      ]),
      kerbMaterial,
    );
    kerbs.add(line);
  });
  const label = createLabel("AGENT", PALETTE.ink, 1.18, 62);
  label.position.set(0, 0.66, 0.616);
  solid.add(shadow, body, topInset, status, statusGlow, kerbs, label);
  const outline = createFootprintOutline(1.34, 1.18, PALETTE.blueHigh);
  group.add(outline.group, solid);
  return { group, solid, outline };
}

function createKeyForge() {
  const group = new THREE.Group();
  const socket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 0.09, 4),
    new THREE.MeshBasicMaterial({ color: PALETTE.panelHigh }),
  );
  socket.position.y = 0.045;
  const socketEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(socket.geometry),
    new THREE.LineBasicMaterial({ color: PALETTE.greenHigh }),
  );
  socketEdges.rotation.copy(socket.rotation);
  socketEdges.position.copy(socket.position);
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.64, 8),
    new THREE.MeshBasicMaterial({ color: PALETTE.greenHigh }),
  );
  stem.position.y = 0.4;
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 12, 8),
    new THREE.MeshBasicMaterial({ color: PALETTE.amber }),
  );
  core.position.y = 0.74;
  const glow = createGlow(PALETTE.green, 1.4, 1.4);
  glow.position.copy(core.position);
  const burst = new THREE.Group();
  const burstMaterial = new THREE.LineBasicMaterial({ color: PALETTE.greenHigh, transparent: true });
  for (let index = 0; index < 4; index += 1) {
    const angle = index * Math.PI / 4;
    const dx = Math.cos(angle) * 0.34;
    const dy = Math.sin(angle) * 0.34;
    burst.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-dx, -dy, 0),
        new THREE.Vector3(dx, dy, 0),
      ]),
      burstMaterial,
    ));
  }
  burst.position.y = 0.74;
  const label = createLabel("GENESIS · KEY FORGE", PALETTE.greenHigh, 1.25, 43);
  label.position.set(0, 0.02, 0.72);
  group.add(socket, socketEdges, stem, core, glow, burst, label);
  return { group, core, glow, burst };
}

function createNetTower() {
  const group = new THREE.Group();
  const tower = new THREE.Group();
  const hatch = createSlidingFloorHatch({ color: PALETTE.blueHigh });

  const apex = new THREE.Vector3(0, 1.78, 0);
  const feet = [
    new THREE.Vector3(-0.42, 0.06, -0.12),
    new THREE.Vector3(0.42, 0.06, -0.12),
    new THREE.Vector3(-0.42, 0.06, 0.12),
    new THREE.Vector3(0.42, 0.06, 0.12),
  ];
  const mast = new THREE.Group();
  feet.forEach((foot) => mast.add(createBeamBetween(foot, apex, 0.028, PALETTE.blueHigh)));
  [0.48, 0.94].forEach((height, levelIndex) => {
    const halfWidth = levelIndex === 0 ? 0.31 : 0.21;
    [-0.12, 0.12].forEach((z) => {
      mast.add(createBeamBetween(
        new THREE.Vector3(-halfWidth, height, z),
        new THREE.Vector3(halfWidth, height, z),
        0.025,
        PALETTE.blueHigh,
      ));
    });
    [-halfWidth, halfWidth].forEach((x) => {
      mast.add(createBeamBetween(
        new THREE.Vector3(x, height, -0.12),
        new THREE.Vector3(x, height, 0.12),
        0.021,
        PALETTE.blue,
      ));
    });
  });

  const signal = new THREE.Mesh(
    new THREE.TorusGeometry(0.35, 0.018, 6, 48),
    new THREE.MeshBasicMaterial({ color: PALETTE.blue, transparent: true, opacity: 0.45 }),
  );
  signal.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), FILM_CAMERA_DIRECTION);
  signal.position.y = 1.62;
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 10, 6),
    new THREE.MeshBasicMaterial({ color: PALETTE.blueHigh }),
  );
  beacon.position.y = 1.78;
  const glow = createGlow(PALETTE.blue, 1.4, 1.4);
  glow.position.copy(beacon.position);
  const rings = [0, 1, 2].map(() => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.016, 6, 40),
      new THREE.MeshBasicMaterial({ color: PALETTE.blueHigh, transparent: true }),
    );
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), FILM_CAMERA_DIRECTION);
    ring.position.copy(beacon.position);
    tower.add(ring);
    return ring;
  });
  const label = createLabel("NET", PALETTE.ink, 1.45, 72);
  label.position.set(0, 0.14, 0.62);
  tower.add(mast, signal, beacon, glow, label);
  group.add(hatch.group, tower);
  return {
    group,
    tower,
    hatch,
    rings,
    signal,
    beacon,
    glow,
  };
}

function createDoorAndKey(labelText = "net.https", {
  positiveSlope = false,
  edgeColor = PALETTE.blueHigh,
  labelColor = PALETTE.amber,
  keyTagText = "CAP: NET.HTTPS",
  } = {}) {
  const door = createVectorDoor({
    edgeColor,
    panelColor: PALETTE.panel,
    panelEdgeColor: PALETTE.blue,
    lineDark: PALETTE.lineDark,
    amber: PALETTE.amber,
    thresholdColor: 0xb6d9ff,
    rotationY: positiveSlope ? 0 : Math.PI / 2,
  });
  const { group } = door;
  attachVectorDoorLabel(door, createVectorDoorLabel({
    text: labelText,
    color: labelColor,
  }));

  const key = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.045, 5, 18),
    new THREE.MeshBasicMaterial({ color: PALETTE.amber }),
  );
  const shaft = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.1, 0.1),
    new THREE.MeshBasicMaterial({ color: PALETTE.amber }),
  );
  shaft.position.x = 0.42;
  const tooth = shaft.clone();
  tooth.scale.set(0.25, 1, 1);
  tooth.rotation.z = Math.PI / 2;
  tooth.position.set(0.69, -0.12, 0);
  key.add(ring, shaft, tooth);
  const keyTag = createLabel(keyTagText, PALETTE.amber, 1.65, 40);
  keyTag.position.set(0.32, 0.38, 0);
  key.add(keyTag);
  key.position.set(-1.85, 0.74, -2.25);
  group.add(key);
  return { ...door, key };
}

function setEmergingDoor(door, time, timing, opacity = 1) {
  const duration = Math.max(0.001, timing.end - timing.start);
  const outlineEnd = timing.start + duration * 0.3;
  const hatchEnd = timing.start + duration * 0.55;
  const outlineDraw = progress(time, timing.start, outlineEnd);
  const hatchOpen = progress(time, outlineEnd, hatchEnd);
  const rise = progress(time, hatchEnd, timing.end);
  setVectorDoorEmergence(door, {
    outlineAmount: outlineDraw,
    openAmount: hatchOpen,
    riseAmount: rise,
    opacity,
    frameOpacity: progress(time, hatchEnd, hatchEnd + duration * 0.16) * clamp01(opacity),
  });
}

function createBuilderHatch(width, depth) {
  const group = new THREE.Group();
  const halfX = width / 2 - 0.08;
  const halfZ = depth / 2 - 0.08;
  const step = 0.36;
  for (let x = -halfX; x <= halfX; x += step) {
    group.add(createBeamBetween(
      new THREE.Vector3(x, 0, -halfZ),
      new THREE.Vector3(x, 0, halfZ),
      0.016,
      0x5f8fbd,
      6,
    ));
  }
  return group;
}

function createFileCard(name) {
  const group = new THREE.Group();
  const page = createOutlinedBox(new THREE.Vector3(0.46, 0.62, 0.055), 0x14243a, PALETTE.blueHigh);
  page.position.y = 0.31;
  const fold = createBeamBetween(
    new THREE.Vector3(0.08, 0.58, 0.038),
    new THREE.Vector3(0.2, 0.46, 0.038),
    0.016,
    PALETTE.blueHigh,
    6,
  );
  const label = createLabel(name, PALETTE.ink, 0.82, 44);
  label.position.set(0, -0.09, 0.07);
  group.add(page, fold, label);
  group.rotation.y = Math.PI / 4;
  return group;
}

function createProduction() {
  const group = new THREE.Group();

  const workpiece = new THREE.Group();
  const body = createOutlinedBox(new THREE.Vector3(1.06, 0.86, 0.94), 0x17263a, PALETTE.blueHigh);
  body.position.y = 0.43;
  const status = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 10, 6),
    new THREE.MeshBasicMaterial({ color: PALETTE.green }),
  );
  status.position.set(0, 0.96, 0);
  const label = createLabel("PLAYER.RS", PALETTE.ink, 1.28, 60);
  label.position.set(0, 0.48, 0.49);
  const failureLabel = createLabel("FAILED!", PALETTE.red, 1.24, 58);
  failureLabel.position.set(0, 0.5, 0.53);
  failureLabel.renderOrder = 53;
  const compilerSuccess = createCompilerProofToken();
  compilerSuccess.position.set(0.58, 1.96, 0.24);
  const evidenceSeals = ["#", "C", "R"].map((copy, index) => {
    const seal = createEvidenceSeal(copy);
    const screenOffset = (index - 1) * 0.58;
    seal.position.set(screenOffset, 0.16, 0.54 - screenOffset);
    return seal;
  });
  const testReport = createTestReport();
  testReport.position.set(0.26, 1.31, 0.42);
  workpiece.add(
    body,
    status,
    label,
    failureLabel,
    compilerSuccess,
    ...evidenceSeals,
    testReport,
  );

  const main = createFileCard("main.rs");
  const cargo = createFileCard("Cargo.toml");
  const edits = Array.from({ length: 3 }, () => createFileCard("EDIT"));
  group.add(workpiece, main, cargo, ...edits);
  return {
    group,
    workpiece,
    main,
    cargo,
    edits,
    status,
    label,
    failureLabel,
    compilerSuccess,
    evidenceSeals,
    testReport,
  };
}

function createSignalRoute(curve, color = PALETTE.blue, samples = 30, thickness = 1) {
  const points = curve.getPoints(samples);
  const group = new THREE.Group();
  const routeSegments = [];
  for (let index = 1; index < points.length; index += 1) {
    const segment = new THREE.Group();
    const underlay = createBeamBetween(
      points[index - 1],
      points[index],
      0.03 * thickness,
      PALETTE.lineDark,
      7,
    );
    const dash = createBeamBetween(
      points[index - 1],
      points[index],
      0.045 * thickness,
      color,
      7,
    );
    segment.add(underlay, dash);
    routeSegments.push({ segment, underlay, dash });
    group.add(segment);
  }
  const pulse = new THREE.Mesh(
    new THREE.SphereGeometry(0.09 * thickness, 10, 7),
    new THREE.MeshBasicMaterial({ color }),
  );
  const glow = createGlow(color, 0.84 * thickness, 0.84 * thickness);
  group.add(pulse, glow);
  return { group, curve, routeSegments, pulse, glow };
}

function setRouteProgress(route, amount, time, persistent = false) {
  const value = clamp01(amount);
  route.group.visible = value > 0.001;
  const visibleSegments = Math.ceil(route.routeSegments.length * value);
  const dashOffset = Math.floor(time * 12) % 8;
  route.routeSegments.forEach(({ segment, dash }, index) => {
    const revealed = index < visibleSegments;
    segment.visible = revealed;
    dash.visible = revealed && ((index + dashOffset) % 8 < 3);
  });
  const pulseProgress = persistent && value >= 0.999
    ? ((time * 0.42) % 1 + 1) % 1
    : value;
  const position = route.curve.getPointAt(clamp01(pulseProgress));
  route.pulse.position.copy(position);
  route.glow.position.copy(position);
  route.pulse.visible = value > 0.02;
  route.glow.visible = route.pulse.visible;
}

function setCapabilityKey(key, time, timing, start, end, finalScale = 0.72) {
  const growing = progress(time, timing.start, timing.detach);
  const flying = progress(time, timing.detach, timing.insert);
  const outro = 1 - progress(time, timing.insert + 0.12, timing.end);
  key.visible = time >= timing.start && time < timing.end;
  key.position.lerpVectors(start, end, flying);
  key.position.y += Math.sin(flying * Math.PI) * 0.5;
  const snap = time >= timing.detach && time < timing.detach + 0.2
    ? Math.sin(progress(time, timing.detach, timing.detach + 0.2) * Math.PI)
    : 0;
  key.scale.setScalar(Math.max(0.001, growing * finalScale * (1 + snap * 0.16)));
  key.rotation.y = 0;
  key.rotation.z = THREE.MathUtils.degToRad(
    THREE.MathUtils.lerp(-22, 0, growing) + flying * 58 - Math.sin(flying * Math.PI) * 16,
  );
  setFade(key, growing * outro);
}

function setMovingFile(file, route, time, timing, delay = 0, sizeScale = 1) {
  const start = timing.start + delay;
  const end = timing.end + delay;
  const amount = progress(time, start, end);
  const intro = progress(time, start - 0.2, start + 0.18);
  const absorb = 1 - progress(time, end - 0.34, end);
  file.visible = intro * absorb > 0.001;
  file.position.copy(route.getPointAt(amount));
  file.position.y += 0.12 + Math.sin(amount * Math.PI) * 0.28;
  file.scale.setScalar(Math.max(0.001, (0.55 + absorb * 0.45) * intro * sizeScale));
  setFade(file, intro * absorb);
}

export function createFoundationWorld() {
  const group = new THREE.Group();
  group.name = "film-foundation-world";

  const kernel = createDeck({
    width: KERNEL_FOOTPRINT.compact.width,
    depth: KERNEL_FOOTPRINT.compact.depth,
    height: FOUNDATION_LAYER_HEIGHT,
    color: 0x05080d, edgeColor: 0x343b45, label: "RUST-KERNEL", labelColor: 0xeaf4ff,
  });
  const kernelFacets = createSlabFacets(
    KERNEL_FOOTPRINT.compact.width,
    KERNEL_FOOTPRINT.compact.depth,
    FOUNDATION_LAYER_HEIGHT,
  );
  kernel.body.add(kernelFacets);
  place(kernel.group, FOUNDATION_LAYOUT.kernel);
  const kernelOutline = createFootprintOutline(
    KERNEL_FOOTPRINT.compact.width,
    KERNEL_FOOTPRINT.compact.depth,
    PALETTE.blueHigh,
  );
  kernel.group.add(kernelOutline.group);
  const kernelCallout = createLayerCallout({
    title: "RUST-KERNEL",
    copy: "OWNS CPU · RAM · USB · DISPLAY · NET",
    color: PALETTE.blueHigh,
    width: 5.4,
  });
  const kernelCalloutAnchor = new THREE.Vector3(
    0,
    0,
    KERNEL_FOOTPRINT.compact.depth * 0.5 + 0.04,
  );
  const genesis = createDeck({
    width: GENESIS_FOOTPRINT.width,
    depth: GENESIS_FOOTPRINT.depth,
    height: FOUNDATION_LAYER_HEIGHT,
    color: PALETTE.panel, edgeColor: 0x587b9e, label: "GENESIS DECK", labelColor: PALETTE.ink,
  });
  place(genesis.group, FOUNDATION_LAYOUT.genesisCompact);
  const genesisOutline = createFootprintOutline(
    GENESIS_FOOTPRINT.width,
    GENESIS_FOOTPRINT.depth,
    PALETTE.greenHigh,
  );
  genesis.group.add(genesisOutline.group);
  const genesisCallout = createLayerCallout({
    title: "GENESIS DECK",
    copy: "BUILDS ABOVE KERNEL · GRANTS DOORS",
    color: PALETTE.green,
    width: 5.55,
  });
  const genesisCalloutAnchor = new THREE.Vector3(
    0,
    0,
    GENESIS_FOOTPRINT.depth * 0.5 + 0.04,
  );

  const agent = createAgent();
  place(agent.group, FOUNDATION_LAYOUT.agentCompact);
  // Compensates for the authored Foundation-set scale so the Agent retains
  // the original block-to-deck ratio while the two decks fill the frame.
  const agentScale = 1.24;
  agent.group.scale.setScalar(agentScale);
  const keyForge = createKeyForge();
  place(keyForge.group, FOUNDATION_LAYOUT.keyForge);
  keyForge.group.scale.setScalar(1.5);
  const internet = createDoorAndKey("net.https");
  anchorFoundationDoor(internet, FOUNDATION_LAYOUT.netDoor);
  internet.group.scale.setScalar(FOUNDATION_DOOR_SCALE);
  const internetPosition = internet.group.position;
  const netTower = createNetTower();
  place(netTower.group, FOUNDATION_LAYOUT.netTower);
  netTower.group.scale.setScalar(1.18);
  const agentToDoor = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.55, 1.74 + DECK_HEIGHT_DELTA, 1.18),
    new THREE.Vector3(0.38, 1.2, 1.42),
    new THREE.Vector3(0.2, DECK_ROUTE_Y, 2.05),
    new THREE.Vector3(internetPosition.x, DECK_ROUTE_Y, internetPosition.z),
  ], false, "centripetal"));
  const doorToNet = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(internetPosition.x, DECK_ROUTE_Y, internetPosition.z),
    new THREE.Vector3(3.2, 1.2, 2.55),
    new THREE.Vector3(6.6, 0.78, 1.85),
    new THREE.Vector3(8.65, 0.58, 2.3),
  ], false, "centripetal"));
  const forgeToDoor = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.52, 2.17 + DECK_HEIGHT_DELTA, -1.12),
    new THREE.Vector3(1.12, 1.86, 0.02),
    new THREE.Vector3(0.3, 1.95, 1.4),
    new THREE.Vector3(internetPosition.x, DECK_KEY_ROUTE_Y, internetPosition.z),
  ], false, "centripetal"), PALETTE.green, 30, 0.45);

  const builder = createDeck({
    width: BUILDER_FOOTPRINT.width,
    depth: BUILDER_FOOTPRINT.depth,
    height: FOUNDATION_LAYER_HEIGHT,
    color: 0x111c2b, edgeColor: PALETTE.blueHigh, label: "BUILDER DECK", labelColor: PALETTE.ink,
  });
  place(builder.group, FOUNDATION_LAYOUT.builder);
  const builderHatch = createBuilderHatch(BUILDER_FOOTPRINT.width, BUILDER_FOOTPRINT.depth);
  builderHatch.position.y = builder.height + 0.025;
  builder.group.add(builderHatch);
  const builderCallout = createLayerCallout({
    title: "BUILDER DECK",
    copy: "OFFLINE TOOLS \u00b7 SEALED EGRESS",
    color: PALETTE.blueHigh,
    width: 5.65,
  });
  const builderCalloutAnchor = new THREE.Vector3(
    0,
    0,
    BUILDER_FOOTPRINT.depth * 0.5 + 0.04,
  );

  const production = createProduction();
  place(production.group, FOUNDATION_LAYOUT.production);
  production.group.remove(production.main, production.cargo);
  production.edits.forEach((edit) => production.group.remove(edit));
  const failureDecal = createFloorDecal("FAILED!", PALETTE.red);
  failureDecal.position.set(
    FOUNDATION_LAYOUT.production[0] - 0.2,
    FOUNDATION_LAYOUT.production[1] + 0.025,
    FOUNDATION_LAYOUT.production[2] + 0.2,
  );
  const genesisFailureDecal = createFloorDecal("FAILED!", PALETTE.red, 2.2, 0.72);
  genesisFailureDecal.position.set(0.473, 1.085 + DECK_HEIGHT_DELTA, -1.651);
  group.add(failureDecal, genesisFailureDecal);
  const buildDoor = createDoorAndKey("build.request", { keyTagText: "REQUEST" });
  anchorFoundationDoor(buildDoor, FOUNDATION_LAYOUT.buildDoor);
  buildDoor.group.scale.setScalar(FOUNDATION_DOOR_SCALE);
  const sysrootDoor = createDoorAndKey("/sysroot", { positiveSlope: true, keyTagText: "READ" });
  anchorFoundationDoor(sysrootDoor, FOUNDATION_LAYOUT.sysrootDoor);
  sysrootDoor.group.scale.setScalar(FOUNDATION_DOOR_SCALE);
  const srcDoor = createDoorAndKey("/src", { positiveSlope: true, keyTagText: "READ/WRITE" });
  anchorFoundationDoor(srcDoor, FOUNDATION_LAYOUT.srcDoor);
  srcDoor.group.scale.setScalar(FOUNDATION_DOOR_SCALE);
  const outDoor = createDoorAndKey("/out", {
    edgeColor: 0xf06962,
    labelColor: PALETTE.muted,
    keyTagText: "EGRESS",
  });
  anchorFoundationDoor(outDoor, FOUNDATION_LAYOUT.outDoor);
  outDoor.group.scale.setScalar(FOUNDATION_DOOR_SCALE);
  const buildDoorPosition = buildDoor.group.position;
  const sysrootDoorPosition = sysrootDoor.group.position;
  const srcDoorPosition = srcDoor.group.position;

  const buildKey = buildDoor.key;
  const sysrootKey = sysrootDoor.key;
  const srcKey = srcDoor.key;
  buildDoor.group.remove(buildKey);
  sysrootDoor.group.remove(sysrootKey);
  srcDoor.group.remove(srcKey);
  outDoor.key.visible = false;

  const buildLine = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.537, DECK_ROUTE_Y, 1.862),
    new THREE.Vector3(1.05, DECK_ROUTE_Y, 1.35),
    new THREE.Vector3(1.42, DECK_ROUTE_Y, 0.72),
    new THREE.Vector3(buildDoorPosition.x, DECK_ROUTE_Y, buildDoorPosition.z),
  ], false, "centripetal"), PALETTE.blueHigh);
  const requestToSysroot = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(buildDoorPosition.x, DECK_ROUTE_Y, buildDoorPosition.z),
    new THREE.Vector3(2.55, DECK_ROUTE_Y, -1.15),
    new THREE.Vector3(3.55, DECK_ROUTE_Y, -3.65),
    new THREE.Vector3(sysrootDoorPosition.x, DECK_ROUTE_Y, sysrootDoorPosition.z),
  ], false, "centripetal"), PALETTE.blueHigh);
  const sysrootToSrc = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(sysrootDoorPosition.x, DECK_ROUTE_Y, sysrootDoorPosition.z),
    new THREE.Vector3(5.4, DECK_ROUTE_Y, -5.8),
    new THREE.Vector3(6.35, DECK_ROUTE_Y, -5.8),
    new THREE.Vector3(srcDoorPosition.x, DECK_ROUTE_Y, srcDoorPosition.z),
  ], false, "centripetal"), PALETTE.blueHigh);
  const srcToWorkpiece = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(srcDoorPosition.x, DECK_ROUTE_Y, srcDoorPosition.z),
    new THREE.Vector3(7.0, DECK_ROUTE_Y, -6.55),
    new THREE.Vector3(6.82, DECK_ROUTE_Y, -7.75),
    new THREE.Vector3(
      FOUNDATION_LAYOUT.production[0],
      DECK_ROUTE_Y,
      FOUNDATION_LAYOUT.production[2],
    ),
  ], false, "centripetal"), PALETTE.blueHigh);
  const materialPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.537, DECK_ROUTE_Y + 0.1, 1.862),
    new THREE.Vector3(buildDoorPosition.x, DECK_ROUTE_Y + 0.1, buildDoorPosition.z),
    new THREE.Vector3(sysrootDoorPosition.x, DECK_ROUTE_Y + 0.1, sysrootDoorPosition.z),
    new THREE.Vector3(srcDoorPosition.x, DECK_ROUTE_Y + 0.1, srcDoorPosition.z),
    new THREE.Vector3(
      FOUNDATION_LAYOUT.production[0],
      DECK_ROUTE_Y + 0.1,
      FOUNDATION_LAYOUT.production[2],
    ),
  ], false, "centripetal");
  const forgeToBuild = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.52, 2.17 + DECK_HEIGHT_DELTA, -1.12),
    new THREE.Vector3(1.38, 2.25, -0.82),
    new THREE.Vector3(buildDoorPosition.x, DECK_KEY_ROUTE_Y, buildDoorPosition.z),
  ], false, "centripetal"), PALETTE.green, 22, 0.45);
  const forgeToSysroot = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.52, 2.17 + DECK_HEIGHT_DELTA, -1.12),
    new THREE.Vector3(1.45, 2.42, -3.28),
    new THREE.Vector3(sysrootDoorPosition.x, DECK_KEY_ROUTE_Y, sysrootDoorPosition.z),
  ], false, "centripetal"), PALETTE.green, 28, 0.45);
  const forgeToSrc = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.52, 2.17 + DECK_HEIGHT_DELTA, -1.12),
    new THREE.Vector3(2.35, 2.38, -3.25),
    new THREE.Vector3(srcDoorPosition.x, DECK_KEY_ROUTE_Y, srcDoorPosition.z),
  ], false, "centripetal"), PALETTE.green, 32, 0.45);

  const sourceCaption = createWideLabel(
    "SOURCE FILES \u00b7 AGENT \u2192 /sysroot \u2192 /src",
    PALETTE.muted,
    5.15,
    42,
  );
  sourceCaption.position.set(2.259, 2.7 + DECK_HEIGHT_DELTA, -7.959);
  const hashCaption = createWideLabel(
    "HASHED \u00b7 CONTENT-ADDRESSED \u00b7 IMMUTABLE",
    PALETTE.muted,
    4.7,
    38,
  );
  hashCaption.position.set(2.259, 2.35 + DECK_HEIGHT_DELTA, -7.959);
  const shadowTitle = createWideLabel(
    "SHADOW WORLD \u00b7 DISPOSABLE \u00b7 ZERO LIVE EFFECT",
    0xc9b6dc,
    6.3,
    46,
  );
  shadowTitle.position.set(3.845, 2.1 + DECK_HEIGHT_DELTA, -1.272);

  group.add(
    kernel.group,
    kernelCallout.group,
    genesis.group,
    genesisCallout.group,
    agent.group,
    keyForge.group,
    internet.group,
    netTower.group,
    agentToDoor.group,
    doorToNet.group,
    forgeToDoor.group,
    builder.group,
    builderCallout.group,
    buildDoor.group,
    sysrootDoor.group,
    srcDoor.group,
    outDoor.group,
    buildKey,
    sysrootKey,
    srcKey,
    production.group,
    production.main,
    production.cargo,
    ...production.edits,
    buildLine.group,
    requestToSysroot.group,
    sysrootToSrc.group,
    srcToWorkpiece.group,
    forgeToBuild.group,
    forgeToSysroot.group,
    forgeToSrc.group,
    sourceCaption,
    hashCaption,
    shadowTitle,
  );

  function setTime(rawTime, camera) {
    const time = Math.min(120, Math.max(0, Number(rawTime) || 0));
    const kernelOutlineDraw = timedProgress(time, FOUNDATION_TIMELINE.kernelOutline);
    const kernelRise = timedProgress(time, FOUNDATION_TIMELINE.kernelRise);
    setDeckRise(kernel, kernelRise);
    const kernelSolidVisible = kernelRise > 0.001;
    kernel.body.visible = kernelSolidVisible;
    kernel.top.visible = kernelSolidVisible;
    kernel.grid.visible = kernelSolidVisible;
    kernel.underglow.visible = kernelSolidVisible;
    kernel.group.visible = kernelOutlineDraw > 0.001 || kernelSolidVisible;
    setFootprintOutline(
      kernelOutline,
      kernelOutlineDraw,
      1 - progress(time, FOUNDATION_TIMELINE.kernelRise.start, 5.13),
    );
    setOpacity(kernel.title, progress(time, 8.06, 8.28));
    const foundationExpansion = timedProgress(time, FOUNDATION_TIMELINE.worldExpansion);
    if (group.userData.presentationBaseX === undefined) {
      group.userData.presentationBaseX = group.position.x;
    }
    if (group.userData.presentationBaseZ === undefined) {
      group.userData.presentationBaseZ = group.position.z;
    }
    const compactComposition = progress(time, 106, 109);
    const finaleComposition = progress(time, 109, 117);
    group.position.x = group.userData.presentationBaseX
      + FOUNDATION_LAYOUT.expansionOffset[0] * foundationExpansion
      + 1.76 * compactComposition + 4.1 * finaleComposition;
    group.position.z = group.userData.presentationBaseZ
      + FOUNDATION_LAYOUT.expansionOffset[2] * foundationExpansion
      + 3.45 * compactComposition + 4.1 * finaleComposition;
    const kernelSquareExpansion = timedProgress(
      time,
      FOUNDATION_TIMELINE.kernelSquareExpansion,
    );
    const kernelFinalExpansion = progress(time, 106, 109);
    const kernelScaleX = THREE.MathUtils.lerp(
      1,
      THREE.MathUtils.lerp(
        KERNEL_FOOTPRINT.expanded.width,
        18.3,
        kernelFinalExpansion,
      ) / KERNEL_FOOTPRINT.compact.width,
      foundationExpansion,
    );
    const squareDepth = THREE.MathUtils.lerp(
      KERNEL_FOOTPRINT.expanded.depth,
      KERNEL_FOOTPRINT.square.depth,
      kernelSquareExpansion,
    );
    const kernelScaleZ = THREE.MathUtils.lerp(
      1,
      THREE.MathUtils.lerp(squareDepth, 18.3, kernelFinalExpansion)
        / KERNEL_FOOTPRINT.compact.depth,
      foundationExpansion,
    );
    const foundationScaleX = Math.max(0.0001, Math.abs(group.scale.x));
    const foundationScaleZ = Math.max(0.0001, Math.abs(group.scale.z));
    kernel.group.position.set(
      FOUNDATION_LAYOUT.kernel[0]
        + KERNEL_FOOTPRINT.compact.width * (kernelScaleX - 1) * 0.5
        - FOUNDATION_LAYOUT.expansionOffset[0] * foundationExpansion / foundationScaleX,
      FOUNDATION_LAYOUT.kernel[1],
      FOUNDATION_LAYOUT.kernel[2]
        - KERNEL_FOOTPRINT.compact.depth * (kernelScaleZ - 1) * 0.5
        - FOUNDATION_LAYOUT.expansionOffset[2] * foundationExpansion / foundationScaleZ,
    );
    setDeckFootprint(kernel, kernelScaleX, kernelScaleZ);
    kernel.title.position.x = -KERNEL_FOOTPRINT.compact.width * (kernelScaleX - 1) * 0.5;
    setLayerCallout(kernelCallout, time, {
      start: 6.24,
      introEnd: 7.04,
      titleStart: 7.28,
      end: 8.28,
      root: group,
      camera,
      targetObject: kernel.body,
      targetLocalPoint: kernelCalloutAnchor,
      angle: -THREE.MathUtils.degToRad(26.565),
    });
    const compactGenesisWidth = KERNEL_FOOTPRINT.compact.width * (510 / 630);
    const compactGenesisDepth = KERNEL_FOOTPRINT.compact.depth * (510 / 630);
    setDeckFootprint(
      genesis,
      THREE.MathUtils.lerp(compactGenesisWidth / GENESIS_FOOTPRINT.width, 1, foundationExpansion),
      THREE.MathUtils.lerp(compactGenesisDepth / GENESIS_FOOTPRINT.depth, 1, foundationExpansion),
    );
    const genesisOutlineDraw = timedProgress(time, FOUNDATION_TIMELINE.genesisOutline);
    const genesisRise = timedProgress(time, FOUNDATION_TIMELINE.genesisRise);
    genesis.group.position.set(
      FOUNDATION_LAYOUT.genesisCompact[0]
        - FOUNDATION_LAYOUT.expansionOffset[0] * foundationExpansion / foundationScaleX,
      FOUNDATION_LAYOUT.genesisCompact[1],
      FOUNDATION_LAYOUT.genesisCompact[2]
        - FOUNDATION_LAYOUT.expansionOffset[2] * foundationExpansion / foundationScaleZ,
    );
    setDeckRise(genesis, genesisRise);
    const genesisSolidVisible = genesisRise > 0.001;
    genesis.body.visible = genesisSolidVisible;
    genesis.top.visible = genesisSolidVisible;
    genesis.grid.visible = genesisSolidVisible;
    genesis.underglow.visible = genesisSolidVisible;
    genesis.group.visible = genesisOutlineDraw > 0.001 || genesisSolidVisible;
    setFootprintOutline(
      genesisOutline,
      genesisOutlineDraw,
      1 - progress(time, FOUNDATION_TIMELINE.genesisRise.start, 9.52),
    );
    setOpacity(genesis.title, progress(time, 12.8, 13.02));
    setLayerCallout(genesisCallout, time, {
      start: 10.68,
      introEnd: 11.48,
      titleStart: 12.02,
      end: 13.02,
      root: group,
      camera,
      targetObject: genesis.body,
      targetLocalPoint: genesisCalloutAnchor,
      angle: -THREE.MathUtils.degToRad(26.565),
    });

    const legacyWorldAlpha = 1 - progress(time, 106, 108.7);
    const agentOutlineDraw = timedProgress(time, FOUNDATION_TIMELINE.agentOutline);
    const agentRise = timedProgress(time, FOUNDATION_TIMELINE.agentRise);
    agent.group.position.set(
      FOUNDATION_LAYOUT.agentCompact[0]
        - FOUNDATION_LAYOUT.expansionOffset[0] * foundationExpansion / foundationScaleX,
      FOUNDATION_LAYOUT.agentCompact[1],
      FOUNDATION_LAYOUT.agentCompact[2]
        - FOUNDATION_LAYOUT.expansionOffset[2] * foundationExpansion / foundationScaleZ,
    );
    agent.group.visible = (agentOutlineDraw > 0.001 || agentRise > 0.001)
      && legacyWorldAlpha > 0.001;
    agent.solid.scale.y = Math.max(0.001, agentRise);
    setFade(agent.solid, agentRise * legacyWorldAlpha);
    setFootprintOutline(
      agent.outline,
      agentOutlineDraw,
      legacyWorldAlpha * (1 - progress(time, FOUNDATION_TIMELINE.agentRise.start, 14.02)),
    );

    const netOutlineDraw = timedProgress(time, FOUNDATION_TIMELINE.netOutline);
    const netHatchOpen = timedProgress(time, FOUNDATION_TIMELINE.netHatch);
    const netRise = timedProgress(time, FOUNDATION_TIMELINE.netRise);
    netTower.group.visible = (netOutlineDraw > 0.001 || netHatchOpen > 0.001 || netRise > 0.001)
      && legacyWorldAlpha > 0.001;
    netTower.group.position.y = FOUNDATION_LAYOUT.netTower[1];
    netTower.group.scale.setScalar(1.18);
    setSlidingFloorHatch(
      netTower.hatch,
      netOutlineDraw,
      netHatchOpen,
      legacyWorldAlpha,
    );
    netTower.tower.visible = netRise > 0.001;
    netTower.tower.position.y = THREE.MathUtils.lerp(-1.72, 0, netRise);
    setFade(
      netTower.tower,
      progress(time, FOUNDATION_TIMELINE.netRise.start, FOUNDATION_TIMELINE.netRise.start + 0.16)
        * legacyWorldAlpha,
    );
    netTower.rings.forEach((ring, index) => {
      const cycle = ((time - FOUNDATION_TIMELINE.netRise.end - index * 1.2) % 3.6 + 3.6) % 3.6 / 3.6;
      ring.scale.setScalar(0.4 + cycle * 2.5);
      ring.material.opacity = time < FOUNDATION_TIMELINE.netRise.end
        ? 0
        : (1 - cycle) * 0.72 * legacyWorldAlpha;
    });
    netTower.signal.rotation.z = time * 0.26;
    netTower.beacon.scale.setScalar(0.8 + Math.sin(time * 4) * 0.18);

    const lineDraw = timedProgress(time, FOUNDATION_TIMELINE.agentRoute);
    setRouteProgress(agentToDoor, lineDraw, time, time >= FOUNDATION_TIMELINE.networkConnectedAt);
    const networkWindowAlpha = legacyWorldAlpha;
    setFade(agentToDoor.group, lineDraw * networkWindowAlpha);

    setEmergingDoor(
      internet,
      time,
      FOUNDATION_TIMELINE.netDoorRise,
      networkWindowAlpha,
    );
    setVectorDoorOpen(internet, progress(
      time,
      FOUNDATION_TIMELINE.netKey.insert,
      FOUNDATION_TIMELINE.netKey.insert + 0.9,
    ));
    const forgeRise = timedProgress(time, FOUNDATION_TIMELINE.keyForgeRise);
    keyForge.group.position.y = FOUNDATION_LAYOUT.keyForge[1] - (1 - forgeRise) * 0.42;
    keyForge.group.scale.y = 1.5 * Math.max(0.001, forgeRise);
    const keyGrow = progress(
      time,
      FOUNDATION_TIMELINE.netKey.start,
      FOUNDATION_TIMELINE.netKey.detach,
    );
    const keyFlight = progress(
      time,
      FOUNDATION_TIMELINE.netKey.detach,
      FOUNDATION_TIMELINE.netKey.insert,
    );
    const forgeGrowPulse = time >= FOUNDATION_TIMELINE.netKey.start
      && time < FOUNDATION_TIMELINE.netKey.detach
      ? Math.sin(keyGrow * Math.PI) * 0.48
      : 0;
    const forgeDetachPulse = time >= FOUNDATION_TIMELINE.netKey.detach - 0.06
      && time < FOUNDATION_TIMELINE.netKey.detach + 0.32
      ? Math.sin(progress(
        time,
        FOUNDATION_TIMELINE.netKey.detach - 0.06,
        FOUNDATION_TIMELINE.netKey.detach + 0.32,
      ) * Math.PI)
      : 0;
    const forgePulse = Math.max(forgeGrowPulse, forgeDetachPulse);
    keyForge.core.scale.setScalar(1 + forgePulse * 0.64);
    keyForge.burst.rotation.z = time * 0.6;
    keyForge.burst.scale.setScalar(0.72 + forgePulse * 0.78);
    const keyRouteIntro = progress(
      time,
      FOUNDATION_TIMELINE.netKey.start + 0.12,
      FOUNDATION_TIMELINE.netKey.detach,
    );
    setRouteProgress(forgeToDoor, keyRouteIntro, time);
    setFade(
      forgeToDoor.group,
      keyRouteIntro
        * (1 - progress(
          time,
          FOUNDATION_TIMELINE.netKey.insert - 0.08,
          FOUNDATION_TIMELINE.netKey.insert + 0.18,
        )),
    );
    setFade(keyForge.group, forgeRise * (1 - progress(time, 33.15, 33.45)));
    setFade(keyForge.burst, forgePulse);
    const keyTravel = keyFlight;
    const keyOutro = 1 - progress(
      time,
      FOUNDATION_TIMELINE.netKey.insert + 0.2,
      FOUNDATION_TIMELINE.netKey.insert + 0.52,
    );
    internet.key.visible = time >= FOUNDATION_TIMELINE.netKey.start
      && time < FOUNDATION_TIMELINE.netKey.end;
    internet.key.position.set(
      THREE.MathUtils.lerp(-2.93, 0.45, keyTravel),
      THREE.MathUtils.lerp(1.86, 1.9, keyTravel),
      THREE.MathUtils.lerp(-4.7, -0.35, keyTravel),
    );
    const keySnap = time >= FOUNDATION_TIMELINE.netKey.detach
      && time < FOUNDATION_TIMELINE.netKey.detach + 0.24
      ? Math.sin(progress(
        time,
        FOUNDATION_TIMELINE.netKey.detach,
        FOUNDATION_TIMELINE.netKey.detach + 0.24,
      ) * Math.PI)
      : 0;
    const keyScale = THREE.MathUtils.lerp(0.04, 1, keyGrow) * (1 + keySnap * 0.16);
    internet.key.scale.setScalar(Math.max(0.001, keyScale));
    internet.key.rotation.y = 0;
    internet.key.rotation.z = THREE.MathUtils.degToRad(
      THREE.MathUtils.lerp(-22, 0, keyGrow)
        + keyFlight * 64
        - Math.sin(keyFlight * Math.PI) * 18,
    );
    setFade(internet.key, keyGrow * keyOutro);
    setRouteProgress(
      doorToNet,
      timedProgress(time, FOUNDATION_TIMELINE.netRoute),
      time,
      time >= FOUNDATION_TIMELINE.networkConnectedAt,
    );
    setFade(
      doorToNet.group,
      timedProgress(time, FOUNDATION_TIMELINE.netRoute) * networkWindowAlpha,
    );

    const builderRise = timedProgress(time, FOUNDATION_TIMELINE.builderRise);
    setDeckRise(builder, builderRise);
    builderHatch.position.y = builder.height * builderRise + 0.025;
    const floorOnline = timedProgress(time, FOUNDATION_TIMELINE.builderFloorOnline);
    setFade(builderHatch, builderRise * (1 - floorOnline));
    setOpacity(builder.title, progress(time, 32.68, 32.9));
    setLayerCallout(builderCallout, time, {
      start: 28.25,
      introEnd: 29.05,
      titleStart: 32,
      end: 32.9,
      root: group,
      camera,
      targetObject: builder.body,
      targetLocalPoint: builderCalloutAnchor,
      angle: -THREE.MathUtils.degToRad(26.565),
    });

    const buildDraw = timedProgress(time, FOUNDATION_TIMELINE.buildRequestRoute);
    setRouteProgress(buildLine, buildDraw, time, time >= FOUNDATION_TIMELINE.buildKey.insert);
    const buildRequestWindowAlpha = 1 - progress(time, 94.58, 95.01);
    setFade(buildLine.group, buildDraw * buildRequestWindowAlpha);
    setEmergingDoor(
      buildDoor,
      time,
      FOUNDATION_TIMELINE.buildDoorRise,
      buildRequestWindowAlpha,
    );
    setVectorDoorOpen(buildDoor, progress(
      time,
      FOUNDATION_TIMELINE.buildKey.insert,
      FOUNDATION_TIMELINE.buildKey.insert + 0.9,
    ));

    setEmergingDoor(
      sysrootDoor,
      time,
      FOUNDATION_TIMELINE.sysrootDoorRise,
      1 - progress(time, 93.9, 94.24),
    );
    setEmergingDoor(
      srcDoor,
      time,
      FOUNDATION_TIMELINE.srcDoorRise,
      1 - progress(time, 94.09, 94.43),
    );
    setEmergingDoor(
      outDoor,
      time,
      FOUNDATION_TIMELINE.outDoorRise,
      1 - progress(time, 94.29, 94.62),
    );
    setVectorDoorOpen(sysrootDoor, progress(
      time,
      FOUNDATION_TIMELINE.sysrootKey.insert,
      FOUNDATION_TIMELINE.sysrootKey.insert + 0.9,
    ));
    setVectorDoorOpen(srcDoor, progress(
      time,
      FOUNDATION_TIMELINE.srcKey.insert,
      FOUNDATION_TIMELINE.srcKey.insert + 0.9,
    ));
    setVectorDoorOpen(outDoor, progress(time, 85.25, 86.15));

    setRouteProgress(
      requestToSysroot,
      timedProgress(time, FOUNDATION_TIMELINE.sysrootRoute),
      time,
      time >= FOUNDATION_TIMELINE.sysrootRoute.end,
    );
    setFade(
      requestToSysroot.group,
      timedProgress(time, FOUNDATION_TIMELINE.sysrootRoute)
        * (1 - progress(time, 94.53, 94.87)),
    );
    const srcRouteProgress = timedProgress(time, FOUNDATION_TIMELINE.srcRoute);
    setRouteProgress(sysrootToSrc, srcRouteProgress, time, time >= FOUNDATION_TIMELINE.srcRoute.end);
    setFade(sysrootToSrc.group, srcRouteProgress * (1 - progress(time, 94.38, 94.72)));
    const workpieceRouteProgress = timedProgress(time, FOUNDATION_TIMELINE.workpieceRoute);
    setRouteProgress(
      srcToWorkpiece,
      workpieceRouteProgress,
      time,
      time >= FOUNDATION_TIMELINE.workpieceRoute.end,
    );
    setFade(srcToWorkpiece.group, workpieceRouteProgress * (1 - progress(time, 94.24, 94.58)));

    const keyStart = new THREE.Vector3(0.52, 2.17 + DECK_HEIGHT_DELTA, -1.12);
    setCapabilityKey(
      buildKey,
      time,
      FOUNDATION_TIMELINE.buildKey,
      keyStart,
      new THREE.Vector3(buildDoorPosition.x, DECK_KEY_TARGET_Y, buildDoorPosition.z),
      0.7,
    );
    setCapabilityKey(
      sysrootKey,
      time,
      FOUNDATION_TIMELINE.sysrootKey,
      keyStart,
      new THREE.Vector3(sysrootDoorPosition.x, DECK_KEY_TARGET_Y, sysrootDoorPosition.z),
      0.72,
    );
    setCapabilityKey(
      srcKey,
      time,
      FOUNDATION_TIMELINE.srcKey,
      keyStart,
      new THREE.Vector3(srcDoorPosition.x, DECK_KEY_TARGET_Y, srcDoorPosition.z),
      0.72,
    );
    const setKeyRoute = (route, timing) => {
      const reveal = progress(time, timing.start + 0.08, timing.detach);
      setRouteProgress(route, reveal, time);
      setFade(route.group, reveal * (1 - progress(time, timing.insert - 0.08, timing.insert + 0.18)));
    };
    setKeyRoute(forgeToBuild, FOUNDATION_TIMELINE.buildKey);
    setKeyRoute(forgeToSysroot, FOUNDATION_TIMELINE.sysrootKey);
    setKeyRoute(forgeToSrc, FOUNDATION_TIMELINE.srcKey);
    const keyForgePulse = [
      FOUNDATION_TIMELINE.buildKey,
      FOUNDATION_TIMELINE.sysrootKey,
      FOUNDATION_TIMELINE.srcKey,
    ].reduce((maximum, timing) => {
      const growing = time >= timing.start && time < timing.detach
        ? Math.sin(progress(time, timing.start, timing.detach) * Math.PI)
        : 0;
      const detaching = time >= timing.detach - 0.06 && time < timing.detach + 0.28
        ? Math.sin(progress(time, timing.detach - 0.06, timing.detach + 0.28) * Math.PI)
        : 0;
      return Math.max(maximum, growing, detaching);
    }, 0);
    if (time >= FOUNDATION_TIMELINE.buildKey.start) {
      keyForge.core.scale.setScalar(1 + keyForgePulse * 0.64);
      keyForge.burst.scale.setScalar(0.72 + keyForgePulse * 0.78);
      setFade(keyForge.burst, keyForgePulse);
    }

    const workpieceRise = timedProgress(time, FOUNDATION_TIMELINE.workpieceRise);
    production.workpiece.visible = workpieceRise > 0.001;
    const residentRise = progress(time, 89.2, 92);
    const compactPlayer = progress(time, 106, 109);
    production.workpiece.position.y = -(1 - workpieceRise) * 0.35 + residentRise;
    production.workpiece.scale.setScalar(Math.max(
      0.001,
      THREE.MathUtils.lerp(0.54, 1, workpieceRise)
        * THREE.MathUtils.lerp(1, 0.93, residentRise)
        * THREE.MathUtils.lerp(1, 0.25, compactPlayer),
    ));
    const workpieceFrames = [
      { at: 34, x: 0, z: 0 },
      { at: 41, x: 0, z: 0 },
      { at: 41.85, x: -0.217, z: -0.217 },
      { at: 46.2, x: -0.217, z: -0.217 },
      { at: 49.4, x: 0, z: 0 },
      { at: 52.55, x: 0, z: 0 },
      { at: 53.05, x: -0.217, z: -0.217 },
      { at: 56.05, x: -0.217, z: -0.217 },
      { at: 57.8, x: 0.29, z: -0.145 },
      { at: 60.8, x: 0.29, z: -0.145 },
      { at: 63.85, x: 0, z: 0 },
      { at: 66.95, x: 0, z: 0 },
      { at: 67.3, x: -0.217, z: -0.217 },
      { at: 70, x: -0.217, z: -0.217 },
      { at: 71.2, x: 0.29, z: -0.145 },
      { at: 77.7, x: 0.29, z: -0.145 },
      { at: 79.8, x: 0.072, z: 0.362 },
      { at: 88, x: 0.072, z: 0.362 },
      { at: 89.6, x: -1.816, z: -0.312 },
      { at: 92, x: -6.108, z: 1.912 },
      { at: 106, x: -6.108, z: 1.912 },
      { at: 109, x: -0.574, z: 6.885 },
      { at: 120, x: -0.574, z: 6.885 },
    ];
    const beforeFrame = workpieceFrames.reduce(
      (best, frame) => (frame.at <= time ? frame : best),
      workpieceFrames[0],
    );
    const afterFrame = workpieceFrames.find((frame) => frame.at > time) ?? workpieceFrames.at(-1);
    const workpieceMove = beforeFrame === afterFrame ? 1 : progress(time, beforeFrame.at, afterFrame.at);
    production.workpiece.position.x = THREE.MathUtils.lerp(beforeFrame.x, afterFrame.x, workpieceMove);
    production.workpiece.position.z = THREE.MathUtils.lerp(beforeFrame.z, afterFrame.z, workpieceMove);
    const workpieceCopy = time >= 92
      ? "PLAYER.WASM"
      : time >= 84.55
      ? "PLAYER.WASM · AUTHORIZED"
      : time >= 77.7
        ? "PLAYER.WASM · 3 PROOFS"
        : time >= 71.2
          ? "PLAYER.WASM"
      : time >= 66.95
        ? "FIX 02"
        : time >= 63.85
          ? "APPLYING EDIT 02"
      : time >= 60.8
        ? "FAILED · HARNESS"
        : time >= 55.4
          ? "PLAYER.WASM"
          : time >= 52.55
            ? "FIX 01"
            : time >= 49.4
              ? "APPLYING EDIT 01"
              : "PLAYER.RS";
    const wideWorkpieceCopy = workpieceCopy.includes("APPLYING")
      || workpieceCopy.includes("FAILED")
      || workpieceCopy.includes("PROOFS")
      || workpieceCopy.includes("AUTHORIZED");
    production.label.userData.setText?.(workpieceCopy);
    production.label.scale.set(wideWorkpieceCopy ? 2.1 : 1.28, wideWorkpieceCopy ? 0.39 : 0.32, 1);
    production.status.scale.setScalar(0.82 + Math.sin(time * 3.6) * 0.14);
    const proofDelivery = [
      { start: 55.4, attach: 55.72, handoff: 57.8, end: 58.55 },
      { start: 69.35, attach: 69.67, handoff: 71.2, end: 71.95 },
    ].find((delivery) => time >= delivery.start && time < delivery.end);
    const successPop = proofDelivery ? progress(time, proofDelivery.start, proofDelivery.attach) : 0;
    const successHandoff = proofDelivery ? progress(time, proofDelivery.handoff, proofDelivery.end) : 0;
    const successOpacity = proofDelivery
      ? successPop * (1 - progress(successHandoff, 0.72, 1))
      : 0;
    production.compilerSuccess.position.set(
      THREE.MathUtils.lerp(0.58, 0.12, successHandoff),
      1.96 + Math.sin(successHandoff * Math.PI) * 0.28,
      THREE.MathUtils.lerp(0.24, -1.55, successHandoff),
    );
    production.compilerSuccess.scale.setScalar(
      Math.max(0.001, 0.76 * successPop * THREE.MathUtils.lerp(1, 0.12, successHandoff)),
    );
    setFade(production.compilerSuccess, successOpacity);
    const evidenceAlpha = [
      time >= 74 ? progress(time, 74, 74.5) : 0,
      time >= 75.6 ? progress(time, 75.6, 76.1) : 0,
      time >= 77.7 ? progress(time, 78, 78.5) : 0,
    ];
    production.evidenceSeals.forEach((seal, index) => {
      const alpha = evidenceAlpha[index];
      seal.scale.setScalar(Math.max(0.001, 0.75 * alpha));
      setFade(seal, alpha);
    });
    const reportAlpha = time >= 77.7
      ? progress(time, 77.55, 77.85) * (1 - progress(time, 84.85, 85.15))
      : 0;
    production.testReport.scale.set(
      Math.max(0.001, 0.48 * reportAlpha),
      Math.max(0.001, 0.58 * reportAlpha),
      1,
    );
    setFade(production.testReport, reportAlpha);
    setMovingFile(production.main, materialPath, time, FOUNDATION_TIMELINE.materialMain);
    setMovingFile(production.cargo, materialPath, time, FOUNDATION_TIMELINE.materialCargo);
    const activeEditTiming = time < 60 ? FOUNDATION_TIMELINE.editOne : FOUNDATION_TIMELINE.editTwo;
    production.edits.forEach((edit, index) => {
      setMovingFile(edit, materialPath, time, activeEditTiming[index], 0, time < 60 ? 1.25 : 0.88);
    });
    const failureActive = time >= 46 && time < 52.55;
    production.failureLabel.visible = failureActive;
    failureDecal.visible = failureActive;
    const failurePunch = progress(time, 46, 46.15);
    failureDecal.scale.setScalar(failureActive ? THREE.MathUtils.lerp(1.15, 1, failurePunch) : 0.001);
    setFade(failureDecal, failureActive ? 1 : 0);
    const genesisFailureActive = time >= 46 && time < 49.55;
    const genesisConsume = progress(time, 48.15, 49.55);
    genesisFailureDecal.visible = genesisFailureActive;
    genesisFailureDecal.position.set(
      THREE.MathUtils.lerp(0.473, -2.332, genesisConsume),
      1.085 + DECK_HEIGHT_DELTA + Math.sin(genesisConsume * Math.PI) * 0.3,
      THREE.MathUtils.lerp(-1.651, -1.016, genesisConsume),
    );
    genesisFailureDecal.scale.setScalar(
      genesisFailureActive ? THREE.MathUtils.lerp(1.15, 0.06, genesisConsume) : 0.001,
    );
    setFade(genesisFailureDecal, genesisFailureActive ? 1 - progress(time, 49.21, 49.55) : 0);
    const sourceCaptionAlpha = progress(time, 33, 33.5) * (1 - progress(time, 39.8, 40.25));
    setFade(sourceCaption, sourceCaptionAlpha);
    setFade(hashCaption, sourceCaptionAlpha);
    setFade(
      shadowTitle,
      progress(time, 33.4, 33.9) * (1 - progress(time, 88, 88.5)),
    );
    const builderRelease = progress(time, 94.62, 95.8);
    builder.group.position.y = FOUNDATION_LAYOUT.builder[1] - builderRelease * 0.58;
    setFade(builder.group, builderRise * (1 - builderRelease));
    return time;
  }

  function dispose() {
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    group.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      objectMaterials.filter(Boolean).forEach((material) => {
        materials.add(material);
        if (material.map) textures.add(material.map);
      });
      if (object.userData.labelTexture) textures.add(object.userData.labelTexture);
    });
    textures.forEach((texture) => texture.dispose());
    materials.forEach((material) => material.dispose());
    geometries.forEach((geometry) => geometry.dispose());
    group.clear();
  }

  setTime(0);
  return { group, setTime, dispose };
}
