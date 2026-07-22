import * as THREE from "three";
import {
  FOUNDATION_LAYOUT,
  FOUNDATION_TIMELINE,
  GENESIS_FOOTPRINT,
  KERNEL_FOOTPRINT,
} from "./foundation-config.js";

const PALETTE = Object.freeze({
  ink: 0xf1f7ff,
  muted: 0x8ea2b9,
  blue: 0x4c91d9,
  blueHigh: 0x8bc5ff,
  green: 0x64c991,
  greenHigh: 0xbaf3cf,
  amber: 0xf6c769,
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
  context.strokeText(text, canvas.width / 2, canvas.height / 2, 920);
  context.fillText(text, canvas.width / 2, canvas.height / 2, 920);
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

function createDeck({ width, depth, height, color, edgeColor, label }) {
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
    const titleDecal = createDeckLabel(label, edgeColor, titleWidth, height);
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

function createPrompt() {
  const group = new THREE.Group();
  const panel = createOutlinedBox(new THREE.Vector3(7.5, 0.12, 1.3), PALETTE.dark, PALETTE.blue);
  panel.rotation.x = -Math.PI / 2;
  const label = createLabel("> BUILD ME A MUSIC PLAYER", PALETTE.ink, 6.8, 60);
  label.position.set(0, 0.09, 0);
  label.material.depthTest = false;
  const cursor = createOutlinedBox(new THREE.Vector3(0.055, 0.58, 0.04), PALETTE.blueHigh, PALETTE.blueHigh);
  cursor.position.set(-3.22, 0, 0.08);
  group.add(panel, label, cursor);
  group.position.set(0, 4.2, 0);
  return { group, cursor };
}

function createAgent() {
  const group = new THREE.Group();
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
  group.add(shadow, body, topInset, status, statusGlow, kerbs, label);
  return group;
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
    new THREE.MeshBasicMaterial({ color: PALETTE.greenHigh }),
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
  const socket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.48, 0.055, 4),
    new THREE.MeshBasicMaterial({ color: 0x0c1724 }),
  );
  socket.position.y = 0.028;
  const socketOutline = new THREE.Group();
  const socketCorners = [
    new THREE.Vector3(-0.48, 0.062, 0),
    new THREE.Vector3(0, 0.062, -0.48),
    new THREE.Vector3(0.48, 0.062, 0),
    new THREE.Vector3(0, 0.062, 0.48),
  ];
  socketCorners.forEach((corner, index) => {
    socketOutline.add(createBeamBetween(
      corner,
      socketCorners[(index + 1) % socketCorners.length],
      0.018,
      PALETTE.blue,
      6,
    ));
  });

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
    group.add(ring);
    return ring;
  });
  const label = createLabel("NET", PALETTE.ink, 1.45, 72);
  label.position.set(0, 0.14, 0.62);
  group.add(socket, socketOutline, mast, signal, beacon, glow, label);
  return { group, rings, signal, beacon, glow };
}

