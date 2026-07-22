import * as THREE from "three";
import {
  FACTORY_ISLANDS,
  FACTORY_LANES,
  FACTORY_LAYOUT,
  FACTORY_PALETTE,
  FACTORY_SCENES,
} from "./config.js";
import {
  interval,
  pulse,
  showScene,
  smoothstep,
  smootherstep,
} from "./timeline.js";
import {
  createFlatMaterial,
  createResourceTracker,
  createRing,
  createRoute,
  createTextLabel,
  createVectorBox,
} from "./primitives.js";
import {
  createWorkshopChecklist,
  createWorkshopConsole,
  createWorkshopMachine,
  setWorkshopConsole,
} from "./workshop-primitives.js";
import {
  createGuardStatusPanel,
  createTwinVerifierPanel,
  createVerifierVerdict,
  setGuardStatusPanel,
  setTwinVerifierPanel,
  setVerifierVerdict,
} from "./feedback-primitives.js";
import { createApprovalSequence } from "./approval-sequence.js";
import { createFactoryDoor as createDoor } from "./door-primitives.js";
import { createLiveSequence } from "./live-sequence.js";

const setYScale = (object, scale) => {
  object.scale.y = Math.max(0.001, scale);
};

const setLabelText = (label, text) => label.userData.setText?.(text);

