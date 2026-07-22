import * as THREE from "three";
import { FACTORY_LAYOUT, FACTORY_PALETTE } from "./config.js";
import {
  createFactoryDoorOnSurface,
  FACTORY_STANDARD_DOOR_SCALE,
  setFactoryDoorEmergence,
  setFactoryDoorLifecycle,
} from "./door-primitives.js";
import { createRoute, createTextLabel, createVectorBox } from "./primitives.js";
import {
  completedShadowAttacks,
  SHADOW_VM_ATTACKS,
  SHADOW_VM_WINDOWS,
  shadowBeatAt,
} from "./shadow-vm-data.js";
import {
  createShadowByteStrip,
  createShadowComparisonBridge,
  createShadowFragments,
  createShadowFramePanel,
  createShadowFuelRing,
  createShadowHashBadge,
  createShadowHud,
  createShadowReceipt,
  createShadowTendril,
  createShadowToken,
  createShadowTrapFlash,
  setShadowByteStrip,
  setShadowComparisonBridge,
  setShadowFragments,
  setShadowFramePanel,
  setShadowFuelRing,
  setShadowHashBadge,
  setShadowHud,
  setShadowOpacity,
  setShadowTendril,
  setShadowToken,
  setShadowTrapFlash,
} from "./shadow-vm-primitives.js";
import { interval, smootherstep } from "./timeline.js";
import {
  setVectorCableLifecycle,
  VECTOR_CABLE_DIRECTIONS,
} from "../shared/vector-cable.js";
import { createVectorCallout, setVectorCallout } from "../shared/vector-callout.js";
import { createVectorLayer, setVectorLayerLifecycle } from "../shared/vector-layer.js";
import { createPlayerProgram } from "../shared/player-program.js";
import { FOUNDATION_PRESENTATION_SCALE } from "../../layout-constants.js";

const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1);
const riseBetween = (time, start, end) => smootherstep(interval(time, start, end));
const PLAYER_GHOST_SCALE = FOUNDATION_PRESENTATION_SCALE;
const SHADOW_TEST_PALETTES = Object.freeze({
  rehearsal: Object.freeze({ panel: 0x351d4e, edge: 0xb77cff, door: 0xe0b8ff }),
  actOne: Object.freeze({ panel: 0x351d4e, edge: 0xb77cff, door: 0xe0b8ff }),
  actTwo: Object.freeze({ panel: 0x3a2b0e, edge: 0xffc857, door: 0xffe2a0 }),
  actThree: Object.freeze({ panel: 0x14334d, edge: 0x8fd8ff, door: 0xc7efff }),
});

function materialsWithColor(root, color) {
  const result = [];
  root.traverse((object) => {
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (material.color?.getHex() === color) result.push(material);
    });
  });
  return result;
}

function setMaterialColors(materials, color) {
  materials.forEach((material) => material.color?.setHex(color));
}

function createGhostCopy(tracker) {
  const machine = createPlayerProgram({
    tracker,
    id: "shadow-player-wasm-copy",
    title: "PLAYER.WASM",
  });
  machine.group.name = "shadow-player-wasm-copy";
  return machine.group;
}

function setRouteLifecycle(route, time, lifecycle) {
  const cable = route.userData.vectorCable;
  if (!cable) return;
  setVectorCableLifecycle(cable, time, lifecycle);
}

function attackAmount(time, attack) {
  return riseBetween(time, attack.start, attack.end);
}

function tendrilAmount(time, attack) {
  const local = interval(time, attack.start, attack.end);
  return local < 0.62
    ? smootherstep(interval(local, 0, 0.62))
    : 1 - smootherstep(interval(local, 0.62, 1));
}

function createPackets(tracker, count, color) {
  return Array.from({ length: count }, (_, index) => {
    const packet = createVectorBox(tracker, {
      size: [0.34, 0.18, 0.24],
      color,
      edgeColor: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.45).getHex(),
    });
    packet.userData.packetOffset = index / count;
    return packet;
  });
}

