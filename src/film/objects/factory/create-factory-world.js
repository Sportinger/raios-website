import * as THREE from "three";
import {
  FACTORY_ISLANDS,
  FACTORY_LANES,
  FACTORY_PALETTE,
  FACTORY_SCENES,
} from "./config.js";
import { interval, pulse, showScene, smootherstep } from "./timeline.js";
import {
  createFlatMaterial,
  createResourceTracker,
  createRing,
  createRoute,
  createVectorBox,
} from "./primitives.js";

const setYScale = (object, scale) => {
  object.scale.y = Math.max(0.001, scale);
};

function createMachine(tracker, color, x) {
  const group = new THREE.Group();
  group.position.x = x;
  group.add(createVectorBox(tracker, {
    size: [3.5, 0.45, 6.8], color: FACTORY_PALETTE.panel,
    edgeColor: FACTORY_PALETTE.edge, position: [0, 0.225, 0],
  }));
  group.add(createVectorBox(tracker, {
    size: [2.15, 2.8, 2.1], color: FACTORY_PALETTE.panelLight,
    edgeColor: color, position: [0, 1.85, -0.65],
  }));
  const aperture = createVectorBox(tracker, {
    size: [1.25, 0.72, 0.08], color, edgeColor: FACTORY_PALETTE.white,
    position: [0, 1.75, 0.44],
  });
  group.add(aperture);
  const status = createRing(tracker, 0.48, color, 0.055);
  status.position.set(0, 3.12, -0.65);
  group.add(status);
  return { group, aperture, status };
}

function createCompilerScene(tracker) {
  const group = new THREE.Group();
  const machines = FACTORY_LANES.map((lane) => createMachine(tracker, lane.color, lane.x));
  machines.forEach(({ group: machine }) => group.add(machine));

  const tokenGeometry = tracker.geometry(new THREE.BoxGeometry(1.05, 0.34, 1.05));
  const tokenMaterial = createFlatMaterial(tracker, FACTORY_PALETTE.amber);
  const tokens = new THREE.InstancedMesh(tokenGeometry, tokenMaterial, FACTORY_LANES.length);
  tokens.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(tokens);
  return { group, machines, tokens };
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
  group.add(terminal, fixedSource, ...errorBars);
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
  return { group, terminal, errorBars, fix };
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
  group.add(bridge, seal);
  return { group, pods, bridge, seal };
}

function createProofScene(tracker) {
  const group = new THREE.Group();
  const cellar = createVectorBox(tracker, {
    size: [12, 4.8, 8], color: FACTORY_PALETTE.ink, edgeColor: FACTORY_PALETTE.violet,
    position: [0, -1.5, 0], opacity: 0.78,
  });
  const subject = createVectorBox(tracker, {
    size: [1.5, 1.2, 1.5], color: FACTORY_PALETTE.cyan,
    edgeColor: FACTORY_PALETTE.white, position: [0, 0.65, 0],
  });
  group.add(cellar, subject);
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
  return { group, subject, spikes };
}

function createGuardScene(tracker) {
  const group = new THREE.Group();
  const machine = createMachine(tracker, FACTORY_PALETTE.green, 0);
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
  return { group, machine, orbitRings };
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
  group.add(frame, opening, leftDoor, rightDoor, approval);
  return { group, leftDoor, rightDoor, approval };
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
  group.add(body, ...bars);
  return { group, body, bars };
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
  group.add(floor, wall, player.group);
  return { group, floor, wall, player };
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

  const routes = FACTORY_ISLANDS.slice(1, 8).map((island) => {
    const route = createRoute(tracker, [[0, 0.35, 0], [island.x * 0.5, 0.2, island.z * 0.5], [island.x, 0.35, island.z]], FACTORY_PALETTE.edge, 0.035);
    group.add(route);
    return route;
  });
  return { group, bases, cores, routes };
}

export function createFactoryWorld() {
  const tracker = createResourceTracker();
  const group = new THREE.Group();
  group.name = "factory-world";

  const compiler = createCompilerScene(tracker);
  const feedback = createFeedbackScene(tracker);
  const twins = createTwinScene(tracker);
  const proof = createProofScene(tracker);
  const guard = createGuardScene(tracker);
  const approval = createApprovalScene(tracker);
  const running = createPlayer(tracker);
  const compact = createCompactScene(tracker);
  const archipelago = createArchipelagoScene(tracker);
  const scenes = { compiler, feedback, twins, proof, guard, approval, running, compact, archipelago };
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

    const compileProgress = smootherstep(interval(time, 41, 48));
    compiler.machines.forEach((machine, index) => {
      machine.status.rotation.z = time * (0.55 + index * 0.15);
      machine.aperture.scale.x = 0.25 + compileProgress * 0.75;
      position.set(FACTORY_LANES[index].x, 0.75 + Math.sin((time + index) * 2.2) * 0.08, 2.1 - compileProgress * 3.8);
      scale.setScalar(0.35 + compileProgress * 0.65);
      matrix.compose(position, quaternion, scale);
      compiler.tokens.setMatrixAt(index, matrix);
    });
    compiler.tokens.instanceMatrix.needsUpdate = true;

    const fixProgress = smootherstep(interval(time, 54, 60));
    const fixAngle = fixProgress * Math.PI * 2;
    feedback.fix.position.set(Math.cos(fixAngle) * 4, 2 + Math.sin(fixAngle) * 2.6, 0.65);
    feedback.errorBars.forEach((bar, index) => { bar.scale.x = Math.max(0.001, 1 - fixProgress * (0.72 + index * 0.06)); });
    feedback.terminal.rotation.z = -pulse(time, 52.2, 53.5) * 0.035;

    const twinProgress = smootherstep(interval(time, 63, 69.5));
    twins.pods[0].position.x = -5 + twinProgress * 1.8;
    twins.pods[1].position.x = 5 - twinProgress * 1.8;
    twins.seal.scale.setScalar(0.5 + twinProgress * 0.5);
    twins.seal.rotation.z = time * 0.7;

    const proofProgress = smootherstep(interval(time, 73, 78.5));
    proof.subject.position.y = 0.65 + Math.sin(proofProgress * Math.PI * 5) * (1 - proofProgress) * 0.45;
    proof.subject.rotation.y = proofProgress * Math.PI * 2;
    proof.spikes.rotation.y = -time * 0.35;

    const guardProgress = smootherstep(interval(time, 80.5, 87));
    guard.orbitRings.forEach((ring, index) => {
      ring.rotation.x = Math.PI / 2 + Math.sin(time * 0.5 + index) * 0.25;
      ring.rotation.y = time * (0.12 + index * 0.035);
      ring.scale.setScalar(0.45 + guardProgress * 0.55);
    });

    const openProgress = smootherstep(interval(time, 90, 94));
    approval.leftDoor.position.x = -1.6 - openProgress * 3.15;
    approval.rightDoor.position.x = 1.6 + openProgress * 3.15;
    approval.approval.scale.setScalar(0.5 + smootherstep(interval(time, 88, 91)) * 0.5);
    approval.approval.rotation.z = time * 0.8;

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
    });
    archipelago.bases.instanceMatrix.needsUpdate = true;
    archipelago.cores.instanceMatrix.needsUpdate = true;
    archipelago.group.rotation.y = Math.sin(interval(time, 112, 120) * Math.PI) * 0.06;
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