function setFactoryOpacity(root, opacity) {
  const value = THREE.MathUtils.clamp(opacity, 0, 1);
  root.visible = value > 0.001;
  root.traverse((object) => {
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (material.userData.factoryBaseOpacity === undefined) {
        material.userData.factoryBaseOpacity = material.opacity;
      }
      const baseOpacity = material.userData.factoryBaseOpacity;
      material.transparent = material.userData.preserveTransparency || baseOpacity < 0.999 || value < 0.999;
      material.opacity = baseOpacity * value;
    });
  });
}

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
  const machines = FACTORY_LANES.map((lane) => createWorkshopMachine(tracker, lane));
  machines.forEach(({ group: machine }) => group.add(machine));
  const compilerConsole = createWorkshopConsole(tracker, {
    position: [1.555, 5.5, 3.423],
    width: 3.2,
    initialCopy: "READY · ROUND 0/3",
    version: "rustc 1.83.0-dev · NO NET",
  });
  const verifierConsole = createWorkshopConsole(tracker, {
    position: [1.984, 3.2, -2.803],
    width: 3,
    initialCopy: "READY · NEXT ROUND 2/3",
  });
  const checklist = createWorkshopChecklist(tracker);
  const twinConsole = createTwinVerifierPanel(tracker);
  const verifierVerdict = createVerifierVerdict(tracker);
  group.add(
    compilerConsole.group,
    verifierConsole.group,
    checklist.group,
    twinConsole.group,
    verifierVerdict.group,
  );
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
    { text: "LOCK CACHE", x: -3, y: -0.35, z: 4.9, width: 2.55, height: 0.56 },
    { text: "BYTE JIG", x: 3.25, y: 2.65, z: -2.4, width: 1.55, height: 0.4 },
    { text: "DRILL KIT", x: 4.1, y: 1.8, z: -2.4, width: 1.55, height: 0.4 },
  ].map(({ text, x, y, z, width, height }) => createTextLabel(tracker, {
    text, width, height, color: 0xa9c8e9,
    background: FACTORY_PALETTE.panel, position: [x, y, z], fontSize: 46, billboard: true,
  }));
  group.add(materialRoute, sceneCaption, ...upgrades);
  return {
    group,
    deck,
    machines,
    compilerConsole,
    verifierConsole,
    checklist,
    twinConsole,
    verifierVerdict,
    materialRoute,
    sceneCaption,
    upgrades,
  };
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
    size: [1.5, 1.2, 1.5], color: 0x171125,
    edgeColor: 0xc28bff, position: [0, 1.35, 0],
  });
  subject.add(createTextLabel(tracker, {
    text: "PLAYER.WASM · GHOST COPY", width: 2.6, height: 0.38,
    color: 0xe7d6fa, background: 0x12091e, position: [0, 0.85, 0.78], fontSize: 42, billboard: true,
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
    color: 0xdcc3f6, background: 0x130b1c, position: [0, 4.15, 0], fontSize: 52, billboard: true,
  });
  entryDoor.group.add(entryLabel);
  const mockDoors = [-3.7, -1.8, 0.1].map((x, index) => {
    const door = createDoor(tracker, 0xc28bff, [x, 0.76, 2.55 + index * 0.15], 0.4);
    door.group.rotation.y = Math.PI / 7;
    const label = createTextLabel(tracker, {
      text: ["fb.mock", "input.inject", "file.sandbox"][index],
      width: 2.2, height: 0.36, color: 0xdcc3f6, background: 0x130b1c,
      position: [0, 4.15, 0], fontSize: 44, billboard: true,
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
    const route = createRoute(tracker, points, FACTORY_PALETTE.red, 0.035);
    const impact = new THREE.Group();
    impact.position.set(...points[1]);
    [0, Math.PI / 4, Math.PI / 2, -Math.PI / 4].forEach((rotation) => {
      const ray = createVectorBox(tracker, {
        size: [1.05, 0.055, 0.055],
        color: 0xff8b85,
        position: [0, 0, 0],
      });
      ray.rotation.y = rotation;
      impact.add(ray);
    });
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
  const approvalSequence = createApprovalSequence(tracker, {
    guardMachine: compiler.machines[2],
    guardChecklist: compiler.checklist,
  });
  const liveSequence = createLiveSequence(tracker);
  const feedback = createFeedbackScene(tracker);
  const twins = createTwinScene(tracker);
  const proof = createProofScene(tracker);
  proof.group.position.set(-12.32, 0.04, 0);
  proof.spikes.visible = false;
  const guard = createGuardScene(tracker);
  const guardStatus = createGuardStatusPanel(tracker);
  const approval = createApprovalScene(tracker);
  const running = createPlayer(tracker);
  const compact = createCompactScene(tracker);
  const archipelago = createArchipelagoScene(tracker);
  const scenes = { builder, inert, compiler, feedback, twins, proof, guard, approval, running, compact, archipelago };
  Object.entries(scenes).forEach(([id, scene]) => {
    scene.group.name = `factory-${id}`;
    group.add(scene.group);
  });
  group.add(guardStatus.group, approvalSequence.group, liveSequence.group);

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
    // The old feedback scene is not a separate world. It is the same Builder
    // Deck with a new workpiece pass, a verifier console and a disposable scan.
    feedback.group.visible = false;
    twins.group.visible = false;
    // The placeholder orbital Guard is not part of the reference film. The
    // persistent workshop Guard remains the canonical machine.
    guard.group.visible = false;
    approval.group.visible = false;
    running.group.visible = false;
    compact.group.visible = false;

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

    compiler.machines.forEach((machine, index) => {
      const lane = FACTORY_LANES[index];
      const reveal = smootherstep(interval(time, lane.revealAt, lane.revealAt + 1));
      machine.group.visible = reveal > 0.001;
      machine.group.scale.setScalar(lane.scale * Math.max(0.001, reveal));
      machine.group.position.y = lane.baseY - 1.3 * (1 - reveal);
      machine.status.scale.setScalar(0.88 + Math.sin(time * 3.2 + index) * 0.12);
    });
    [79.8, 80.7, 81.55, 84.55].forEach((at, index) => {
      compiler.checklist.badges[index].userData.setPassed?.(time >= at);
    });
    const firstCompile = smoothstep(interval(time, 42.25, 46));
    const secondCompile = smoothstep(interval(time, 53.25, 55.4));
    const thirdCompile = smoothstep(interval(time, 67.5, 69.35));
    const verifierSecond = smoothstep(interval(time, 57.8, 60.8));
    const verifierThird = smoothstep(interval(time, 71.2, 75.6));
    const machineProgress = [
      time < 52.55 ? firstCompile : time < 66.95 ? secondCompile : thirdCompile,
      time < 66.95 ? verifierSecond : verifierThird,
      smootherstep(interval(time, 79.8, 86.2)),
    ];
    const compilerConsoleIntro = smootherstep(interval(time, 40.6, 40.9));
    compiler.compilerConsole.group.visible = compilerConsoleIntro > 0.001;
    compiler.compilerConsole.group.scale.setScalar(Math.max(0.001, compilerConsoleIntro));
    const verifierConsoleIntro = smootherstep(interval(time, 42.6, 42.9));
    compiler.verifierConsole.group.visible = verifierConsoleIntro > 0.001;
    compiler.verifierConsole.group.scale.setScalar(Math.max(0.001, verifierConsoleIntro));
    compiler.checklist.group.visible = time >= 42.9;
    compiler.sceneCaption.visible = false;
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
                : time < 67.5
                  ? "READY · ROUND 3/3"
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
    setWorkshopConsole(
      compiler.compilerConsole,
      machineProgress[0],
      compilerCopy,
      time >= 46 && time < 52.55 ? "failed" : time >= 55.4 && time < 66.95 ? "passed" : "building",
    );
    setWorkshopConsole(
      compiler.verifierConsole,
      machineProgress[1],
      verifierCopy,
      time >= 60.8 && time < 66.95 ? "failed" : time >= 75.6 ? "passed" : "building",
    );
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
    const lockCacheRise = smootherstep(interval(time, 52, 53.2));
    compiler.upgrades[0].visible = lockCacheRise > 0.001;
    compiler.upgrades[0].position.y = -0.85 + lockCacheRise * 0.5;
    compiler.upgrades[0].scale.set(2.55, Math.max(0.001, 0.56 * lockCacheRise), 1);
    const byteJigRise = smootherstep(interval(time, 70, 71.2));
    compiler.upgrades[1].visible = byteJigRise > 0.001;
    compiler.upgrades[1].position.y = 2.15 + byteJigRise * 0.5;
    compiler.upgrades[1].scale.set(1.55, Math.max(0.001, 0.4 * byteJigRise), 1);
    const drillKitRise = smootherstep(interval(time, 77, 78.2));
    compiler.upgrades[2].visible = drillKitRise > 0.001;
    compiler.upgrades[2].position.y = 1.3 + drillKitRise * 0.5;
    compiler.upgrades[2].scale.set(1.55, Math.max(0.001, 0.4 * drillKitRise), 1);
    const compilerBody = compiler.machines[0].body;
    compilerBody.position.set(0, 0, 0);
    compilerBody.rotation.set(0, 0, 0);
    compilerBody.scale.set(1, 1, 1);
    const activeCompileWindow = [[42.25, 46], [53.25, 55.4], [67.5, 69.35]]
      .find(([start, end]) => time >= start && time < end);
    if (activeCompileWindow) {
      const [compileStart, compileEnd] = activeCompileWindow;
      const rampIn = smootherstep(interval(time, compileStart, compileStart + 0.16));
      const rampOut = 1 - smootherstep(interval(time, compileEnd - 0.12, compileEnd));
      const strength = Math.min(rampIn, rampOut);
      compilerBody.position.x = (Math.sin(time * Math.PI * 25.4)
        + Math.sin(time * Math.PI * 41.8) * 0.42) * 0.025 * strength;
      compilerBody.position.y = (Math.sin(time * Math.PI * 31.2 + 0.8)
        + Math.sin(time * Math.PI * 18.6) * 0.36) * 0.018 * strength;
      compilerBody.rotation.z = Math.sin(time * Math.PI * 22.8 + 1.3) * 0.012 * strength;
    }
    if (time >= 45.24 && time < 45.43) {
      const crouch = smootherstep(interval(time, 45.24, 45.43));
      compilerBody.position.y = -0.08 * crouch;
      compilerBody.scale.set(1 + 0.06 * crouch, 1 - 0.14 * crouch, 1 + 0.06 * crouch);
    } else if (time >= 45.43 && time < 45.68) {
      const launch = smootherstep(interval(time, 45.43, 45.68));
      compilerBody.position.y = THREE.MathUtils.lerp(-0.08, 3.6, launch);
      compilerBody.scale.set(THREE.MathUtils.lerp(1.06, 0.98, launch), THREE.MathUtils.lerp(0.86, 1.04, launch), 1);
    } else if (time >= 45.68 && time < 46) {
      const fall = interval(time, 45.68, 46);
      compilerBody.position.y = THREE.MathUtils.lerp(3.6, 2.4, fall * fall);
      compilerBody.rotation.z = Math.sin(fall * Math.PI) * 0.015;
    } else if (time >= 46 && time < 46.18) {
      const impact = interval(time, 46, 46.18);
      const impactPulse = Math.sin(impact * Math.PI);
      compilerBody.position.y = 2.4 + impactPulse * 0.08;
      compilerBody.scale.set(1 + 0.12 * impactPulse, 1 - 0.17 * impactPulse, 1 + 0.08 * impactPulse);
    } else if (time >= 46.18 && time < 46.72) {
      const settle = interval(time, 46.18, 46.72);
      const returnEase = smootherstep(settle);
      const rebound = Math.sin(settle * Math.PI) * (1 - settle);
      compilerBody.position.y = THREE.MathUtils.lerp(2.4, 0, returnEase) + rebound * 0.35;
      compilerBody.scale.set(1 - 0.035 * rebound, 1 + 0.05 * rebound, 1);
    }

    const compilerJoyWindow = [[55.4, 56.05], [69.35, 70]]
      .find(([start, end]) => time >= start && time < end);
    if (compilerJoyWindow) {
      const joy = interval(time, compilerJoyWindow[0], compilerJoyWindow[1]);
      const hop = Math.sin(joy * Math.PI);
      const wiggle = Math.sin(joy * Math.PI * 4) * (1 - joy);
      compilerBody.position.y = hop * 0.2;
      compilerBody.rotation.z = THREE.MathUtils.degToRad(2.2 * wiggle);
      compilerBody.scale.set(1 - 0.045 * hop, 1 + 0.065 * hop, 1);
    }

    const twinPanelIntro = smootherstep(interval(time, 57.6, 57.95));
    const twinResult = time >= 60.8 && time < 66.95
      ? "RED · BYTE DRIFT"
      : time >= 74
        ? "EQUAL"
        : time >= 71.2
          ? "BUILDING A/B"
          : "WAITING";
    setTwinVerifierPanel(compiler.twinConsole, {
      progress: time < 66.95 ? verifierSecond : verifierThird,
      hashesVisible: time >= 60.3,
      result: twinResult,
      drills: [time >= 72.8, time >= 74.2, time >= 75.6],
      opacity: twinPanelIntro,
    });
    setVerifierVerdict(compiler.verifierVerdict, time);
    const guardStatusAlpha = smootherstep(interval(time, 78, 78.3))
      * (1 - smoothstep(interval(time, 87.7, 88)));
    const guardStatusCopy = time < 79.8
      ? "GUARD · WAITING FOR TEST REPORT"
      : time < 80.7
        ? "REPORT OK · MATCHING EXACT HASH"
        : time < 81.55
          ? "HASH OK · CHECKING EXACT RIGHTS"
          : time < 84.55
            ? "RIGHTS OK · OWNER CONSENT"
            : time < 85.25
              ? "ALL BINDINGS MATCH · OPENING"
              : "GUARD · LIVE DOOR OPEN";
    setGuardStatusPanel(guardStatus, guardStatusCopy, guardStatusAlpha);
    approvalSequence.setTime(time);
    liveSequence.setTime(time);
    const compilerWindow = time >= FACTORY_SCENES.compiler.start && time < FACTORY_SCENES.compiler.end;
    const workshopAlpha = compilerWindow
      ? 1 - smootherstep(interval(time, 92.75, 94.05))
      : 0;
    setFactoryOpacity(compiler.group, workshopAlpha);

    const scanWindow = time >= 57.8 && time < 60.8
      ? [57.8, 60.8]
      : time >= 71.2 && time < 75.6
        ? [71.2, 75.6]
        : null;
    const scanIntro = scanWindow ? smootherstep(interval(time, scanWindow[0], scanWindow[0] + 0.55)) : 0;
    const scanOutro = scanWindow ? 1 - smootherstep(interval(time, scanWindow[1] - 0.42, scanWindow[1])) : 0;
    const scanAlpha = scanIntro * scanOutro;
    const scanProgress = scanWindow ? interval(time, scanWindow[0], scanWindow[1]) : 0;
    setFactoryOpacity(proof.group, scanAlpha * 0.72);
    proof.group.position.y = 0.04 - (1 - scanIntro) * 0.42;
    proof.group.scale.setScalar(0.93 + scanIntro * 0.07);
    const shadowDoorIntro = scanWindow
      ? smootherstep(interval(time, scanWindow[0] + 0.22, scanWindow[0] + 0.72))
      : 0;
    proof.entryDoor.group.visible = shadowDoorIntro * scanOutro > 0.001;
    proof.entryDoor.group.scale.setScalar(0.42 * Math.max(0.001, shadowDoorIntro * scanOutro));
    // The reference entrance grows in place; its vector leaf never swings
    // toward an edge-on camera angle during the scan.
    proof.entryDoor.hinge.rotation.y = 0;
    const shadowEntry = scanWindow
      ? smootherstep(interval(time, scanWindow[0] + 0.48, Math.min(scanWindow[0] + 1.58, scanWindow[1] - 0.72)))
      : 0;
    const shadowPlayerIntro = scanWindow
      ? smootherstep(interval(time, scanWindow[0] + 0.4, scanWindow[0] + 0.68))
      : 0;
    proof.subject.visible = shadowPlayerIntro * scanOutro > 0.001;
    const shadowPoint = proof.entryRoute.userData.curve.getPointAt(shadowEntry);
    proof.subject.position.copy(shadowPoint);
    proof.subject.position.y += 0.2 + (shadowEntry >= 0.999 ? Math.sin(time * Math.PI * 2.1) * 0.05 : 0);
    proof.subject.scale.setScalar(0.82 - shadowEntry * 0.1);
    const attackIntro = scanWindow
      ? smootherstep(interval(time, scanWindow[0] + 1.28, Math.min(scanWindow[0] + 1.72, scanWindow[1] - 0.48)))
      : 0;
    proof.attacks.forEach(({ route, impact }, index) => {
      route.visible = attackIntro * scanOutro > 0.001;
      impact.visible = route.visible;
      impact.scale.setScalar(0.78 + Math.max(0, Math.sin((time - (scanWindow?.[0] ?? 0)) * 8.6 - index * 1.75)) * 0.42);
    });

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
