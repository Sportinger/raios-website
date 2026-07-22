import * as THREE from "three";

const PALETTE = Object.freeze({
  ink: 0xeaf4ff,
  muted: 0x8fa4bc,
  blue: 0x4897f2,
  blueHigh: 0x8cc3ff,
  green: 0x54bb7d,
  greenHigh: 0xbdf3d1,
  amber: 0xf4c36b,
  dark: 0x080d15,
  panel: 0x121b29,
  panelHigh: 0x1d2a3d,
});

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const progress = (time, start, end) => smoothstep((time - start) / (end - start));

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

function createDeck({ width, depth, height, color, edgeColor, label }) {
  const group = new THREE.Group();
  const body = createOutlinedBox(new THREE.Vector3(width, height, depth), color, edgeColor);
  body.position.y = height / 2;
  const grid = new THREE.GridHelper(Math.max(width, depth), 8, edgeColor, edgeColor);
  grid.scale.set(width / Math.max(width, depth), 1, depth / Math.max(width, depth));
  grid.position.y = height + 0.006;
  grid.material.transparent = true;
  grid.material.opacity = 0.18;
  const title = createLabel(label, edgeColor, Math.min(width * 0.72, 4.2), 58);
  title.position.set(0, height * 0.56, depth / 2 + 0.012);
  group.add(body, grid, title);
  return { group, body, grid, title, height };
}

function setDeckRise(deck, amount) {
  const scale = Math.max(0.001, amount);
  deck.body.scale.y = scale;
  deck.body.position.y = deck.height * scale / 2;
  deck.grid.position.y = deck.height * scale + 0.006;
  deck.title.position.y = deck.height * scale * 0.56;
  setOpacity(deck.title, clamp01((amount - 0.55) / 0.45));
  deck.group.visible = amount > 0.001;
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
  const body = createOutlinedBox(new THREE.Vector3(1.25, 1.05, 1.1), PALETTE.panelHigh, PALETTE.blueHigh);
  body.position.y = 0.58;
  const head = createOutlinedBox(new THREE.Vector3(0.72, 0.48, 0.65), PALETTE.panel, PALETTE.blueHigh);
  head.position.y = 1.42;
  const eye = createOutlinedBox(new THREE.Vector3(0.34, 0.08, 0.04), PALETTE.blue, PALETTE.blueHigh);
  eye.position.set(0, 1.44, 0.346);
  const label = createLabel("AGENT", PALETTE.ink, 1.15, 62);
  label.position.set(0, 0.7, 0.566);
  group.add(body, head, eye, label);
  return group;
}

function createDoorAndKey() {
  const group = new THREE.Group();
  const frame = new THREE.Group();
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
  leafPivot.add(leaf);
  frame.add(left, right, lintel, leafPivot);
  const label = createLabel("INTERNET", PALETTE.blueHigh, 1.6, 54);
  label.position.set(0, 1.82, 0);
  frame.add(label);

  const key = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.055, 5, 16),
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
  key.position.set(-2.7, 1.05, 0.35);
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

function createSignalLine(points, color = PALETTE.blue) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 }),
  );
  return line;
}