function createDoorAndKey(labelText = "net.https") {
  const group = new THREE.Group();
  const frame = new THREE.Group();
  const socket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.78, 0.78, 0.08, 4),
    new THREE.MeshBasicMaterial({ color: PALETTE.panelHigh }),
  );
  socket.position.y = 0.04;
  const socketEdges = new THREE.Group();
  const socketCorners = [
    new THREE.Vector3(-0.78, 0.09, 0),
    new THREE.Vector3(0, 0.09, -0.78),
    new THREE.Vector3(0.78, 0.09, 0),
    new THREE.Vector3(0, 0.09, 0.78),
  ];
  socketCorners.forEach((corner, index) => {
    socketEdges.add(createBeamBetween(
      corner,
      socketCorners[(index + 1) % socketCorners.length],
      0.022,
      PALETTE.blueHigh,
      6,
    ));
  });
  const frameMaterial = new THREE.MeshBasicMaterial({ color: PALETTE.blueHigh });
  const verticalGeometry = new THREE.BoxGeometry(0.12, 1.55, 0.16);
  const lintelGeometry = new THREE.BoxGeometry(1.18, 0.12, 0.16);
  const left = new THREE.Mesh(verticalGeometry, frameMaterial);
  const right = new THREE.Mesh(verticalGeometry, frameMaterial);
  const lintel = new THREE.Mesh(lintelGeometry, frameMaterial);
  const threshold = new THREE.Mesh(
    new THREE.BoxGeometry(1.18, 0.075, 0.18),
    new THREE.MeshBasicMaterial({ color: 0xb6d9ff }),
  );
  left.position.set(-0.53, 0.775, 0);
  right.position.set(0.53, 0.775, 0);
  lintel.position.set(0, 1.49, 0);
  threshold.position.set(0, 0.1, 0);
  const doorVoid = new THREE.Mesh(
    new THREE.PlaneGeometry(0.94, 1.36),
    new THREE.MeshBasicMaterial({ color: 0x04080e, transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
  );
  doorVoid.position.set(0, 0.78, -0.055);
  const leafPivot = new THREE.Group();
  leafPivot.position.set(-0.47, 0.75, 0);
  const leaf = createOutlinedBox(new THREE.Vector3(0.92, 1.36, 0.08), PALETTE.panel, PALETTE.blue);
  leaf.position.x = 0.46;
  const inset = createOutlinedBox(new THREE.Vector3(0.68, 0.94, 0.04), 0x0b1420, PALETTE.lineDark);
  inset.position.set(0, 0, 0.062);
  const handle = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 5),
    new THREE.MeshBasicMaterial({ color: PALETTE.amber }),
  );
  handle.position.set(0.33, 0, 0.09);
  leaf.add(inset, handle);
  leafPivot.add(leaf);
  const hinges = new THREE.Group();
  [0.32, 1.16].forEach((height) => {
    const hinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8),
      new THREE.MeshBasicMaterial({ color: PALETTE.amber }),
    );
    hinge.position.set(-0.55, height, 0.1);
    hinges.add(hinge);
  });
  frame.add(socket, socketEdges, doorVoid, left, right, lintel, threshold, leafPivot, hinges);
  const label = createLabel(labelText, PALETTE.amber, 1.05, 68);
  label.position.set(0, 0.12, 0.86);
  label.material.depthTest = false;
  frame.add(label);

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
  const keyTag = createLabel("CAP: NET.HTTPS", PALETTE.amber, 1.65, 40);
  keyTag.position.set(0.32, 0.38, 0);
  key.add(keyTag);
  key.position.set(-1.85, 0.74, -2.25);
  group.add(frame, key);
  return { group, frame, leafPivot, key };
}

function createSourceAndWorkpiece() {
  const group = new THREE.Group();
  const source = createOutlinedBox(new THREE.Vector3(1.25, 0.72, 1), PALETTE.panelHigh, PALETTE.greenHigh);
  source.position.set(0, 0.36, 0);
  const sourceLabel = createLabel("SOURCE", PALETTE.greenHigh, 1.15, 52);
  sourceLabel.position.set(0, 0.45, 0.516);
  source.add(sourceLabel);

  const workpiece = new THREE.Group();
  const capsule = createOutlinedBox(new THREE.Vector3(1.8, 0.58, 1.06), 0x183253, PALETTE.blueHigh);
  capsule.position.y = 0.29;
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.22, 0),
    new THREE.MeshBasicMaterial({ color: PALETTE.blueHigh }),
  );
  core.position.set(-0.55, 0.62, 0);
  const label = createLabel("WORKPIECE", PALETTE.ink, 1.45, 48);
  label.position.set(0.16, 0.35, 0.546);
  workpiece.add(capsule, core, label);
  workpiece.position.set(2.6, 0, 0);
  group.add(source, workpiece);
  return { group, source, workpiece, core };
}

function createSignalRoute(curve, color = PALETTE.blue, samples = 30) {
  const points = curve.getPoints(samples);
  const group = new THREE.Group();
  const routeSegments = [];
  for (let index = 1; index < points.length; index += 1) {
    const segment = new THREE.Group();
    const underlay = createBeamBetween(
      points[index - 1],
      points[index],
      0.045,
      PALETTE.lineDark,
      7,
    );
    const dash = createBeamBetween(
      points[index - 1],
      points[index],
      0.068,
      color,
      7,
    );
    segment.add(underlay, dash);
    routeSegments.push({ segment, underlay, dash });
    group.add(segment);
  }
  const pulse = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 10, 7),
    new THREE.MeshBasicMaterial({ color }),
  );
  const glow = createGlow(color, 0.84, 0.84);
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

