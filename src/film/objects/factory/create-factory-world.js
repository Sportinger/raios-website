import * as THREE from "three";
import {
  FACTORY_ISLANDS,
  FACTORY_LANES,
  FACTORY_LAYOUT,
  FACTORY_PALETTE,
  FACTORY_SCENES,
} from "./config.js";
import { interval, pulse, showScene, smootherstep } from "./timeline.js";
import {
  createFlatMaterial,
  createResourceTracker,
  createRing,
  createRoute,
  createTextLabel,
  createVectorBox,
} from "./primitives.js";

const setYScale = (object, scale) => {
  object.scale.y = Math.max(0.001, scale);
};

const setLabelText = (label, text) => label.userData.setText?.(text);

function createMachine(tracker, lane) {
  const { color, x, z, scale } = lane;
  const group = new THREE.Group();
  group.name = `factory-machine-${lane.id}`;
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  group.add(createVectorBox(tracker, {
    size: [2.2, 0.28, 2.45], color: FACTORY_PALETTE.panel,
    edgeColor: FACTORY_PALETTE.edge, position: [0, 0.14, 0],
  }));
  group.add(createVectorBox(tracker, {
    size: [1.55, 1.62, 1.38], color: FACTORY_PALETTE.panelLight,
    edgeColor: color, position: [0, 0.98, -0.18],
  }));
  const aperture = createVectorBox(tracker, {
    size: [0.92, 0.42, 0.06], color, edgeColor: FACTORY_PALETTE.white,
    position: [0, 0.95, 0.53],
  });
  group.add(aperture);
  const status = createRing(tracker, 0.27, color, 0.04);
  status.position.set(0, 1.9, -0.18);
  group.add(status);
  const labelCopy = {
    compiler: "COMPILER · rustc → WASM",
    verifier: "PRÜFER · HARNESS",
    guard: "GUARD · LIVE GATE",
  }[lane.id];
  const label = createTextLabel(tracker, {
    text: labelCopy, width: 1.8, height: 0.36, color,
    background: FACTORY_PALETTE.ink, position: [0, 1.28, 0.56], fontSize: 38,
  });
  const progressRail = createVectorBox(tracker, {
    size: [1.82, 0.1, 0.06], color: FACTORY_PALETTE.ink,
    edgeColor: FACTORY_PALETTE.edge, position: [0, 2.25, -0.16],
  });
  const progressFill = createVectorBox(tracker, {
    size: [1.68, 0.055, 0.075], color, position: [-0.84, 2.25, -0.11],
  });
  progressFill.scale.x = 0.001;
  const progressCaption = createTextLabel(tracker, {
    text: lane.id === "compiler" ? "READY · ROUND 0/3" : lane.id === "verifier" ? "READY · NEXT ROUND 2/3" : "REPORT · HASH · RIGHTS · OWNER",
    width: 2.7, height: 0.32, color: 0xafc2d9, background: FACTORY_PALETTE.ink,
    position: [0, 2.62, -0.16], fontSize: 34,
  });
  const versionCaption = lane.id === "compiler" ? createTextLabel(tracker, {
    text: "rustc 1.83.0-dev · NO NET", width: 2.85, height: 0.3,
    color: 0x718197, background: FACTORY_PALETTE.ink,
    position: [0, 2.43, -0.1], fontSize: 32,
  }) : null;
  const glow = createVectorBox(tracker, {
    size: [1.85, 1.9, 1.65], color, position: [0, 1.05, -0.18], opacity: 0.055,
  });
  glow.visible = false;
  group.add(glow, label, progressRail, progressFill, progressCaption);
  if (versionCaption) group.add(versionCaption);
  return { group, aperture, status, progressRail, progressFill, progressCaption, versionCaption, glow };
}

function createDoor(tracker, color, position = [0, 0, 0], scale = 1) {
  const group = new THREE.Group();
  group.name = "factory-door";
  group.position.set(...position);
  group.scale.setScalar(scale);
  const left = createVectorBox(tracker, {
    size: [0.22, 3.8, 0.42], color: FACTORY_PALETTE.panel,
    edgeColor: color, position: [-1.38, 1.9, 0],
  });
  const right = createVectorBox(tracker, {
    size: [0.22, 3.8, 0.42], color: FACTORY_PALETTE.panel,
    edgeColor: color, position: [1.38, 1.9, 0],
  });
  const lintel = createVectorBox(tracker, {
    size: [2.98, 0.24, 0.42], color: FACTORY_PALETTE.panel,
    edgeColor: color, position: [0, 3.72, 0],
  });
  const threshold = createVectorBox(tracker, {
    size: [2.98, 0.14, 0.7], color, position: [0, 0.07, 0],
  });
  const hinge = new THREE.Group();
  hinge.position.set(-1.22, 0, 0.04);
  const leaf = createVectorBox(tracker, {
    size: [2.42, 3.35, 0.2], color: FACTORY_PALETTE.panelLight,
    edgeColor: color, position: [1.21, 1.77, 0],
  });
  hinge.add(leaf);
  group.add(left, right, lintel, threshold, hinge);
  return { group, hinge, leaf };
}