export function createFoundationWorld() {
  const group = new THREE.Group();
  group.name = "film-foundation-world";

  const prompt = createPrompt();
  const kernel = createDeck({
    width: 5.8, depth: 5.1, height: 0.72,
    color: 0x05080d, edgeColor: PALETTE.blue, label: "RUST KERNEL",
  });
  kernel.group.position.set(-3.05, 0, 0);
  const genesis = createDeck({
    width: 4.9, depth: 4.25, height: 0.34,
    color: PALETTE.panel, edgeColor: PALETTE.greenHigh, label: "GENESIS DECK",
  });
  genesis.group.position.set(-3.05, 0.72, 0);

  const agent = createAgent();
  agent.position.set(-3.7, 1.06, 0.35);
  const internet = createDoorAndKey();
  internet.group.position.set(-0.45, 1.06, -0.4);
  const agentToDoor = createSignalLine([
    new THREE.Vector3(-3.25, 1.62, 0.5),
    new THREE.Vector3(-2.2, 1.35, 0.25),
    new THREE.Vector3(-0.95, 1.72, -0.35),
  ]);

  const builder = createDeck({
    width: 5.1, depth: 4.25, height: 0.34,
    color: 0x111c2b, edgeColor: PALETTE.blueHigh, label: "BUILDER DECK",
  });
  builder.group.position.set(3.15, 0.72, 0);
  const production = createSourceAndWorkpiece();
  production.group.position.set(1.55, 1.06, 0.15);
  const buildLine = createSignalLine([
    new THREE.Vector3(-0.05, 1.6, -0.35),
    new THREE.Vector3(0.9, 1.35, 0),
    new THREE.Vector3(1.55, 1.55, 0.15),
  ], PALETTE.green);

  group.add(
    prompt.group,
    kernel.group,
    genesis.group,
    agent,
    internet.group,
    agentToDoor,
    builder.group,
    production.group,
    buildLine,
  );

  function setTime(rawTime) {
    const time = Math.min(120, Math.max(0, Number(rawTime) || 0));
    const promptAlpha = time < 3.89 ? progress(time, 0.15, 0.8) * (1 - progress(time, 3.35, 3.89)) : 0;
    setOpacity(prompt.group, promptAlpha);
    prompt.cursor.visible = promptAlpha > 0.01 && Math.floor(time * 2) % 2 === 0;

    const kernelRise = progress(time, 3.89, 6.14);
    setDeckRise(kernel, kernelRise);
    const genesisRise = progress(time, 8.28, 10.58);
    setDeckRise(genesis, genesisRise);

    const agentRise = progress(time, 13.02, 14.82);
    agent.visible = agentRise > 0.001;
    agent.position.y = 1.06 - (1 - agentRise) * 1.12;
    agent.scale.y = Math.max(0.001, agentRise);

    const lineDraw = progress(time, 15.02, 17.82);
    agentToDoor.visible = lineDraw > 0.001;
    agentToDoor.geometry.setDrawRange(0, Math.max(1, Math.ceil(3 * lineDraw)));

    const doorRise = progress(time, 18.72, 19.72);
    internet.frame.visible = doorRise > 0.001;
    internet.frame.position.y = -(1 - doorRise) * 0.9;
    internet.frame.scale.y = Math.max(0.001, doorRise);
    internet.leafPivot.rotation.y = -Math.PI * 0.6 * progress(time, 19.2, 20.35);
    const keyTravel = progress(time, 19.67, 21.57);
    internet.key.visible = time >= 18.25 && time < 22.2;
    internet.key.position.set(
      THREE.MathUtils.lerp(-2.7, -0.15, keyTravel),
      THREE.MathUtils.lerp(1.05, 0.85, keyTravel),
      THREE.MathUtils.lerp(0.35, 0.02, keyTravel),
    );
    internet.key.rotation.y = keyTravel * Math.PI * 2;

    const builderRise = progress(time, 27.45, 28.45);
    setDeckRise(builder, builderRise);
    const buildDraw = progress(time, 26.5, 27.4);
    buildLine.visible = buildDraw > 0.001;
    buildLine.geometry.setDrawRange(0, Math.max(1, Math.ceil(3 * buildDraw)));

    const sourceRise = progress(time, 31.4, 31.95);
    production.source.visible = sourceRise > 0.001;
    production.source.position.y = 0.36 - (1 - sourceRise) * 0.72;
    production.source.scale.y = Math.max(0.001, sourceRise);
    const workpieceRise = progress(time, 33.0, 34.0);
    production.workpiece.visible = workpieceRise > 0.001;
    production.workpiece.position.y = -(1 - workpieceRise) * 0.8;
    production.workpiece.scale.setScalar(Math.max(0.001, workpieceRise));
    production.core.rotation.y = time * 1.8;
    production.core.rotation.x = time * 0.7;
    const assembly = progress(time, 34, 40);
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
