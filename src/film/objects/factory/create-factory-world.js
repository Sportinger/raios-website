import * as THREE from "three";
import {
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
  createResourceTracker,
  createRing,
  createRoute,
  createTextLabel,
  createVectorBox,
} from "./primitives.js";
import { createWorkshopMachine } from "./workshop-primitives.js";
import {
  createTwinVerifierPanel,
  createVerifierVerdict,
  setTwinVerifierPanel,
  setVerifierVerdict,
} from "./feedback-primitives.js";
import { createApprovalSequence } from "./approval-sequence.js";
import { createArchipelagoSequence } from "./archipelago-sequence.js";
import {
  createFactoryDoorOnSurface,
  setFactoryDoorOpen,
} from "./door-primitives.js";
import { createLiveSequence } from "./live-sequence.js";
import { createShadowVmSequence } from "./shadow-vm-sequence.js";
import {
  cableSurfacePoint,
  VECTOR_CABLE_DIRECTIONS,
} from "../shared/vector-cable.js";
import {
  setVectorMachineBuild,
  setVectorMachineLampStates,
  setVectorMachineProgress,
} from "../shared/vector-machine.js";

const setLabelText = (label, text) => label.userData.setText?.(text);

function setFactoryOpacity(root, opacity) {
  const value = THREE.MathUtils.clamp(opacity, 0, 1);
  root.visible = value > 0.001;
  root.traverse((object) => {
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (material.userData.factoryBaseOpacity === undefined) {
        material.userData.factoryBaseOpacity = material.userData.vectorMachineBaseOpacity
          ?? material.userData.vectorLayerBaseOpacity
          ?? material.opacity;
      }
      const baseOpacity = material.userData.factoryBaseOpacity;
      material.transparent = material.userData.preserveTransparency || baseOpacity < 0.999 || value < 0.999;
      material.opacity = baseOpacity * value;
    });
  });
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
  const deckSurface = Object.freeze({
    id: "factory-deck",
    color: FACTORY_PALETTE.panel,
    centerX: 0,
    centerZ: 0,
    width: deckLayout.width,
    depth: deckLayout.depth,
    top: deckLayout.thickness,
  });
  const inputDoor = createFactoryDoorOnSurface(tracker, FACTORY_PALETTE.cyan, {
    surface: deckSurface,
    edge: FACTORY_LAYOUT.inputDoor.edge,
    along: FACTORY_LAYOUT.inputDoor.along,
  });
  const outputDoor = createFactoryDoorOnSurface(tracker, FACTORY_PALETTE.green, {
    surface: deckSurface,
    edge: FACTORY_LAYOUT.outputDoor.edge,
    along: FACTORY_LAYOUT.outputDoor.along,
    label: "/out",
    labelColor: FACTORY_PALETTE.amber,
  });
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
    cableSurfacePoint(deckSurface, -5.7, 2.9),
    cableSurfacePoint(deckSurface, -2.8, 2),
    cableSurfacePoint(deckSurface, 0, 0),
    cableSurfacePoint(deckSurface, 3.2, -1.2),
    cableSurfacePoint(deckSurface, 6.1, -2.7),
  ], inert ? FACTORY_PALETTE.amber : FACTORY_PALETTE.cyan, 0.065);
  group.add(hatch, title, caption, ...keyLabels, inputDoor.group, outputDoor.group, sourceA, sourceB, workpiece, route);
  return {
    group,
    deck,
    hatch,
    caption,
    keyLabels,
    inputDoor,
    outputDoor,
    sourceA,
    sourceB,
    workpiece,
    route,
    supportSurface: deckSurface,
  };
}