function createBuilderScene(tracker, inert = false) {
  const group = new THREE.Group();
  const { deck: deckLayout, hatch: hatchLayout } = FACTORY_LAYOUT;
  const deck = createVectorBox(tracker, {
    size: [deckLayout.width, deckLayout.thickness, deckLayout.depth], color: FACTORY_PALETTE.panel,
    edgeColor: FACTORY_PALETTE.edge, position: [0, deckLayout.thickness / 2, 0],
  });
  group.add(deck);
  for (let x = -6; x <= 6; x += deckLayout.gridStep) {
    group.add(createRoute(tracker, [[x, 0.74, -deckLayout.depth / 2], [x, 0.74, deckLayout.depth / 2]], FACTORY_PALETTE.edge, 0.018));
  }
  for (let z = -4; z <= 4; z += deckLayout.gridStep) {
    group.add(createRoute(tracker, [[-deckLayout.width / 2, 0.74, z], [deckLayout.width / 2, 0.74, z]], FACTORY_PALETTE.edge, 0.018));
  }
  const hatch = createVectorBox(tracker, {
    size: [hatchLayout.width, 0.12, hatchLayout.depth], color: inert ? FACTORY_PALETTE.panelLight : FACTORY_PALETTE.ink,
    edgeColor: inert ? FACTORY_PALETTE.amber : FACTORY_PALETTE.cyan, position: [0, 0.82, 0],
  });
  const title = createTextLabel(tracker, {
    text: "BUILDER DECK", width: 5.5, height: 0.58,
    color: FACTORY_PALETTE.edge, background: FACTORY_PALETTE.ink,
    position: [0, 0.38, 5.08], fontSize: 54,
  });
  const inputDoor = createDoor(tracker, FACTORY_PALETTE.cyan, [FACTORY_LAYOUT.inputDoor.x, 0.76, FACTORY_LAYOUT.inputDoor.z], 0.52);
  inputDoor.group.rotation.y = FACTORY_LAYOUT.inputDoor.yaw;
  const outputDoor = createDoor(tracker, FACTORY_PALETTE.green, [FACTORY_LAYOUT.outputDoor.x, 0.76, FACTORY_LAYOUT.outputDoor.z], 0.52);
  outputDoor.group.rotation.y = FACTORY_LAYOUT.outputDoor.yaw;
  const outLabel = createTextLabel(tracker, {
    text: "/out", width: 1.25, height: 0.34, color: FACTORY_PALETTE.amber,
    background: FACTORY_PALETTE.ink, position: [0, 4.18, 0], fontSize: 52,
  });
  outputDoor.group.add(outLabel);
  const sourceA = createVectorBox(tracker, {
    size: [1.2, 0.18, 1.6], color: FACTORY_PALETTE.amber,
    edgeColor: FACTORY_PALETTE.white, position: [-5.7, 1.02, 2.9],
  });
  const sourceB = createVectorBox(tracker, {
    size: [1.2, 0.18, 1.6], color: FACTORY_PALETTE.amber,
    edgeColor: FACTORY_PALETTE.white, position: [-3.9, 1.02, 3.6],
  });
  const workpiece = createVectorBox(tracker, {
    size: [2.1, 1.65, 1.9], color: FACTORY_PALETTE.panelLight,
    edgeColor: FACTORY_PALETTE.cyan, position: [0, 1.62, 0],
  });
  const sourceALabel = createTextLabel(tracker, {
    text: "main.rs", width: 1.35, height: 0.32, color: FACTORY_PALETTE.amber,
    background: FACTORY_PALETTE.ink, position: [0, 0.35, 0.84], fontSize: 52,
  });
  const sourceBLabel = createTextLabel(tracker, {
    text: "Cargo.toml", width: 1.65, height: 0.32, color: FACTORY_PALETTE.amber,
    background: FACTORY_PALETTE.ink, position: [0, 0.35, 0.84], fontSize: 45,
  });
  sourceA.add(sourceALabel);
  sourceB.add(sourceBLabel);
  const workpieceLabel = createTextLabel(tracker, {
    text: inert ? "PLAYER.RS" : "WORKPIECE 01", width: 1.8, height: 0.36,
    color: FACTORY_PALETTE.white, background: FACTORY_PALETTE.ink,
    position: [0, 1.05, 0.98], fontSize: 48,
  });
  workpiece.add(workpieceLabel);
  const caption = createTextLabel(tracker, {
    text: inert ? "HASHED · CONTENT-ADDRESSED · IMMUTABLE" : "OFFLINE TOOLS · SEALED EGRESS",
    width: 7.8, height: 0.48, color: 0xaab5c5, background: FACTORY_PALETTE.ink,
    position: [0, 5.2, -3.9], fontSize: 42,
  });
  const keyLabels = [
    createTextLabel(tracker, {
      text: "READ", width: 1.2, height: 0.34, color: FACTORY_PALETTE.amber,
      background: FACTORY_PALETTE.ink, position: [-3.5, 2.2, -1.8], fontSize: 56,
    }),
    createTextLabel(tracker, {
      text: "READ/WRITE", width: 1.8, height: 0.34, color: FACTORY_PALETTE.amber,
      background: FACTORY_PALETTE.ink, position: [3.7, 2.2, -1.5], fontSize: 46,
    }),
  ];
  keyLabels.forEach((label) => { label.visible = false; });
  const route = createRoute(tracker, [
    [-5.7, 1, 2.9], [-2.8, 1.05, 2], [0, 1.05, 0], [3.2, 1.05, -1.2], [6.1, 1.05, -2.7],
  ], inert ? FACTORY_PALETTE.amber : FACTORY_PALETTE.cyan, 0.065);
  group.add(hatch, title, caption, ...keyLabels, inputDoor.group, outputDoor.group, sourceA, sourceB, workpiece, route);
  return { group, deck, hatch, caption, keyLabels, inputDoor, outputDoor, sourceA, sourceB, workpiece, route };
}

