import * as THREE from "three";
import {
  FOUNDATION_LAYOUT,
  FOUNDATION_TIMELINE,
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

function setOpacity(root, opacity) {
  root.visible = opacity > 0.001;
  root.traverse((object) => {
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      material.transparent = opacity < 0.999;
      material.opacity = opacity;
    });
  });
}

function createLabel(text, color = PALETTE.ink, width = 3, fontSize = 52) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 192;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = `700 ${fontSize}px Consolas, monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.letterSpacing = "4px";
  context.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width, width * (canvas.height / canvas.width), 1);
  sprite.userData.labelTexture = texture;
  return sprite;
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
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.72 }),
  );
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
  const title = createLabel(label, edgeColor, Math.min(width * 0.72, 4.2), 58);
  title.position.set(0, height * 0.55, depth / 2 + 0.04);
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
  socket.rotation.y = Math.PI / 4;
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
  const label = createLabel("GENESIS · KEY FORGE", PALETTE.greenHigh, 2.5, 43);
  label.position.set(0, 0.02, 0.72);
  group.add(socket, socketEdges, stem, core, glow, burst, label);
  return { group, core, glow, burst };
}

function createNetTower() {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color: PALETTE.blueHigh });
  const segments = [
    [[-0.42, 0, 0], [0, 1.78, 0]],
    [[0.42, 0, 0], [0, 1.78, 0]],
    [[-0.31, 0.48, 0], [0.31, 0.48, 0]],
    [[-0.21, 0.94, 0], [0.21, 0.94, 0]],
  ];
  segments.forEach((segment) => {
    group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(segment.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
      material,
    ));
  });
  const signal = new THREE.Mesh(
    new THREE.RingGeometry(0.35, 0.37, 40),
    new THREE.MeshBasicMaterial({ color: PALETTE.blue, transparent: true, opacity: 0.26, side: THREE.DoubleSide }),
  );
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
      new THREE.RingGeometry(0.18, 0.205, 40),
      new THREE.MeshBasicMaterial({ color: PALETTE.blueHigh, transparent: true, side: THREE.DoubleSide }),
    );
    ring.position.copy(beacon.position);
    group.add(ring);
    return ring;
  });
  const label = createLabel("NET", PALETTE.ink, 1.1, 58);
  label.position.set(0, -0.18, 0.2);
  group.add(signal, beacon, glow, label);
  return { group, rings, signal, beacon, glow };
}

function createDoorAndKey() {
  const group = new THREE.Group();
  const frame = new THREE.Group();
  const socket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.78, 0.78, 0.08, 4),
    new THREE.MeshBasicMaterial({ color: PALETTE.panelHigh }),
  );
  socket.rotation.y = Math.PI / 4;
  socket.position.y = 0.04;
  const socketEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(socket.geometry),
    new THREE.LineBasicMaterial({ color: PALETTE.blue }),
  );
  socketEdges.rotation.copy(socket.rotation);
  socketEdges.position.copy(socket.position);
  const frameMaterial = new THREE.MeshBasicMaterial({ color: PALETTE.blueHigh });
  const verticalGeometry = new THREE.BoxGeometry(0.12, 1.55, 0.16);
  const lintelGeometry = new THREE.BoxGeometry(1.18, 0.12, 0.16);
  const left = new THREE.Mesh(verticalGeometry, frameMaterial);
  const right = new THREE.Mesh(verticalGeometry, frameMaterial);
  const lintel = new THREE.Mesh(lintelGeometry, frameMaterial);
  left.position.set(-0.53, 0.775, 0);
  right.position.set(0.53, 0.775, 0);
  lintel.position.set(0, 1.49, 0);
  const leafPivot = new THREE.Group();
  leafPivot.position.set(-0.47, 0.75, 0);
  const leaf = createOutlinedBox(new THREE.Vector3(0.92, 1.36, 0.08), PALETTE.panel, PALETTE.blue);
  leaf.position.x = 0.46;
  const inset = createOutlinedBox(new THREE.Vector3(0.68, 0.94, 0.04), 0x0b1420, PALETTE.lineDark);
  inset.position.set(0.46, 0, 0.062);
  const handle = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 5),
    new THREE.MeshBasicMaterial({ color: PALETTE.amber }),
  );
  handle.position.set(0.79, 0, 0.09);
  leaf.add(inset, handle);
  leafPivot.add(leaf);
  const hinges = new THREE.Group();
  [0.32, 1.16].forEach((height) => {
    const hinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8),
      new THREE.MeshBasicMaterial({ color: PALETTE.blueHigh }),
    );
    hinge.position.set(-0.55, height, 0.1);
    hinges.add(hinge);
  });
  frame.add(socket, socketEdges, left, right, lintel, leafPivot, hinges);
  const label = createLabel("net.https", PALETTE.blueHigh, 1.55, 54);
  label.position.set(0, -0.17, 0.62);
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
  key.position.set(-1.3, 0.74, -1.67);
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

function createSignalRoute(curve, color = PALETTE.blue, samples = 72) {
  const points = curve.getPoints(samples);
  const group = new THREE.Group();
  const underlay = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: PALETTE.lineDark, transparent: true, opacity: 0.92 }),
  );
  const signal = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 }),
  );
  const pulse = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 10, 7),
    new THREE.MeshBasicMaterial({ color }),
  );
  const glow = createGlow(color, 0.72, 0.72);
  group.add(underlay, signal, pulse, glow);
  return { group, curve, underlay, signal, pulse, glow, pointCount: points.length };
}

function setRouteProgress(route, amount, time, persistent = false) {
  const value = clamp01(amount);
  route.group.visible = value > 0.001;
  route.signal.geometry.setDrawRange(0, Math.max(1, Math.ceil(route.pointCount * value)));
  route.underlay?.geometry?.setDrawRange(0, Math.max(1, Math.ceil(route.pointCount * value)));
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
    width: 5.8, depth: 5.1, height: 0.72,
    color: 0x05080d, edgeColor: PALETTE.blue, label: "RUST KERNEL",
  });
  const kernelFacets = createSlabFacets(5.8, 5.1, 0.72);
  kernel.body.add(kernelFacets);
  place(kernel.group, FOUNDATION_LAYOUT.kernel);
  const genesis = createDeck({
    width: 4.9, depth: 4.25, height: 0.34,
    color: PALETTE.panel, edgeColor: PALETTE.greenHigh, label: "GENESIS DECK",
  });
  place(genesis.group, FOUNDATION_LAYOUT.genesis);

  const agent = createAgent();
  place(agent, FOUNDATION_LAYOUT.agent);
  const keyForge = createKeyForge();
  place(keyForge.group, FOUNDATION_LAYOUT.keyForge);
  const internet = createDoorAndKey();
  place(internet.group, FOUNDATION_LAYOUT.netDoor);
  const netTower = createNetTower();
  place(netTower.group, FOUNDATION_LAYOUT.netTower);
  const agentToDoor = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.2, 1.58, 0.72),
    new THREE.Vector3(-2.7, 1.2, 1.08),
    new THREE.Vector3(-1.78, 1.13, 1.52),
    new THREE.Vector3(-1.06, 1.2, 1.7),
  ], false, "centripetal"));
  const doorToNet = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.68, 1.16, 1.8),
    new THREE.Vector3(0.08, 0.88, 2.06),
    new THREE.Vector3(0.94, 0.78, 2.38),
    new THREE.Vector3(1.75, 0.76, 2.55),
  ], false, "centripetal"));
  const forgeToDoor = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.15, 1.8, 0.05),
    new THREE.Vector3(-2.0, 1.44, 0.48),
    new THREE.Vector3(-1.55, 1.22, 1.08),
    new THREE.Vector3(-0.85, 1.78, 1.72),
  ], false, "centripetal"), PALETTE.green);

  const builder = createDeck({
    width: 5.1, depth: 4.25, height: 0.34,
    color: 0x111c2b, edgeColor: PALETTE.blueHigh, label: "BUILDER DECK",
  });
  place(builder.group, FOUNDATION_LAYOUT.builder);
  const production = createSourceAndWorkpiece();
  place(production.group, FOUNDATION_LAYOUT.production);
  const buildDoor = createDoorAndKey();
  place(buildDoor.group, FOUNDATION_LAYOUT.buildDoor);
  buildDoor.key.visible = false;
  buildDoor.group.scale.setScalar(0.82);
  const buildDoorLabel = createLabel("build.request", PALETTE.greenHigh, 1.72, 44);
  buildDoorLabel.position.set(0, -0.19, 0.64);
  buildDoor.frame.children.filter((child) => child.isSprite).forEach((child) => {
    child.visible = false;
  });
  buildDoor.frame.add(buildDoorLabel);
  const buildLine = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.18, 1.44, 0.48),
    new THREE.Vector3(-1.9, 1.16, 0.16),
    new THREE.Vector3(-0.55, 1.15, 0.36),
    new THREE.Vector3(0.6, 1.15, 0.7),
  ], false, "centripetal"), PALETTE.green);
  const requestToBuilder = createSignalRoute(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.75, 1.18, 0.7),
    new THREE.Vector3(1.45, 1.12, 0.48),
    new THREE.Vector3(2.2, 1.12, 0.24),
    new THREE.Vector3(2.72, 1.12, 0.05),
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
    const genesisRise = timedProgress(time, FOUNDATION_TIMELINE.genesisRise);
    setDeckRise(genesis, genesisRise);

    const agentRise = timedProgress(time, FOUNDATION_TIMELINE.agentRise);
    agent.visible = agentRise > 0.001;
    agent.position.y = 1.06 - (1 - agentRise) * 1.12;
    agent.scale.y = Math.max(0.001, agentRise);

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

    const doorRise = timedProgress(time, FOUNDATION_TIMELINE.netDoorRise);
    internet.frame.visible = doorRise > 0.001;
    internet.frame.position.y = -(1 - doorRise) * 0.9;
    internet.frame.scale.y = Math.max(0.001, doorRise);
    internet.leafPivot.rotation.y = -Math.PI * 0.62 * progress(
      time,
      FOUNDATION_TIMELINE.netKey.detach,
      FOUNDATION_TIMELINE.netKey.insert,
    );
    const forgeRise = timedProgress(time, FOUNDATION_TIMELINE.keyForgeRise);
    keyForge.group.visible = time >= FOUNDATION_TIMELINE.keyForgeRise.start && time < 33.45;
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
    const keyTravel = progress(
      time,
      FOUNDATION_TIMELINE.netKey.start,
      FOUNDATION_TIMELINE.netKey.insert,
    );
    internet.key.visible = time >= FOUNDATION_TIMELINE.keyForgeRise.start && time < 22.2;
    internet.key.position.set(
      THREE.MathUtils.lerp(-1.3, -0.08, keyTravel),
      THREE.MathUtils.lerp(0.74, 0.78, keyTravel),
      THREE.MathUtils.lerp(-1.67, 0.08, keyTravel),
    );
    internet.key.rotation.y = keyTravel * Math.PI * 2;
    setRouteProgress(
      doorToNet,
      timedProgress(time, FOUNDATION_TIMELINE.netRoute),
      time,
      time >= FOUNDATION_TIMELINE.networkConnectedAt,
    );

    const builderRise = timedProgress(time, FOUNDATION_TIMELINE.builderRise);
    setDeckRise(builder, builderRise);
    const buildDraw = timedProgress(time, FOUNDATION_TIMELINE.buildRequestRoute);
    setRouteProgress(buildLine, buildDraw, time, time >= FOUNDATION_TIMELINE.buildKey.insert);
    const buildDoorRise = timedProgress(time, FOUNDATION_TIMELINE.buildDoorRise);
    buildDoor.frame.visible = buildDoorRise > 0.001;
    buildDoor.frame.position.y = -(1 - buildDoorRise) * 0.7;
    buildDoor.frame.scale.y = Math.max(0.001, buildDoorRise);
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