function createCompilerScene(tracker) {
  const group = new THREE.Group();
  const deck = createBuilderScene(tracker, true);
  group.add(deck.group);
  const machines = FACTORY_LANES.map((lane) => createWorkshopMachine(tracker, lane));
  machines.forEach(({ group: machine }) => group.add(machine));
  const twinConsole = createTwinVerifierPanel(tracker);
  const verifierVerdict = createVerifierVerdict(tracker);
  group.add(
    twinConsole.group,
    verifierVerdict.group,
  );
  const materialRoute = createRoute(tracker, [
    cableSurfacePoint(deck.supportSurface, -3.2, 2.7),
    cableSurfacePoint(deck.supportSurface, -1.4, 2.2),
    cableSurfacePoint(deck.supportSurface, 0, 1.6),
    cableSurfacePoint(deck.supportSurface, 2.55, -1.2),
    cableSurfacePoint(deck.supportSurface, -2.2, -1.55),
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
  const bridge = createRoute(
    tracker,
    [[-1.1, 1.2, 0], [0, 2, 0], [1.1, 1.2, 0]],
    FACTORY_PALETTE.green,
    0.14,
    { direction: VECTOR_CABLE_DIRECTIONS.bidirectional },
  );
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
  });
  const liveSequence = createLiveSequence(tracker);
  const archipelagoSequence = createArchipelagoSequence(tracker);
  const feedback = createFeedbackScene(tracker);
  const twins = createTwinScene(tracker);
  const proof = createShadowVmSequence(tracker);
  const scenes = { builder, inert, compiler, feedback, twins, proof };
  Object.entries(scenes).forEach(([id, scene]) => {
    scene.group.name = `factory-${id}`;
    group.add(scene.group);
  });
  group.add(
    proof.callout.group,
    approvalSequence.group,
    liveSequence.group,
    archipelagoSequence.group,
  );

  function setTime(nextTime, camera) {
    const time = Math.min(134, Math.max(0, Number.isFinite(nextTime) ? nextTime : 0));
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
    const deckRise = smootherstep(interval(time, 25.25, 28.45));
    builder.group.position.y = -2.8 + deckRise * 2.8;
    builder.hatch.scale.setScalar(0.72 + deckRise * 0.28);
    setFactoryDoorOpen(builder.inputDoor, smootherstep(interval(time, 27.4, 29.2)));
    setFactoryDoorOpen(builder.outputDoor, 0);
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
      const outline = smootherstep(interval(time, lane.revealAt, lane.revealAt + 0.36));
      const rise = smootherstep(interval(time, lane.revealAt + 0.36, lane.revealAt + 1));
      machine.group.scale.setScalar(lane.scale);
      machine.group.position.y = machine.supportSurface.top;
      setVectorMachineBuild(machine, {
        outlineAmount: outline,
        riseAmount: rise,
        outlineOpacity: 1 - smootherstep(interval(
          time,
          lane.revealAt + 0.36,
          lane.revealAt + 0.72,
        )),
      });
    });
    const verifierSecond = smoothstep(interval(time, 57.8, 60.8));
    const activeCompileWindow = [[42.25, 46], [53.25, 55.4], [67.5, 69.35]]
      .find(([start, end]) => time >= start && time < end);
    const activeTestWindow = [[57.8, 60.8], [71.2, 77], [78, 84.5], [85.5, 93.2]]
      .find(([start, end]) => time >= start && time < end);
    const compilerLampState = time >= 46 && time < 53.25
      ? "failed"
      : time >= 67.5 && time < 69.35
        ? "pending"
        : time >= 55.4
          ? "passed"
          : "pending";
    const testerLampState = time >= 60.8 && time < 71.2
      ? "failed"
      : time >= 93.2
        ? "passed"
        : "pending";
    setVectorMachineLampStates(compiler.machines[0], [compilerLampState]);
    setVectorMachineLampStates(compiler.machines[1], [testerLampState]);
    setVectorMachineLampStates(compiler.machines[2], [
      time >= 96.45
        ? "passed"
        : time >= 46 && time < 53.25
          ? "failed"
          : "pending",
      time >= 98
        ? "passed"
        : time >= 60.8 && time < 71.2
          ? "failed"
          : "pending",
      time >= 98.55 ? "passed" : "pending",
    ]);
    setVectorMachineProgress(compiler.machines[0], {
      visible: Boolean(activeCompileWindow),
      progress: activeCompileWindow
        ? smoothstep(interval(time, activeCompileWindow[0], activeCompileWindow[1]))
        : 0,
    });
    setVectorMachineProgress(compiler.machines[1], {
      visible: Boolean(activeTestWindow),
      progress: activeTestWindow
        ? smoothstep(interval(time, activeTestWindow[0], activeTestWindow[1]))
        : 0,
    });
    compiler.sceneCaption.visible = false;
    // The canonical source-file route lives in Foundation so direct seeks and
    // reverse scrubbing cannot reveal a second, offset transport line.
    compiler.materialRoute.visible = false;
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

    const twinPanelIntro = smootherstep(interval(time, 57.6, 57.95))
      * (1 - smootherstep(interval(time, 70.25, 71)));
    const twinResult = time >= 60.8 && time < 66.95
      ? "RED · BYTE DRIFT"
      : "WAITING";
    setTwinVerifierPanel(compiler.twinConsole, {
      progress: verifierSecond,
      hashesVisible: time >= 60.3,
      result: twinResult,
      drills: [false, false, false],
      opacity: twinPanelIntro,
    });
    setVerifierVerdict(compiler.verifierVerdict, time);
    approvalSequence.setTime(time);
    liveSequence.setTime(time, camera);
    archipelagoSequence.setTime(time);
    const compilerWindow = time >= FACTORY_SCENES.compiler.start && time < FACTORY_SCENES.compiler.end;
    const workshopAlpha = compilerWindow
      ? 1 - smootherstep(interval(time, 106.75, 108.05))
      : 0;
    setFactoryOpacity(compiler.group, workshopAlpha);

    proof.setTime(time, camera, group);

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
      time >= 69.35 ? "EQUAL" : time >= 60.8 && time < 66.95 ? "RED · BYTE DRIFT" : "BUILDING A/B",
    );

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