function createCompilerScene(tracker) {
  const group = new THREE.Group();
  const deck = createBuilderScene(tracker, true);
  group.add(deck.group);
  const machines = FACTORY_LANES.map((lane) => createMachine(tracker, lane));
  machines.forEach(({ group: machine }) => group.add(machine));

  const tokenGeometry = tracker.geometry(new THREE.BoxGeometry(1.05, 0.34, 1.05));
  const tokenMaterial = createFlatMaterial(tracker, FACTORY_PALETTE.amber);
  const tokens = new THREE.InstancedMesh(tokenGeometry, tokenMaterial, FACTORY_LANES.length);
  tokens.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(tokens);
  const materialRoute = createRoute(tracker, [
    [-3.2, 0.9, 2.7], [-1.4, 0.9, 2.2], [0, 0.9, 1.6], [2.55, 0.9, -1.2], [-2.2, 0.9, -1.55],
  ], FACTORY_PALETTE.blue, 0.075);
  const sceneCaption = createTextLabel(tracker, {
    text: "ROUND 1/3 · COMPILER GATE", width: 11.5, height: 0.58,
    color: 0xaab5c5, background: FACTORY_PALETTE.ink,
    position: [0, 6.25, -4.2], fontSize: 34, maxWidth: 970,
  });
  const evidence = createTextLabel(tracker, {
    text: "PLAYER.RS · # · C · R · TEST PASS", width: 4.5, height: 0.42,
    color: FACTORY_PALETTE.green, background: FACTORY_PALETTE.ink,
    position: [0, 1.15, 1.02], fontSize: 40,
  });
  deck.workpiece.add(evidence);
  const upgrades = [
    ["LOCK CACHE", -1.8, 1.18, 3.7], ["BYTE JIG", 4.8, 1.18, -3.8], ["DRILL KIT", 6.5, 1.18, -1.2],
  ].map(([text, x, y, z]) => createTextLabel(tracker, {
    text, width: 1.65, height: 0.34, color: 0xa9c8e9,
    background: FACTORY_PALETTE.panel, position: [x, y, z], fontSize: 46,
  }));
  group.add(materialRoute, sceneCaption, ...upgrades);
  return { group, deck, machines, tokens, materialRoute, sceneCaption, upgrades };
}

function createFeedbackScene(tracker) {
  const group = new THREE.Group();
  const terminal = createVectorBox(tracker, {
    size: [5.2, 3.5, 0.5], color: FACTORY_PALETTE.ink,
    edgeColor: FACTORY_PALETTE.red, position: [-3.2, 2.1, 0],
  });
  const fixedSource = createVectorBox(tracker, {
    size: [3.4, 1.8, 2.3], color: FACTORY_PALETTE.panelLight,
    edgeColor: FACTORY_PALETTE.green, position: [4.1, 1.05, 0],
  });
  const errorBars = Array.from({ length: 4 }, (_, index) => createVectorBox(tracker, {
    size: [3.5 - index * 0.42, 0.16, 0.12], color: FACTORY_PALETTE.red,
    position: [-3.2, 2.95 - index * 0.55, 0.3],
  }));
  const failureLabel = createTextLabel(tracker, {
    text: "FAILED! · DIAG 01", width: 3.9, height: 0.55,
    color: FACTORY_PALETTE.red, background: FACTORY_PALETTE.ink,
    position: [-3.2, 3.78, 0.32], fontSize: 52,
  });
  const cards = Array.from({ length: 3 }, (_, index) => {
    const card = createVectorBox(tracker, {
      size: [2.4, 0.18, 1.45], color: FACTORY_PALETTE.panel,
      edgeColor: FACTORY_PALETTE.red, position: [-1.5 + index * 1.7, 1.15 + index * 0.22, 2.7],
    });
    card.rotation.y = -0.12 + index * 0.12;
    card.add(createTextLabel(tracker, {
      text: "EDIT", width: 1.15, height: 0.3, color: FACTORY_PALETTE.red,
      background: FACTORY_PALETTE.ink, position: [0, 0.2, 0.75], fontSize: 54,
    }));
    group.add(card);
    return card;
  });
  group.add(terminal, fixedSource, failureLabel, ...errorBars);
  group.add(createRoute(tracker, [
    [-0.6, 2.1, 0], [0.3, 4.5, 0], [3, 4.5, 0], [4.1, 2, 0],
  ], FACTORY_PALETTE.red, 0.1));
  group.add(createRoute(tracker, [
    [4.1, 0.6, 0], [2.5, -0.6, 0], [-1.2, -0.6, 0], [-3.2, 0.4, 0],
  ], FACTORY_PALETTE.green, 0.1));
  const fix = createVectorBox(tracker, {
    size: [0.55, 0.55, 0.55], color: FACTORY_PALETTE.white,
    edgeColor: FACTORY_PALETTE.green,
  });
  group.add(fix);
  return { group, terminal, errorBars, cards, fix };
}

function createTwinScene(tracker) {
  const group = new THREE.Group();
  const pods = [-3.2, 3.2].map((x) => {
    const pod = createVectorBox(tracker, {
      size: [4.2, 2.2, 5.2], color: FACTORY_PALETTE.panel,
      edgeColor: FACTORY_PALETTE.cyan, position: [x, 1.1, 0],
    });
    group.add(pod);
    return pod;
  });
  const bridge = createRoute(tracker, [[-1.1, 1.2, 0], [0, 2, 0], [1.1, 1.2, 0]], FACTORY_PALETTE.green, 0.14);
  const seal = createRing(tracker, 1.05, FACTORY_PALETTE.green, 0.11);
  seal.position.y = 3.4;
  const progressRails = [-3.2, 3.2].map((x) => {
    const rail = createVectorBox(tracker, {
      size: [2.8, 0.16, 0.1], color: FACTORY_PALETTE.ink,
      edgeColor: FACTORY_PALETTE.edge, position: [x, 2.55, 2.63],
    });
    const fill = createVectorBox(tracker, {
      size: [2.62, 0.08, 0.12], color: FACTORY_PALETTE.cyan,
      position: [x - 1.31, 2.55, 2.7],
    });
    fill.scale.x = 0.001;
    group.add(rail, fill);
    return fill;
  });
  const hashPlates = [-3.2, 3.2].map((x, index) => {
    const label = createTextLabel(tracker, {
      text: index === 0 ? "A · A91E" : "B · A91E",
      width: 2.25, height: 0.46, background: FACTORY_PALETTE.ink,
      color: index === 0 ? FACTORY_PALETTE.cyan : FACTORY_PALETTE.red,
      position: [x, 3.08, 2.66], fontSize: 52,
    });
    group.add(label);
    return label;
  });
  const resultLabel = createTextLabel(tracker, {
    text: "BUILDING A/B", width: 3.2, height: 0.42, color: 0x7e8a9b,
    background: FACTORY_PALETTE.ink, position: [0, 4.15, 0], fontSize: 48,
  });
  const drillLabel = createTextLabel(tracker, {
    text: "WALL · IMPORT · FUEL", width: 3.6, height: 0.38, color: 0x5f6a7d,
    background: FACTORY_PALETTE.ink, position: [0, 3.68, 2.66], fontSize: 42,
  });
  group.add(bridge, seal, resultLabel, drillLabel);
  return { group, pods, bridge, seal, progressRails, hashPlates, resultLabel, drillLabel };
}