export function createFoundationWorld() {
  const group = new THREE.Group();
  group.name = "film-foundation-world";

  const prompt = createPrompt();
  const kernel = createDeck({
    width: KERNEL_FOOTPRINT.compact.width,
    depth: KERNEL_FOOTPRINT.compact.depth,
    height: 0.72,
    color: 0x05080d, edgeColor: PALETTE.blue, label: "RUST-KERNEL",
  });
  const kernelFacets = createSlabFacets(
    KERNEL_FOOTPRINT.compact.width,
    KERNEL_FOOTPRINT.compact.depth,
    0.72,
  );
  kernel.body.add(kernelFacets);
  place(kernel.group, FOUNDATION_LAYOUT.kernel);
  const genesis = createDeck({
    width: GENESIS_FOOTPRINT.width, depth: GENESIS_FOOTPRINT.depth, height: 0.34,
    color: PALETTE.panel, edgeColor: PALETTE.greenHigh, label: "GENESIS DECK",
  });
  place(genesis.group, FOUNDATION_LAYOUT.genesis);

  const agent = createAgent();
  place(agent, FOUNDATION_LAYOUT.agent);
  // Compensates for the authored Foundation-set scale so the Agent retains
  // the original block-to-deck ratio while the two decks fill the frame.
  const agentScale = 1.24;
  agent.scale.setScalar(agentScale);
  const keyForge = createKeyForge();
  place(keyForge.group, FOUNDATION_LAYOUT.keyForge);
  const internet = createDoorAndKey("net.https");
  place(internet.group, FOUNDATION_LAYOUT.netDoor);
  const netTower = createNetTower();
  place(netTower.group, FOUNDATION_LAYOUT.netTower);
  const agentToDoor = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.05, 1.74, 0.68),
    new THREE.Vector3(0.62, 1.2, 1.04),
    new THREE.Vector3(1.58, 1.13, 1.72),
    new THREE.Vector3(2.48, 1.2, 2.4),
  ], false, "centripetal"));
  const doorToNet = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(2.9, 1.16, 2.52),
    new THREE.Vector3(4.6, 0.88, 2.25),
    new THREE.Vector3(6.6, 0.78, 1.85),
    new THREE.Vector3(8.5, 0.76, 1.5),
  ], false, "centripetal"));
  const forgeToDoor = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.85, 1.8, 0.2),
    new THREE.Vector3(1.22, 1.44, 0.72),
    new THREE.Vector3(1.86, 1.22, 1.5),
    new THREE.Vector3(2.7, 1.78, 2.45),
  ], false, "centripetal"), PALETTE.green);

  const builder = createDeck({
    width: 5.1, depth: 4.25, height: 0.34,
    color: 0x111c2b, edgeColor: PALETTE.blueHigh, label: "BUILDER DECK",
  });
  place(builder.group, FOUNDATION_LAYOUT.builder);
  const production = createSourceAndWorkpiece();
  place(production.group, FOUNDATION_LAYOUT.production);
  const buildDoor = createDoorAndKey("build.request");
  place(buildDoor.group, FOUNDATION_LAYOUT.buildDoor);
  buildDoor.key.visible = false;
  buildDoor.group.scale.setScalar(0.82);
  const buildLine = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.0, 1.68, 1.1),
    new THREE.Vector3(1.1, 1.3, 0.2),
    new THREE.Vector3(1.45, 1.16, -1.0),
    new THREE.Vector3(1.95, 1.15, -2.35),
  ], false, "centripetal"), PALETTE.green);
  const requestToBuilder = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(2.1, 1.18, -2.45),
    new THREE.Vector3(2.8, 1.12, -3.8),
    new THREE.Vector3(3.7, 1.12, -5.3),
    new THREE.Vector3(4.43, 1.12, -6.5),
  ], false, "centripetal"), PALETTE.green);

  group.add(
    prompt.group,
    kernel.group,
    genesis.group,
    agent,
    keyForge.group,
    internet.group,
    netTower.group,
    agentToDoor.group,
    doorToNet.group,
    forgeToDoor.group,
    builder.group,
    buildDoor.group,
    production.group,
    buildLine.group,
    requestToBuilder.group,
  );

  function setTime(rawTime) {
    const time = Math.min(120, Math.max(0, Number(rawTime) || 0));
    const promptAlpha = time < 3.89 ? progress(time, 0.15, 0.8) * (1 - progress(time, 3.35, 3.89)) : 0;
    setOpacity(prompt.group, promptAlpha);
    prompt.cursor.visible = promptAlpha > 0.01 && Math.floor(time * 2) % 2 === 0;

    const kernelRise = timedProgress(time, FOUNDATION_TIMELINE.kernelRise);
    setDeckRise(kernel, kernelRise);
    const foundationExpansion = timedProgress(time, FOUNDATION_TIMELINE.agentRise);
    const kernelScaleX = THREE.MathUtils.lerp(
      1,
      KERNEL_FOOTPRINT.expanded.width / KERNEL_FOOTPRINT.compact.width,
      foundationExpansion,
    );
    const kernelScaleZ = THREE.MathUtils.lerp(
      1,
      KERNEL_FOOTPRINT.expanded.depth / KERNEL_FOOTPRINT.compact.depth,
      foundationExpansion,
    );
    kernel.group.position.set(
      THREE.MathUtils.lerp(
        FOUNDATION_LAYOUT.kernel[0],
        FOUNDATION_LAYOUT.kernelExpanded[0],
        foundationExpansion,
      ),
      FOUNDATION_LAYOUT.kernel[1],
      FOUNDATION_LAYOUT.kernel[2],
    );
    setDeckFootprint(kernel, kernelScaleX, kernelScaleZ);
    const compactGenesisWidth = KERNEL_FOOTPRINT.compact.width * (510 / 630);
    const compactGenesisDepth = KERNEL_FOOTPRINT.compact.depth * (510 / 630);
    setDeckFootprint(
      genesis,
      THREE.MathUtils.lerp(compactGenesisWidth / GENESIS_FOOTPRINT.width, 1, foundationExpansion),
      THREE.MathUtils.lerp(compactGenesisDepth / GENESIS_FOOTPRINT.depth, 1, foundationExpansion),
    );
    genesis.group.position.set(
      THREE.MathUtils.lerp(
        FOUNDATION_LAYOUT.genesisCompact[0],
        FOUNDATION_LAYOUT.genesis[0],
        foundationExpansion,
      ),
      FOUNDATION_LAYOUT.genesis[1],
      FOUNDATION_LAYOUT.genesis[2],
    );
    const genesisRise = timedProgress(time, FOUNDATION_TIMELINE.genesisRise);
    setDeckRise(genesis, genesisRise);

    const agentRise = timedProgress(time, FOUNDATION_TIMELINE.agentRise);
    agent.visible = agentRise > 0.001;
    agent.position.set(
      THREE.MathUtils.lerp(
        FOUNDATION_LAYOUT.agentCompact[0],
        FOUNDATION_LAYOUT.agent[0],
        foundationExpansion,
      ),
      FOUNDATION_LAYOUT.agent[1] - (1 - agentRise) * 1.12,
      FOUNDATION_LAYOUT.agent[2],
    );
    agent.scale.y = agentScale * Math.max(0.001, agentRise);

    const netRise = timedProgress(time, FOUNDATION_TIMELINE.netRise);
    netTower.group.visible = netRise > 0.001;
    netTower.group.position.y = FOUNDATION_LAYOUT.netTower[1] - (1 - netRise) * 0.92;
    netTower.group.scale.y = Math.max(0.001, netRise);
    netTower.rings.forEach((ring, index) => {
      const cycle = ((time - 13.2 - index * 1.2) % 3.6 + 3.6) % 3.6 / 3.6;
      ring.scale.setScalar(0.4 + cycle * 2.5);
      ring.material.opacity = time < 13.2 ? 0 : (1 - cycle) * 0.72;
    });
    netTower.signal.rotation.z = time * 0.26;
    netTower.beacon.scale.setScalar(0.8 + Math.sin(time * 4) * 0.18);

    const lineDraw = timedProgress(time, FOUNDATION_TIMELINE.agentRoute);
    setRouteProgress(agentToDoor, lineDraw, time, time >= FOUNDATION_TIMELINE.networkConnectedAt);
    const networkWindowAlpha = 1 - progress(time, 106.25, 106.6);
    setFade(agentToDoor.group, lineDraw * networkWindowAlpha);

    const doorRise = timedProgress(time, FOUNDATION_TIMELINE.netDoorRise);
    internet.frame.position.y = -(1 - doorRise) * 0.9;
    internet.frame.scale.y = Math.max(0.001, doorRise);
    setFade(internet.frame, doorRise * networkWindowAlpha);
    internet.leafPivot.rotation.y = -Math.PI * 0.62 * progress(
      time,
      FOUNDATION_TIMELINE.netKey.detach,
      FOUNDATION_TIMELINE.netKey.insert,
    );
    const forgeRise = timedProgress(time, FOUNDATION_TIMELINE.keyForgeRise);
    keyForge.group.position.y = 1.06 - (1 - forgeRise) * 0.42;
    keyForge.group.scale.y = Math.max(0.001, forgeRise);
    keyForge.core.scale.setScalar(0.8 + Math.sin(time * 6) * 0.2);
    keyForge.burst.rotation.z = time * 0.6;
    keyForge.burst.scale.setScalar(0.72 + Math.sin(time * 4.8) * 0.18);
    setRouteProgress(forgeToDoor, progress(
      time,
      FOUNDATION_TIMELINE.netKey.start,
      FOUNDATION_TIMELINE.netKey.insert,
    ), time);
    setFade(
      forgeToDoor.group,
      progress(time, FOUNDATION_TIMELINE.netKey.start, FOUNDATION_TIMELINE.netKey.insert)
        * (1 - progress(time, FOUNDATION_TIMELINE.netKey.insert, FOUNDATION_TIMELINE.netKey.end)),
    );
    setFade(keyForge.group, forgeRise * (1 - progress(time, 33.15, 33.45)));
    const keyTravel = progress(
      time,
      FOUNDATION_TIMELINE.netKey.start,
      FOUNDATION_TIMELINE.netKey.insert,
    );
    internet.key.visible = time >= FOUNDATION_TIMELINE.keyForgeRise.start && time < 22.2;
    internet.key.position.set(
      THREE.MathUtils.lerp(-1.85, -0.08, keyTravel),
      THREE.MathUtils.lerp(0.74, 0.78, keyTravel),
      THREE.MathUtils.lerp(-2.25, 0.08, keyTravel),
    );
    internet.key.rotation.y = keyTravel * Math.PI * 2;
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
    const buildDraw = timedProgress(time, FOUNDATION_TIMELINE.buildRequestRoute);
    setRouteProgress(buildLine, buildDraw, time, time >= FOUNDATION_TIMELINE.buildKey.insert);
    const buildRequestWindowAlpha = 1 - progress(time, 94.58, 95.01);
    setFade(buildLine.group, buildDraw * buildRequestWindowAlpha);
    const buildDoorRise = timedProgress(time, FOUNDATION_TIMELINE.buildDoorRise);
    buildDoor.frame.position.y = -(1 - buildDoorRise) * 0.7;
    buildDoor.frame.scale.y = Math.max(0.001, buildDoorRise);
    setFade(buildDoor.frame, buildDoorRise * buildRequestWindowAlpha);
    buildDoor.leafPivot.rotation.y = -Math.PI * 0.62 * progress(
      time,
      FOUNDATION_TIMELINE.buildKey.detach,
      FOUNDATION_TIMELINE.buildKey.insert,
    );
    setRouteProgress(
      requestToBuilder,
      timedProgress(time, FOUNDATION_TIMELINE.builderRoute),
      time,
      time >= FOUNDATION_TIMELINE.builderRoute.end,
    );
    setFade(
      requestToBuilder.group,
      timedProgress(time, FOUNDATION_TIMELINE.builderRoute)
        * (1 - progress(time, 94.53, 94.87)),
    );

    const sourceRise = timedProgress(time, FOUNDATION_TIMELINE.sourceRise);
    production.source.visible = sourceRise > 0.001;
    production.source.position.y = 0.36 - (1 - sourceRise) * 0.72;
    production.source.scale.y = Math.max(0.001, sourceRise);
    const workpieceRise = timedProgress(time, FOUNDATION_TIMELINE.workpieceRise);
    production.workpiece.visible = workpieceRise > 0.001;
    production.workpiece.position.y = -(1 - workpieceRise) * 0.8;
    production.workpiece.scale.setScalar(Math.max(0.001, workpieceRise));
    production.core.rotation.y = time * 1.8;
    production.core.rotation.x = time * 0.7;
    const assembly = timedProgress(time, FOUNDATION_TIMELINE.assembly);
    production.source.position.x = assembly * 1.85;
    production.source.scale.setScalar(Math.max(0.001, 1 - assembly * 0.72));
    production.workpiece.position.x = THREE.MathUtils.lerp(2.6, 2.1, assembly);
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