export function createShadowVmSequence(tracker, { getPlayerWorldPosition } = {}) {
  const group = new THREE.Group();
  group.name = "shadow-vm-three-acts";
  group.position.set(
    FACTORY_LAYOUT.shadow.position.x,
    FACTORY_LAYOUT.shadow.position.y,
    FACTORY_LAYOUT.shadow.position.z,
  );

  const shadowLayout = FACTORY_LAYOUT.shadow;
  const layer = createVectorLayer({
    tracker,
    id: "shadow-vm",
    width: shadowLayout.width,
    depth: shadowLayout.depth,
    height: shadowLayout.thickness,
    color: 0x351d4e,
    edgeColor: 0xb77cff,
    topOpacity: 0.82,
    gridDivisions: Math.round(Math.max(shadowLayout.width, shadowLayout.depth) / shadowLayout.gridStep),
    gridOpacity: 0.32,
  });
  const deckTop = shadowLayout.thickness;
  const halfWidth = shadowLayout.width * 0.5;
  const halfDepth = shadowLayout.depth * 0.5;
  const subject = createGhostCopy(tracker);
  const runA = createGhostCopy(tracker);
  const runB = createGhostCopy(tracker);
  group.add(layer.group, subject, runA, runB);

  const comparisonPads = [-1, 1].map((side, index) => {
    const pad = createVectorLayer({
      tracker,
      id: `shadow-compare-${index + 1}`,
      width: 3.05,
      depth: 3.35,
      height: 0.18,
      color: 0x3a2b0e,
      edgeColor: 0xffc857,
      topOpacity: 0.92,
      gridDivisions: 3,
      gridOpacity: 0.2,
    });
    pad.group.position.set(side * 1.72, deckTop + 0.025, -0.45);
    group.add(pad.group);
    return pad;
  });
  const comparisonPadTop = deckTop + 0.025 + comparisonPads[0].height;
  const comparisonBridge = createShadowComparisonBridge(tracker, {
    start: new THREE.Vector3(-1.72, comparisonPadTop + 1.45, -0.55),
    end: new THREE.Vector3(1.72, comparisonPadTop + 1.45, -0.55),
    height: 1.85,
  });
  group.add(comparisonBridge.group);

  const entryDoor = createFactoryDoorOnSurface(tracker, 0xd8acff, {
    surface: layer.surface,
    edge: "right",
    along: -2.2,
    scale: FACTORY_STANDARD_DOOR_SCALE,
    label: "shadow.in",
    labelColor: 0xdcc3f6,
  });
  group.add(entryDoor.group);
  const mockDoors = [-3.7, -1.35, 1].map((along, index) => {
    const door = createFactoryDoorOnSurface(tracker, 0xc28bff, {
      surface: layer.surface,
      edge: "front",
      along,
      scale: FACTORY_STANDARD_DOOR_SCALE,
      label: ["fb.mock", "input.inject", "file.sandbox"][index],
      labelColor: 0xdcc3f6,
    });
    group.add(door.group);
    return door;
  });
  const paletteTargets = {
    layerPanels: [layer.body.children[0].material, layer.top.material],
    layerEdges: [
      ...materialsWithColor(layer.body.children[1], 0xb77cff),
      ...materialsWithColor(layer.grid, 0xb77cff),
      ...materialsWithColor(layer.outline.group, 0xb77cff),
    ],
    entryDoor: materialsWithColor(entryDoor.group, 0xd8acff),
    mockDoors: mockDoors.flatMap((door) => materialsWithColor(door.group, 0xc28bff)),
  };

  function setTestPalette(palette) {
    setMaterialColors(paletteTargets.layerPanels, palette.panel);
    setMaterialColors(paletteTargets.layerEdges, palette.edge);
    setMaterialColors(paletteTargets.entryDoor, palette.door);
    setMaterialColors(paletteTargets.mockDoors, palette.edge);
  }

  const ghostFlightY = deckTop + 0.08;
  const entryFlight = new THREE.CatmullRomCurve3([
    new THREE.Vector3(13.19, ghostFlightY, -0.22),
    new THREE.Vector3(11.2, ghostFlightY, -0.4),
    new THREE.Vector3(9, ghostFlightY, -0.8),
    new THREE.Vector3(7.1, ghostFlightY, -1.55),
    new THREE.Vector3(halfWidth + 0.85, ghostFlightY, -2.05),
    new THREE.Vector3(halfWidth + 0.05, ghostFlightY, -2.2),
    new THREE.Vector3(halfWidth - 0.7, ghostFlightY, -2.05),
    new THREE.Vector3(2.5, ghostFlightY, -1.2),
    new THREE.Vector3(0, ghostFlightY, 0),
  ], false, "centripetal", 0.45);

  function updateEntryFlight() {
    if (typeof getPlayerWorldPosition !== "function") return;
    const worldStart = getPlayerWorldPosition(new THREE.Vector3());
    group.updateWorldMatrix(true, false);
    const localStart = group.worldToLocal(worldStart.clone());
    const approach = new THREE.Vector3(halfWidth + 0.85, ghostFlightY, -2.05);
    entryFlight.points[0].copy(localStart);
    [0.22, 0.46, 0.7].forEach((amount, index) => {
      entryFlight.points[index + 1].lerpVectors(localStart, approach, amount);
      entryFlight.points[index + 1].y += Math.sin(amount * Math.PI) * 0.34;
    });
    entryFlight.updateArcLengths();
  }

  const inputStart = new THREE.Vector3(-1.35, deckTop + 0.12, halfDepth - 0.65);
  const inputEnd = new THREE.Vector3(0, deckTop + 0.32, 0.6);
  const inputCurve = new THREE.CatmullRomCurve3([
    inputStart,
    new THREE.Vector3(-1.1, deckTop + 0.16, 2.7),
    new THREE.Vector3(-0.5, deckTop + 0.2, 1.6),
    inputEnd,
  ], false, "centripetal", 0.5);
  const inputCable = createRoute(
    tracker,
    inputCurve.getPoints(18).map((point) => point.toArray()),
    FACTORY_PALETTE.cyan,
    0.045,
    { direction: VECTOR_CABLE_DIRECTIONS.forward },
  );
  const framebufferCable = createRoute(tracker, [
    [0, deckTop + 0.12, 0],
    [-1.5, deckTop + 0.12, 0.65],
    [-3.7, deckTop + 0.12, 2.6],
  ], FACTORY_PALETTE.cyan, 0.045, { direction: VECTOR_CABLE_DIRECTIONS.forward });
  const fileCable = createRoute(tracker, [
    [0, deckTop + 0.12, 0],
    [0.4, deckTop + 0.12, 1.4],
    [1, deckTop + 0.12, 2.7],
  ], FACTORY_PALETTE.cyan, 0.045, { direction: VECTOR_CABLE_DIRECTIONS.forward });
  const inputPackets = createPackets(tracker, 3, FACTORY_PALETTE.cyan);
  group.add(inputCable, framebufferCable, fileCable, ...inputPackets);

  const framePanel = createShadowFramePanel(tracker);
  framePanel.group.position.set(-3.15, deckTop + 0.08, 1.5);
  const fileObject = createVectorBox(tracker, {
    size: [0.78, 0.12, 0.58],
    color: FACTORY_PALETTE.cyan,
    edgeColor: 0xb3f5ff,
  });
  fileObject.name = "shadow-sandbox-file";
  const hashBadge = createShadowHashBadge(tracker);
  hashBadge.group.position.set(0, deckTop + 3.18, 1.1);
  const hud = createShadowHud(tracker);
  hud.group.position.set(4.2, deckTop + 2.45, -1.35);
  group.add(framePanel.group, fileObject, hashBadge.group, hud.group);

  const byteStrip = createShadowByteStrip(tracker);
  byteStrip.group.position.set(0, deckTop + 0.08, 2.05);
  const illegalDoor = createVectorBox(tracker, {
    size: [1.35, 0.06, 0.92],
    color: 0x180d24,
    edgeColor: FACTORY_PALETTE.red,
    position: [3.25, deckTop + 0.06, -2.55],
    opacity: 0.68,
  });
  illegalDoor.add(createTextLabel(tracker, {
    text: "clock.now?",
    width: 1.7,
    height: 0.32,
    color: FACTORY_PALETTE.red,
    background: 0x100712,
    position: [0, 0.32, 0],
    fontSize: 42,
    billboard: true,
  }));
  group.add(byteStrip.group, illegalDoor);

  const networkEnd = new THREE.Vector3(-halfWidth + 0.5, deckTop + 1.1, -2.7);
  const fileEnd = new THREE.Vector3(1, deckTop + 0.75, halfDepth - 0.2);
  const networkTendril = createShadowTendril(tracker, {
    start: new THREE.Vector3(0, deckTop + 0.7, 0),
    control: new THREE.Vector3(-2.4, deckTop + 1.8, -1.2),
    end: networkEnd,
  });
  const fileTendril = createShadowTendril(tracker, {
    start: new THREE.Vector3(0, deckTop + 0.7, 0),
    control: new THREE.Vector3(0.2, deckTop + 1.35, 2.1),
    end: fileEnd,
  });
  const missingDoorOutline = createVectorBox(tracker, {
    size: [0.08, 1.7, 1.15],
    color: 0x351d4e,
    edgeColor: FACTORY_PALETTE.red,
    position: networkEnd.toArray(),
    opacity: 0.35,
  });
  const denyBracket = createVectorBox(tracker, {
    size: [1.4, 0.08, 0.12],
    color: FACTORY_PALETTE.red,
    position: [1, deckTop + 0.92, halfDepth + 0.12],
  });
  denyBracket.rotation.y = Math.PI / 4;
  const trapFlash = createShadowTrapFlash(tracker);
  const fuelRing = createShadowFuelRing(tracker);
  fuelRing.group.position.set(0, deckTop + 0.02, 0);
  const memoryCeiling = createVectorBox(tracker, {
    size: [3.2, 0.08, 3.2],
    color: 0x351d4e,
    edgeColor: 0xe0b8ff,
    position: [0, deckTop + 2.65, 0],
    opacity: 0.35,
  });
  const token = createShadowToken(tracker);
  const replayPackets = createPackets(tracker, 2, FACTORY_PALETTE.cyan);
  const fragments = createShadowFragments(tracker);
  group.add(
    networkTendril.group,
    fileTendril.group,
    missingDoorOutline,
    denyBracket,
    trapFlash.group,
    fuelRing.group,
    memoryCeiling,
    token.group,
    ...replayPackets,
    fragments.group,
  );

  const testimonyCable = createRoute(tracker, [
    [0, deckTop + 0.18, 0],
    [2.7, deckTop + 0.18, -1.1],
    [halfWidth + 0.2, deckTop + 0.18, -2.2],
    [halfWidth + 2.5, deckTop + 0.18, -1.1],
  ], FACTORY_PALETTE.green, 0.024, { direction: VECTOR_CABLE_DIRECTIONS.forward });
  const receipt = createShadowReceipt(tracker);
  const receiptFlight = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, deckTop + 0.8, 0),
    new THREE.Vector3(2.7, deckTop + 1.15, -1.1),
    new THREE.Vector3(halfWidth + 0.2, deckTop + 0.9, -2.2),
    new THREE.Vector3(halfWidth + 2.5, deckTop + 1, -1.1),
  ], false, "centripetal", 0.5);
  group.add(testimonyCable, receipt.group);

  const redWash = new THREE.Mesh(
    tracker.geometry(new THREE.PlaneGeometry(shadowLayout.width - 0.12, shadowLayout.depth - 0.12)),
    tracker.material(new THREE.MeshBasicMaterial({
      color: 0xff3f55,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    })),
  );
  redWash.rotation.x = -Math.PI / 2;
  redWash.position.y = deckTop + 0.022;
  redWash.material.userData.shadowBaseOpacity = 0.2;
  group.add(redWash);

  const callout = createVectorCallout({
    tracker,
    title: "SHADOW VM",
    copy: "DISPOSABLE · ZERO LIVE EFFECT",
    color: 0xb77cff,
    width: 5.5,
  });

  function setCoreVisibility(value) {
    inputCable.visible = value;
    framebufferCable.visible = value;
    fileCable.visible = value;
    inputPackets.forEach((packet) => { packet.visible = value; });
    runA.visible = value;
    runB.visible = value;
    illegalDoor.visible = value;
    missingDoorOutline.visible = value;
    denyBracket.visible = value;
    memoryCeiling.visible = value;
    replayPackets.forEach((packet) => { packet.visible = value; });
    testimonyCable.visible = value;
  }

  function setTime(time, camera, root) {
    const rehearsal = time >= SHADOW_VM_WINDOWS.rehearsal.start
      && time < SHADOW_VM_WINDOWS.rehearsal.end;
    const actOne = time >= SHADOW_VM_WINDOWS.actOne.start && time < SHADOW_VM_WINDOWS.actOne.end;
    const actTwo = time >= SHADOW_VM_WINDOWS.actTwo.start && time < SHADOW_VM_WINDOWS.actTwo.end;
    const actThree = time >= SHADOW_VM_WINDOWS.actThree.start && time < SHADOW_VM_WINDOWS.actThree.end;
    const receiptPhase = time >= SHADOW_VM_WINDOWS.receipt.start
      && time < SHADOW_VM_WINDOWS.receipt.end;
    const window = rehearsal
      ? SHADOW_VM_WINDOWS.rehearsal
      : actOne
        ? SHADOW_VM_WINDOWS.actOne
        : actTwo
          ? SHADOW_VM_WINDOWS.actTwo
          : actThree || receiptPhase
            ? { start: SHADOW_VM_WINDOWS.actThree.start, end: SHADOW_VM_WINDOWS.receipt.end }
            : null;
    group.visible = Boolean(window);
    setCoreVisibility(false);
    if (!window) {
      callout.group.visible = false;
      return;
    }

    const palette = rehearsal || actOne
      ? SHADOW_TEST_PALETTES.actOne
      : actTwo
        ? SHADOW_TEST_PALETTES.actTwo
        : SHADOW_TEST_PALETTES.actThree;
    setTestPalette(palette);

    const cableOutroStart = window.end - 1.35;
    const cableOutroEnd = window.end - 0.94;
    const doorOutroStart = window.end - 0.9;
    const doorOutroEnd = window.end - 0.38;
    const layerOutroStart = window.end - 0.38;
    const contentOutro = riseBetween(time, cableOutroStart, doorOutroEnd);
    const intro = riseBetween(time, window.start, window.start + 0.42);
    const alpha = intro * (1 - contentOutro);
    setVectorLayerLifecycle(layer, time, {
      introStart: window.start,
      introEnd: window.start + 0.72,
      outroStart: layerOutroStart,
      outroEnd: window.end,
    });

    setFactoryDoorLifecycle(entryDoor, time, {
      introStart: window.start + 0.55,
      introEnd: window.start + 1.28,
      openStart: window.start + 1.12,
      openEnd: window.start + 1.38,
      outroStart: doorOutroStart,
      outroEnd: doorOutroEnd,
    });
    const showMockDoors = rehearsal || actOne;
    mockDoors.forEach((door, index) => {
      const delay = index * 0.07;
      if (showMockDoors) {
        setFactoryDoorLifecycle(door, time, {
          introStart: window.start + 0.66 + delay,
          introEnd: window.start + 1.34 + delay,
          outroStart: doorOutroStart,
          outroEnd: doorOutroEnd,
        });
      } else {
        setFactoryDoorEmergence(door, {
          porchAmount: 0,
          labelAmount: 0,
          riseAmount: 0,
          opacity: 0,
        });
      }
    });

    updateEntryFlight();
    const flight = riseBetween(time, window.start + 1.18, window.start + 1.72);
    const point = entryFlight.getPointAt(flight);
    subject.position.copy(point);
    subject.rotation.set(0, 0, 0);
    const squeeze = Math.max(0, 1 - Math.abs(flight - 0.59) / 0.18);
    const baseGhostScale = PLAYER_GHOST_SCALE - squeeze * 0.2;
    subject.scale.setScalar(baseGhostScale);
    setShadowOpacity(subject, alpha);

    setVectorCallout(callout, time, {
      start: 58.68,
      introEnd: 59.08,
      titleStart: 59.32,
      end: 60.45,
      root,
      camera,
      targetObject: layer.body,
      targetLocalPoint: new THREE.Vector3(0, 0, shadowLayout.depth / 2 + 0.04),
      angle: -THREE.MathUtils.degToRad(26.565),
    });

    setShadowFramePanel(framePanel, 0, 0);
    setShadowOpacity(fileObject, 0);
    setShadowHashBadge(hashBadge, {}, 0);
    setShadowHud(hud, { act: 1 }, 0);
    setShadowByteStrip(byteStrip, {}, 0);
    comparisonPads.forEach((pad) => setVectorLayerLifecycle(pad, time, {
      introStart: 83.28,
      introEnd: 84.18,
      outroStart: 88.65,
      outroEnd: 89.08,
    }));
    setShadowComparisonBridge(comparisonBridge, { progress: 0, divergence: 100 }, 0);
    setShadowTendril(networkTendril, 0, 0);
    setShadowTendril(fileTendril, 0, 0);
    setShadowTrapFlash(trapFlash, 0, 0);
    setShadowFuelRing(fuelRing, 0, 0);
    setShadowToken(token, 0, false, 0);
    setShadowFragments(fragments, 0, new THREE.Vector3(), 0);
    setShadowOpacity(receipt.group, 0);
    redWash.visible = false;

    if (rehearsal) {
      subject.position.y += Math.sin(time * Math.PI * 2.1) * 0.05;
      setRouteLifecycle(inputCable, time, {
        introStart: 59.25, introEnd: 59.8,
        outroStart: cableOutroStart, outroEnd: cableOutroEnd,
      });
      setRouteLifecycle(framebufferCable, time, {
        introStart: 59.42, introEnd: 59.86,
        outroStart: cableOutroStart, outroEnd: cableOutroEnd,
      });
      setRouteLifecycle(fileCable, time, {
        introStart: 59.62, introEnd: 60.02,
        outroStart: cableOutroStart, outroEnd: cableOutroEnd,
      });
      inputPackets.forEach((packet, index) => {
        const packetProgress = clamp01(interval(time, 59.18 + index * 0.12, 59.72 + index * 0.12));
        packet.position.copy(inputCurve.getPointAt(packetProgress));
        packet.visible = packetProgress > 0.001 && packetProgress < 0.999;
      });
      const panelOpen = riseBetween(time, 59.35, 59.78);
      setShadowFramePanel(framePanel, panelOpen, panelOpen * alpha);
      const fileDrop = riseBetween(time, 59.55, 60.05);
      fileObject.position.set(1, THREE.MathUtils.lerp(deckTop + 2.2, deckTop + 0.16, fileDrop), 2.55);
      fileObject.rotation.y = fileDrop * Math.PI * 1.5;
      setShadowOpacity(fileObject, fileDrop * alpha);
      const claimProgress = riseBetween(time, 59.72, 60.35);
      const failed = time >= 60.18;
      setShadowHashBadge(hashBadge, { locked: false, broken: failed }, claimProgress * alpha);
      setShadowHud(hud, {
        act: 1,
        mode: failed ? "PREDICATE · FAILED" : "PREDICATE",
        claims: Math.round(claimProgress * 653),
        current: failed ? "FRAME HASH MISMATCH" : "MOCK I/O ONLY",
        accent: "#b77cff",
      }, riseBetween(time, 59.2, 59.5) * alpha);
      return;
    }

    const beat = shadowBeatAt(time);

    if (actOne) {
      const mockStart = SHADOW_VM_WINDOWS.actOne.start + 2.8;
      setRouteLifecycle(inputCable, time, {
        introStart: mockStart, introEnd: mockStart + 0.8,
        outroStart: cableOutroStart, outroEnd: cableOutroEnd,
      });
      setRouteLifecycle(framebufferCable, time, {
        introStart: mockStart + 0.45, introEnd: mockStart + 1.05,
        outroStart: cableOutroStart, outroEnd: cableOutroEnd,
      });
      setRouteLifecycle(fileCable, time, {
        introStart: mockStart + 0.9, introEnd: mockStart + 1.5,
        outroStart: cableOutroStart, outroEnd: cableOutroEnd,
      });
      inputPackets.forEach((packet, index) => {
        const packetProgress = clamp01(interval(time, mockStart + index * 0.24, mockStart + 1.18 + index * 0.24));
        packet.position.copy(inputCurve.getPointAt(packetProgress));
        packet.visible = packetProgress > 0.001 && packetProgress < 0.999;
      });
      const panelOpen = riseBetween(time, mockStart + 0.7, mockStart + 1.9);
      setShadowFramePanel(framePanel, panelOpen, panelOpen * alpha);
      const fileDrop = riseBetween(time, mockStart + 1.5, mockStart + 2.9);
      fileObject.position.set(1, THREE.MathUtils.lerp(deckTop + 2.2, deckTop + 0.16, fileDrop), 2.55);
      fileObject.rotation.y = fileDrop * Math.PI * 1.5;
      setShadowOpacity(fileObject, fileDrop * alpha);
      const hashLock = riseBetween(time, 77, 80.45);
      setShadowHashBadge(hashBadge, { locked: hashLock > 0.78 }, hashLock * alpha);
      setShadowHud(hud, {
        act: 1,
        mode: "PREDICATE",
        claims: Math.round(hashLock * 654),
        current: beat?.caption,
        accent: "#b77cff",
      }, riseBetween(time, 72.4, 73.25) * alpha);
    }

    if (actTwo) {
      const split = riseBetween(time, 83.86, 84.62);
      setShadowOpacity(subject, alpha * (1 - split));
      [runA, runB].forEach((run, index) => {
        const side = index === 0 ? -1 : 1;
        run.position.set(side * 1.72 * split, comparisonPadTop, -0.55);
        run.scale.setScalar(PLAYER_GHOST_SCALE);
        setShadowOpacity(run, split * alpha);
      });
      const comparison = riseBetween(time, 84.35, 85.35)
        * (1 - riseBetween(time, 88.2, 88.65));
      const convergence = riseBetween(time, 85.1, 88.2);
      const divergence = THREE.MathUtils.lerp(100, 0, convergence);
      setShadowComparisonBridge(comparisonBridge, {
        progress: comparison,
        divergence,
      }, alpha);
      setShadowHud(hud, {
        act: 2,
        mode: "PARALLEL REPLAY",
        current: divergence < 0.5 ? "DIVERGENCE · 0%" : "SAME TEST · TWO CELLS",
        accent: "#ffc857",
      }, alpha);
    }

    if (actThree) {
      setShadowOpacity(subject, alpha);
      subject.position.set(0, deckTop + 0.02, 0);
      subject.scale.setScalar(PLAYER_GHOST_SCALE);
      redWash.visible = true;
      redWash.material.opacity = (0.08 + Math.abs(Math.sin(time * 5.2)) * 0.08) * alpha;
      const activeAttack = SHADOW_VM_ATTACKS.find(({ start, end }) => time >= start && time < end);
      const completed = completedShadowAttacks(time);
      setShadowHud(hud, {
        act: 3,
        mode: "FAIL-CLOSED",
        count: completed,
        current: activeAttack?.label ?? beat?.caption,
        accent: "#8fd8ff",
      }, alpha);
      if (activeAttack) {
        const amount = attackAmount(time, activeAttack);
        const snap = tendrilAmount(time, activeAttack);
        let impactPoint = new THREE.Vector3(0, deckTop + 0.7, 0);
        if (activeAttack.kind === "network") {
          setShadowTendril(networkTendril, snap, alpha);
          setShadowOpacity(missingDoorOutline, (0.24 + Math.abs(Math.sin(time * 18)) * 0.76) * alpha);
          impactPoint = networkEnd;
        } else if (activeAttack.kind === "file") {
          setShadowTendril(fileTendril, snap, alpha);
          setShadowOpacity(denyBracket, amount * alpha);
          impactPoint = fileEnd;
        } else if (activeAttack.kind === "fuel") {
          const fuel = 1 - amount;
          setShadowFuelRing(fuelRing, fuel, alpha);
          subject.rotation.y = amount * amount * Math.PI * 8;
          const breakup = riseBetween(time, activeAttack.end - 0.16, activeAttack.end);
          setShadowOpacity(subject, alpha * (1 - breakup));
          setShadowFragments(fragments, breakup, subject.position, breakup * alpha);
          impactPoint.copy(subject.position);
        } else if (activeAttack.kind === "memory") {
          const swell = Math.sin(amount * Math.PI);
          subject.scale.set(
            PLAYER_GHOST_SCALE + swell * 0.7,
            PLAYER_GHOST_SCALE + swell * 1.2,
            PLAYER_GHOST_SCALE + swell * 0.7,
          );
          setShadowOpacity(memoryCeiling, swell * alpha);
          impactPoint.set(0, deckTop + 2.65, 0);
        } else if (activeAttack.kind === "token") {
          const tokenTravel = Math.sin(amount * Math.PI * 0.5);
          token.group.position.set(
            THREE.MathUtils.lerp(0, halfWidth - 0.35, tokenTravel),
            deckTop + 0.32 + Math.sin(tokenTravel * Math.PI) * 0.5,
            THREE.MathUtils.lerp(0, -2.2, tokenTravel),
          );
          setShadowToken(token, Math.min(1, amount * 3), amount > 0.62, alpha);
          impactPoint.copy(token.group.position);
        } else if (activeAttack.kind === "tamper") {
          setShadowByteStrip(byteStrip, { progress: amount, diff: amount > 0.42 }, alpha);
          setShadowHashBadge(hashBadge, { locked: true, broken: amount > 0.48 }, alpha);
          impactPoint.set(1.15, deckTop + 0.18, 2.05);
        } else if (activeAttack.kind === "replay") {
          replayPackets.forEach((packet, index) => {
            const travel = clamp01(amount * 1.4 - index * 0.22);
            packet.visible = travel > 0.001;
            packet.position.set(
              THREE.MathUtils.lerp(0, halfWidth - 0.15 - index * 0.28, travel),
              deckTop + 0.3 + Math.sin(travel * Math.PI) * 0.35,
              -1.8,
            );
            if (index === 1 && amount > 0.62) {
              packet.position.x -= (amount - 0.62) * 3.8;
              packet.rotation.z = (amount - 0.62) * Math.PI * 3;
            }
          });
          impactPoint.set(halfWidth - 0.25, deckTop + 0.3, -1.8);
        }
        trapFlash.group.position.copy(impactPoint);
        setShadowTrapFlash(trapFlash, amount, alpha);
      }
    }

    if (receiptPhase) {
      const death = riseBetween(time, 98.2, 98.5);
      setShadowOpacity(subject, alpha * (1 - death));
      subject.position.set(0, deckTop + 0.02, 0);
      setShadowFragments(fragments, death, subject.position, death * alpha);
      setShadowHud(hud, {
        act: 3,
        mode: "FAIL-CLOSED",
        count: 7,
        current: "GHOST TERMINATED",
        accent: "#8fd8ff",
      }, alpha);
      setRouteLifecycle(testimonyCable, time, {
        introStart: 98.3,
        introEnd: 98.5,
        outroStart: 98.78,
        outroEnd: 99,
      });
      const receiptTravel = riseBetween(time, 98.35, 98.85);
      receipt.group.position.copy(receiptFlight.getPointAt(receiptTravel));
      receipt.group.scale.setScalar(0.58 + Math.sin(receiptTravel * Math.PI) * 0.18);
      setShadowOpacity(receipt.group, riseBetween(time, 98.25, 98.45) * alpha);
      redWash.visible = true;
      redWash.material.opacity = 0.08 * alpha;
    }

    group.traverse((object) => object.userData.setRouteTime?.(time));
  }

  setTime(0);
  return {
    group,
    callout,
    layer,
    subject,
    entryDoor,
    mockDoors,
    setTime,
  };
}