function createProofScene(tracker) {
  const group = new THREE.Group();
  const shadowLayout = FACTORY_LAYOUT.shadow;
  const cellar = createVectorBox(tracker, {
    size: [shadowLayout.width, shadowLayout.thickness, shadowLayout.depth], color: 0x351d4e, edgeColor: 0xb77cff,
    position: [0, shadowLayout.thickness / 2, 0], opacity: 0.82,
  });
  const subject = createVectorBox(tracker, {
    size: [1.5, 1.2, 1.5], color: FACTORY_PALETTE.cyan,
    edgeColor: 0xe7d6fa, position: [0, 1.35, 0],
  });
  subject.add(createTextLabel(tracker, {
    text: "PLAYER.WASM · GHOST COPY", width: 2.6, height: 0.38,
    color: 0xe7d6fa, background: 0x12091e, position: [0, 0.85, 0.78], fontSize: 42,
  }));
  group.add(cellar, subject);
  for (let x = -5; x <= 5; x += shadowLayout.gridStep) {
    group.add(createRoute(tracker, [[x, 0.75, -shadowLayout.depth / 2], [x, 0.75, shadowLayout.depth / 2]], 0xc594ff, 0.018));
  }
  for (let z = -3; z <= 3; z += shadowLayout.gridStep) {
    group.add(createRoute(tracker, [[-shadowLayout.width / 2, 0.75, z], [shadowLayout.width / 2, 0.75, z]], 0xc594ff, 0.018));
  }
  const entryDoor = createDoor(tracker, 0xd8acff, [4.5, 0.76, -2.55], 0.65);
  entryDoor.group.rotation.y = -Math.PI / 4;
  group.add(entryDoor.group);
  const shadowTitle = createTextLabel(tracker, {
    text: "SHADOW WORLD · DISPOSABLE · ZERO LIVE EFFECT", width: 7.8, height: 0.58,
    color: 0xd9b8ff, background: 0x12091e, position: [0, 0.38, 4.08], fontSize: 48,
  });
  group.add(shadowTitle);
  const entryLabel = createTextLabel(tracker, {
    text: "shadow.in", width: 1.7, height: 0.38,
    color: 0xdcc3f6, background: 0x130b1c, position: [0, 4.15, 0], fontSize: 52,
  });
  entryDoor.group.add(entryLabel);
  const mockDoors = [-3.7, -1.8, 0.1].map((x, index) => {
    const door = createDoor(tracker, 0xc28bff, [x, 0.76, -2.65 + index * 0.15], 0.34);
    door.group.rotation.y = Math.PI / 7;
    const label = createTextLabel(tracker, {
      text: ["fb.mock", "input.inject", "file.sandbox"][index],
      width: 2.2, height: 0.36, color: 0xdcc3f6, background: 0x130b1c,
      position: [0, 4.15, 0], fontSize: 44,
    });
    door.group.add(label);
    group.add(door.group);
    return door;
  });
  const entryRoute = createRoute(tracker, [
    [6.8, 1.1, -4], [5.2, 1.15, -3.3], [4.5, 1.15, -2.55], [2.5, 1.15, -1.2], [0, 1.15, 0],
  ], 0xc48eff, 0.055);
  group.add(entryRoute);
  const attacks = [
    [[-8, 1.2, -2.6], [-5.8, 1.2, -1.6]],
    [[8, 1.2, -2.8], [5.8, 1.2, -1.8]],
    [[8, 1.2, 3.4], [5.8, 1.2, 2.4]],
  ].map((points) => {
    const route = createRoute(tracker, points, FACTORY_PALETTE.red, 0.075);
    const impact = createRing(tracker, 0.42, 0xff8b85, 0.055);
    impact.position.set(...points[1]);
    impact.rotation.x = 0;
    group.add(route, impact);
    return { route, impact };
  });
  const spikeGeometry = tracker.geometry(new THREE.ConeGeometry(0.18, 1.2, 4));
  const spikeMaterial = createFlatMaterial(tracker, FACTORY_PALETTE.red);
  const spikes = new THREE.InstancedMesh(spikeGeometry, spikeMaterial, 16);
  const matrix = new THREE.Matrix4();
  for (let index = 0; index < 16; index += 1) {
    const angle = index / 16 * Math.PI * 2;
    matrix.makeTranslation(Math.cos(angle) * 4.5, 0.15, Math.sin(angle) * 2.8);
    spikes.setMatrixAt(index, matrix);
  }
  group.add(spikes);
  return { group, subject, spikes, entryDoor, mockDoors, entryRoute, attacks };
}

function createGuardScene(tracker) {
  const group = new THREE.Group();
  const machine = createMachine(tracker, {
    id: "guard", x: 0, z: 0, scale: 1, color: FACTORY_PALETTE.green,
  });
  group.add(machine.group);
  const orbitRings = [1.5, 2.1, 2.7, 3.3].map((radius, index) => {
    const ring = createRing(tracker, radius, [
      FACTORY_PALETTE.cyan, FACTORY_PALETTE.amber,
      FACTORY_PALETTE.violet, FACTORY_PALETTE.green,
    ][index], 0.07);
    ring.position.y = 4.1;
    group.add(ring);
    return ring;
  });
  const checklist = [FACTORY_PALETTE.red, FACTORY_PALETTE.red, FACTORY_PALETTE.red, FACTORY_PALETTE.red].map((color, index) => {
    const badge = createRing(tracker, 0.32, color, 0.1);
    badge.position.set(-1.8 + index * 1.2, 0.72, 2.25);
    badge.add(createTextLabel(tracker, {
      text: ["R", "#", "C", "U"][index], width: 0.52, height: 0.38,
      color: FACTORY_PALETTE.white, background: FACTORY_PALETTE.ink,
      position: [0, 0, 0.12], fontSize: 64,
    }));
    group.add(badge);
    return badge;
  });
  const liveDoor = createDoor(tracker, FACTORY_PALETTE.red, [5, 0, -0.5], 0.9);
  liveDoor.group.rotation.y = -Math.PI / 2;
  const grantRoute = createRoute(tracker, [[0, 1, 0], [2.1, 1.1, -0.4], [5, 1.1, -0.5]], FACTORY_PALETTE.green, 0.06);
  const liveDoorLabel = createTextLabel(tracker, {
    text: "/out", width: 1.3, height: 0.38, color: FACTORY_PALETTE.amber,
    background: FACTORY_PALETTE.ink, position: [0, 4.2, 0], fontSize: 56,
  });
  liveDoor.group.add(liveDoorLabel);
  const gateStatus = createTextLabel(tracker, {
    text: "GUARD · WAITING FOR REPORT", width: 5.4, height: 0.48,
    color: 0xf0b0ad, background: FACTORY_PALETTE.ink,
    position: [2.3, 5.1, -0.5], fontSize: 42,
  });
  group.add(liveDoor.group, grantRoute, gateStatus);
  return { group, machine, orbitRings, checklist, liveDoor, grantRoute, gateStatus };
}

function createApprovalScene(tracker) {
  const group = new THREE.Group();
  const frame = createVectorBox(tracker, {
    size: [8.5, 6.4, 0.7], color: FACTORY_PALETTE.panel,
    edgeColor: FACTORY_PALETTE.green, position: [0, 3.2, 0],
  });
  const opening = createVectorBox(tracker, {
    size: [6.4, 4.8, 0.9], color: FACTORY_PALETTE.ink, position: [0, 3.1, 0.05],
  });
  const leftDoor = createVectorBox(tracker, {
    size: [3.1, 4.6, 0.35], color: FACTORY_PALETTE.panelLight,
    edgeColor: FACTORY_PALETTE.cyan, position: [-1.6, 3.1, 0.6],
  });
  const rightDoor = createVectorBox(tracker, {
    size: [3.1, 4.6, 0.35], color: FACTORY_PALETTE.panelLight,
    edgeColor: FACTORY_PALETTE.cyan, position: [1.6, 3.1, 0.6],
  });
  const approval = createRing(tracker, 0.72, FACTORY_PALETTE.green, 0.14);
  approval.position.set(0, 7.3, 0);
  const domainTitle = createTextLabel(tracker, {
    text: "PLAYER DOMAIN", width: 4.2, height: 0.5,
    color: FACTORY_PALETTE.green, background: FACTORY_PALETTE.ink,
    position: [0, 7.7, 0], fontSize: 52,
  });
  const domainDoors = ["fb region", "input", "file door"].map((text, index) => {
    const door = createDoor(tracker, FACTORY_PALETTE.green, [-3.8 + index * 3.8, 0, 3], 0.48);
    door.group.add(createTextLabel(tracker, {
      text, width: 1.55, height: 0.34, color: FACTORY_PALETTE.amber,
      background: FACTORY_PALETTE.ink, position: [0, 4.2, 0], fontSize: 48,
    }));
    group.add(door.group);
    return door;
  });
  const domainRoutes = domainDoors.map((door, index) => {
    const route = createRoute(tracker, [[0, 0.9, 0], [-3.8 + index * 3.8, 0.9, 3]], FACTORY_PALETTE.green, 0.05);
    group.add(route);
    return route;
  });
  group.add(frame, opening, leftDoor, rightDoor, approval, domainTitle);
  return { group, leftDoor, rightDoor, approval, domainTitle, domainDoors, domainRoutes };
}

function createPlayer(tracker) {
  const group = new THREE.Group();
  const body = createVectorBox(tracker, {
    size: [5.8, 1.1, 3.8], color: FACTORY_PALETTE.panelLight,
    edgeColor: FACTORY_PALETTE.cyan, position: [0, 0.6, 0],
  });
  const bars = [0.6, 1.2, 1.8, 1.1, 0.75].map((height, index) => createVectorBox(tracker, {
    size: [0.42, height, 0.42], color: FACTORY_PALETTE.cyan,
    position: [-1.3 + index * 0.65, 1.1 + height / 2, 0],
  }));
  const label = createTextLabel(tracker, {
    text: "MUSIC PLAYER", width: 3.6, height: 0.48,
    color: FACTORY_PALETTE.white, background: FACTORY_PALETTE.ink,
    position: [0, 2.9, 1.95], fontSize: 50,
  });
  group.add(body, label, ...bars);
  return { group, body, bars, label };
}

function createCompactScene(tracker) {
  const group = new THREE.Group();
  const floorGeometry = tracker.geometry(new THREE.CylinderGeometry(4.2, 4.8, 0.7, 12));
  const floorMaterial = createFlatMaterial(tracker, FACTORY_PALETTE.panel);
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = 0.35;
  const wall = createRing(tracker, 4.15, FACTORY_PALETTE.violet, 0.14);
  wall.position.y = 0.82;
  const player = createPlayer(tracker);
  player.group.scale.setScalar(0.72);
  player.group.position.y = 0.7;
  const domainLabel = createTextLabel(tracker, {
    text: "PLAYER DOMAIN · one door", width: 5.2, height: 0.48,
    color: FACTORY_PALETTE.green, background: FACTORY_PALETTE.ink,
    position: [0, 1.1, 4.55], fontSize: 44,
  });
  group.add(floor, wall, player.group, domainLabel);
  return { group, floor, wall, player, domainLabel };
}

function createArchipelagoScene(tracker) {
  const group = new THREE.Group();
  const baseGeometry = tracker.geometry(new THREE.CylinderGeometry(1.38, 1.65, 0.55, 10));
  const baseMaterial = createFlatMaterial(tracker, FACTORY_PALETTE.panel);
  const bases = new THREE.InstancedMesh(baseGeometry, baseMaterial, FACTORY_ISLANDS.length);
  bases.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const coreGeometry = tracker.geometry(new THREE.BoxGeometry(1.25, 1, 1.25));
  const coreMaterial = tracker.material(new THREE.MeshBasicMaterial({ vertexColors: true }));
  const cores = new THREE.InstancedMesh(coreGeometry, coreMaterial, FACTORY_ISLANDS.length);
  cores.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  FACTORY_ISLANDS.forEach((island, index) => cores.setColorAt(index, new THREE.Color(island.color)));
  group.add(bases, cores);
  const labels = FACTORY_ISLANDS.map((island) => {
    const label = createTextLabel(tracker, {
      text: `${island.icon} · ${island.label}`, width: island.label.length > 10 ? 2.8 : 2.25,
      height: 0.38, color: island.color, background: FACTORY_PALETTE.ink,
      position: [0, 0, 0], fontSize: 42,
    });
    group.add(label);
    return label;
  });

  const routes = FACTORY_ISLANDS.slice(1, 8).map((island) => {
    const route = createRoute(tracker, [[0, 0.35, 0], [island.x * 0.5, 0.2, island.z * 0.5], [island.x, 0.35, island.z]], FACTORY_PALETTE.edge, 0.035);
    group.add(route);
    return route;
  });
  const counter = createTextLabel(tracker, {
    text: "20 MORE PRIVATE APP ISLANDS", width: 7.2, height: 0.55,
    color: FACTORY_PALETTE.white, background: FACTORY_PALETTE.ink,
    position: [0, 0.3, 10.2], fontSize: 46,
  });
  group.add(counter);
  return { group, bases, cores, labels, routes, counter };
}

export function createFactoryWorld() {
  const tracker = createResourceTracker();
  const group = new THREE.Group();
  group.name = "factory-world";
  group.userData.recommendedWorldOffset = Object.freeze({
    x: FACTORY_LAYOUT.recommendedWorldOffset.x,
    y: FACTORY_LAYOUT.recommendedWorldOffset.y,
    z: FACTORY_LAYOUT.recommendedWorldOffset.z,
  });

  const builder = createBuilderScene(tracker, false);
  const inert = createBuilderScene(tracker, true);
  const compiler = createCompilerScene(tracker);
  const feedback = createFeedbackScene(tracker);
  const twins = createTwinScene(tracker);
  const proof = createProofScene(tracker);
  const guard = createGuardScene(tracker);
  const approval = createApprovalScene(tracker);
  const running = createPlayer(tracker);
  const compact = createCompactScene(tracker);
  const archipelago = createArchipelagoScene(tracker);
  const scenes = { builder, inert, compiler, feedback, twins, proof, guard, approval, running, compact, archipelago };
  Object.entries(scenes).forEach(([id, scene]) => {
    scene.group.name = `factory-${id}`;
    group.add(scene.group);
  });

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();

  function setTime(nextTime) {
    const time = Math.min(120, Math.max(0, Number.isFinite(nextTime) ? nextTime : 0));
    Object.entries(scenes).forEach(([id, scene]) => showScene(scene.group, time, FACTORY_SCENES[id]));

    // Foundation owns the canonical Builder Deck, source material and
    // workpiece. Factory contributes only the tools on that right-hand deck.
    builder.group.visible = false;
    inert.group.visible = false;
    compiler.deck.group.visible = false;

    const deckRise = smootherstep(interval(time, 25.25, 28.45));
    builder.group.position.y = -2.8 + deckRise * 2.8;
    builder.hatch.scale.setScalar(0.72 + deckRise * 0.28);
    builder.inputDoor.hinge.rotation.y = -smootherstep(interval(time, 27.4, 29.2)) * Math.PI * 0.62;
    builder.outputDoor.hinge.rotation.y = 0;
    builder.keyLabels[0].visible = time >= 30.2 && time <= 31.1;
    builder.keyLabels[1].visible = time >= 31.95 && time <= 32.85;

    const materialProgress = smootherstep(interval(time, 33.2, 39.8));
    inert.sourceA.position.x = -5.7 + materialProgress * 5.7;
    inert.sourceA.position.z = 2.9 - materialProgress * 2.9;
    inert.sourceB.position.x = -3.9 + materialProgress * 3.9;
    inert.sourceB.position.z = 3.6 - materialProgress * 3.6;
    inert.sourceA.scale.setScalar(1 - materialProgress * 0.42);
    inert.sourceB.scale.setScalar(1 - materialProgress * 0.42);
    inert.workpiece.scale.setScalar(0.25 + materialProgress * 0.75);
    inert.workpiece.rotation.y = materialProgress * Math.PI * 0.5;

    const compileProgress = smootherstep(interval(time, 41, 48));
    compiler.machines.forEach((machine, index) => {
      const lane = FACTORY_LANES[index];
      const reveal = smootherstep(interval(time, lane.revealAt, lane.revealAt + 0.82));
      machine.group.visible = reveal > 0.001;
      machine.group.scale.setScalar(lane.scale * Math.max(0.001, reveal));
      machine.group.position.y = -0.48 * (1 - reveal);
      machine.status.rotation.z = time * (0.55 + index * 0.15);
      machine.aperture.scale.x = 0.25 + compileProgress * 0.75;
      position.set(lane.x, 0.75 + Math.sin((time + index) * 2.2) * 0.08, lane.z + 2.5 - compileProgress * 2.5);
      scale.setScalar(0.35 + compileProgress * 0.65);
      matrix.compose(position, quaternion, scale);
      compiler.tokens.setMatrixAt(index, matrix);
    });
    const firstCompile = smootherstep(interval(time, 42.25, 46));
    const secondCompile = smootherstep(interval(time, 53.25, 55.4));
    const thirdCompile = smootherstep(interval(time, 67.5, 69.35));
    const verifierSecond = smootherstep(interval(time, 57.8, 60.8));
    const verifierThird = smootherstep(interval(time, 71.2, 75.6));
    const machineProgress = [
      time < 52.55 ? firstCompile : time < 66.95 ? secondCompile : thirdCompile,
      time < 66.95 ? verifierSecond : verifierThird,
      smootherstep(interval(time, 79.8, 86.2)),
    ];
    compiler.machines.forEach((machine, index) => {
      const value = machineProgress[index];
      machine.progressFill.scale.x = Math.max(0.001, value);
      machine.progressFill.position.x = -0.84 + value * 0.84;
      machine.glow.visible = value > 0.02;
      machine.glow.scale.setScalar(0.96 + pulse(time, 41 + index, 80) * 0.05);
    });
    const uiStarts = [40.6, 42.6, Number.POSITIVE_INFINITY];
    compiler.machines.forEach((machine, index) => {
      const uiVisible = time >= uiStarts[index];
      machine.progressRail.visible = uiVisible;
      machine.progressFill.visible = uiVisible;
      machine.progressCaption.visible = uiVisible;
      if (machine.versionCaption) machine.versionCaption.visible = uiVisible;
    });
    compiler.sceneCaption.visible = time >= 41;
    compiler.tokens.visible = time >= 41;
    // The canonical source-file route lives in Foundation so direct seeks and
    // reverse scrubbing cannot reveal a second, offset transport line.
    compiler.materialRoute.visible = false;
    const compilerCopy = time < 42.25
      ? "READY · ROUND 0/3"
      : time < 46
        ? `COMPILING · ROUND 1/3 · ${Math.round(firstCompile * 100)}%`
        : time < 52.55
          ? "FAILED · ROUND 1/3 · DIAG 01"
          : time < 53.25
            ? "READY · ROUND 2/3"
            : time < 55.4
              ? `COMPILING · ROUND 2/3 · ${Math.round(secondCompile * 100)}%`
              : time < 66.95
                ? "PASSED · ROUND 2/3"
                : time < 69.35
                  ? `COMPILING · ROUND 3/3 · ${Math.round(thirdCompile * 100)}%`
                  : "PASSED · ROUND 3/3";
    const verifierCopy = time < 57.8
      ? "READY · NEXT ROUND 2/3"
      : time < 60.8
        ? `CHECKING · ROUND 2/3 · ${Math.round(verifierSecond * 100)}%`
        : time < 66.95
          ? "FAILED · ROUND 2/3 · DIAG 02"
          : time < 71.2
            ? "READY · NEXT ROUND 3/3"
            : time < 75.6
              ? `CHECKING · ROUND 3/3 · ${Math.round(verifierThird * 100)}%`
              : "PASSED · ROUND 3/3";
    setLabelText(compiler.machines[0].progressCaption, compilerCopy);
    setLabelText(compiler.machines[1].progressCaption, verifierCopy);
    setLabelText(
      compiler.sceneCaption,
      time < 52
        ? "ROUND 1/3 · COMPILER GATE · Cargo.lock missing · BUILD STOPPED · DIAGNOSTIC 01 → AGENT · EDIT 01 RETURNS"
        : time < 62
          ? "ROUND 2/3 · COMPILER PASSES · PRÜFER FINDS BYTE DRIFT · BUILD STOPPED · DIAGNOSTIC 02 → AGENT"
          : time < 72
            ? "EDIT 02 RETURNS · ROUND 3/3 · COMPILER PASSES · PRÜFER RUNS A/B · SAME INPUT · TWIN BUILDS · ONE TRUTH"
            : "HARNESS TEST · SHADOW WORLD COMPLETE · TEST PASSED · SIGNED REPORT EMITTED · REPORT → GUARD · LIVE DOOR STAYS SEALED",
    );
    compiler.upgrades[0].visible = time >= 52;
    compiler.upgrades[1].visible = time >= 70;
    compiler.upgrades[2].visible = time >= 77;
    compiler.tokens.instanceMatrix.needsUpdate = true;

    const fixProgress = smootherstep(interval(time, 54, 60));
    const fixAngle = fixProgress * Math.PI * 2;
    feedback.fix.position.set(Math.cos(fixAngle) * 4, 2 + Math.sin(fixAngle) * 2.6, 0.65);
    feedback.errorBars.forEach((bar, index) => { bar.scale.x = Math.max(0.001, 1 - fixProgress * (0.72 + index * 0.06)); });
    feedback.cards.forEach((card, index) => {
      const reveal = smootherstep(interval(time, 55 + index * 0.42, 55.32 + index * 0.42));
      card.scale.setScalar(Math.max(0.001, reveal));
    });
    feedback.terminal.rotation.z = -pulse(time, 52.2, 53.5) * 0.035;

    const twinProgress = smootherstep(interval(time, 63, 69.5));
    twins.pods[0].position.x = -5 + twinProgress * 1.8;
    twins.pods[1].position.x = 5 - twinProgress * 1.8;
    twins.seal.scale.setScalar(0.5 + twinProgress * 0.5);
    twins.seal.rotation.z = time * 0.7;
    twins.progressRails.forEach((fill) => {
      fill.scale.x = Math.max(0.001, twinProgress);
    });
    twins.hashPlates[1].visible = time >= 60.3;
    twins.hashPlates[0].visible = time >= 60.3;
    setLabelText(
      twins.resultLabel,
      time >= 74 ? "EQUAL" : time >= 60.8 && time < 66.95 ? "RED · BYTE DRIFT" : "BUILDING A/B",
    );

    const proofProgress = smootherstep(interval(time, 73, 78.5));
    proof.subject.position.y = 1.35 + Math.sin(proofProgress * Math.PI * 5) * (1 - proofProgress) * 0.45;
    proof.subject.rotation.y = proofProgress * Math.PI * 2;
    proof.spikes.rotation.y = -time * 0.35;
    proof.entryDoor.hinge.rotation.y = -smootherstep(interval(time, 72.3, 73.1)) * Math.PI * 0.72;
    proof.mockDoors.forEach((door, index) => {
      door.hinge.rotation.y = -Math.sin(proofProgress * Math.PI * (1.3 + index * 0.2)) * 0.35;
    });
    proof.attacks.forEach(({ impact }, index) => {
      const attackPulse = 0.65 + pulse(time, 73 + index * 0.5, 78.5) * 0.85;
      impact.scale.setScalar(attackPulse);
    });

    const guardProgress = smootherstep(interval(time, 80.5, 87));
    guard.orbitRings.forEach((ring, index) => {
      ring.rotation.x = Math.PI / 2 + Math.sin(time * 0.5 + index) * 0.25;
      ring.rotation.y = time * (0.12 + index * 0.035);
      ring.scale.setScalar(0.45 + guardProgress * 0.55);
    });
    [79.8, 80.7, 81.55, 84.55].forEach((at, index) => {
      const attached = smootherstep(interval(time, at, at + 0.42));
      guard.checklist[index].material.color.setHex(attached >= 0.5 ? FACTORY_PALETTE.green : FACTORY_PALETTE.red);
      guard.checklist[index].scale.setScalar(0.72 + attached * 0.28);
    });
    const gateProgress = smootherstep(interval(time, 84.55, 85.25));
    guard.liveDoor.hinge.rotation.y = -gateProgress * Math.PI * 0.72;
    guard.machine.progressFill.scale.x = Math.max(0.001, guardProgress);
    guard.machine.progressFill.position.x = -0.84 + guardProgress * 0.84;
    guard.machine.glow.visible = gateProgress > 0;
    setLabelText(guard.gateStatus, gateProgress >= 1 ? "GUARD · LIVE DOOR UNLOCKED" : "GUARD · WAITING FOR REPORT");

    const openProgress = smootherstep(interval(time, 90, 94));
    approval.leftDoor.position.x = -1.6 - openProgress * 3.15;
    approval.rightDoor.position.x = 1.6 + openProgress * 3.15;
    approval.approval.scale.setScalar(0.5 + smootherstep(interval(time, 88, 91)) * 0.5);
    approval.approval.rotation.z = time * 0.8;
    approval.domainDoors.forEach((door) => {
      door.hinge.rotation.y = -smootherstep(interval(time, 92.35, 93.55)) * Math.PI * 0.7;
    });

    const runProgress = smootherstep(interval(time, 96, 104));
    running.group.position.x = -7 + runProgress * 14;
    running.group.position.y = 0.2 + Math.abs(Math.sin(runProgress * Math.PI * 6)) * 0.7;
    running.bars.forEach((bar, index) => setYScale(bar, 0.45 + (Math.sin(time * 4 + index) + 1) * 0.35));

    const compactProgress = smootherstep(interval(time, 106, 111));
    compact.wall.scale.setScalar(1 - compactProgress * 0.18);
    compact.wall.rotation.z = time * 0.2;
    compact.player.group.rotation.y = compactProgress * Math.PI * 2;

    const islandProgress = smootherstep(interval(time, 112, 119));
    FACTORY_ISLANDS.forEach((island, index) => {
      const delay = index / FACTORY_ISLANDS.length * 0.42;
      const reveal = smootherstep(Math.max(0, Math.min(1, (islandProgress - delay) / 0.58)));
      position.set(island.x * reveal, island.height * 0.28 * reveal, island.z * reveal);
      scale.setScalar(Math.max(0.001, reveal));
      matrix.compose(position, quaternion, scale);
      archipelago.bases.setMatrixAt(index, matrix);
      position.y = 0.75 * reveal + island.height * 0.5;
      scale.set(0.6 + reveal * 0.4, Math.max(0.001, island.height * reveal), 0.6 + reveal * 0.4);
      matrix.compose(position, quaternion, scale);
      archipelago.cores.setMatrixAt(index, matrix);
      archipelago.labels[index].position.set(
        island.x * reveal,
        1.55 * reveal + island.height,
        island.z * reveal + 0.7,
      );
      archipelago.labels[index].scale.setScalar(Math.max(0.001, reveal));
    });
    archipelago.bases.instanceMatrix.needsUpdate = true;
    archipelago.cores.instanceMatrix.needsUpdate = true;
    archipelago.group.rotation.y = Math.sin(interval(time, 112, 120) * Math.PI) * 0.06;
    group.traverse((object) => object.userData.setRouteTime?.(time));
    return time;
  }

  setTime(0);
  return {
    group,
    setTime,
    dispose() {
      group.removeFromParent();
      tracker.dispose();
    },
  };
}
