import * as THREE from "three";
import { FILM_ACTION_TIMINGS } from "../../film-data.js";
import { createCanvasSprite, roundedRect } from "./canvas-primitives.js";
import { FACTORY_LAYOUT, FACTORY_PALETTE } from "./config.js";
import {
  createFreestandingFactoryDoor,
  setFactoryDoorOpen,
} from "./door-primitives.js";
import { createRoute, createTextLabel, createVectorBox } from "./primitives.js";
import { interval, smoothstep, smootherstep } from "./timeline.js";
import {
  setVectorCableTime,
  VECTOR_CABLE_DIRECTIONS,
} from "../shared/vector-cable.js";
import {
  createVectorLayer,
  setVectorLayerLifecycle,
} from "../shared/vector-layer.js";

const ARCHIPELAGO_ANCHOR = Object.freeze({
  x: FACTORY_LAYOUT.shadow.position.x,
  y: FACTORY_LAYOUT.shadow.position.y + FACTORY_LAYOUT.shadow.thickness,
  z: FACTORY_LAYOUT.shadow.position.z,
});
const ARCHIPELAGO_TIMING = FILM_ACTION_TIMINGS.archipelago;
const LATTICE_STEP = 4.4;
const ISLAND_REVEAL_START = ARCHIPELAGO_TIMING.firstIslandAt;
const ISLAND_STAGGER_SECONDS = ARCHIPELAGO_TIMING.islandStaggerSeconds;
const ISLAND_BUILD_SECONDS = ARCHIPELAGO_TIMING.islandPopSeconds;

const APP_CATALOG = Object.freeze([
  ["FORTNITE", "F", FACTORY_PALETTE.amber],
  ["BROWSER", "WEB", FACTORY_PALETTE.blue],
  ["DOCS", "DOC", FACTORY_PALETTE.cyan],
  ["EMAIL", "MAIL", FACTORY_PALETTE.red],
  ["WEATHER", "SUN", FACTORY_PALETTE.cyan],
  ["VIDEO PLAYER", "PLAY", FACTORY_PALETTE.violet],
  ["MINECRAFT", "M", FACTORY_PALETTE.green],
  ["MESSAGES", "CHAT", FACTORY_PALETTE.violet],
  ["FILES", "DIR", FACTORY_PALETTE.blue],
  ["PHOTOS", "PIC", FACTORY_PALETTE.red],
  ["MAPS", "MAP", FACTORY_PALETTE.amber],
  ["NOTES", "TXT", FACTORY_PALETTE.amber],
  ["CALENDAR", "CAL", FACTORY_PALETTE.red],
  ["CAMERA", "CAM", FACTORY_PALETTE.blue],
  ["CONTACTS", "ID", FACTORY_PALETTE.cyan],
  ["STUDIO", "EDIT", FACTORY_PALETTE.violet],
  ["TERMINAL", "CLI", FACTORY_PALETTE.green],
  ["STORE", "GET", FACTORY_PALETTE.blue],
  ["SETTINGS", "CFG", FACTORY_PALETTE.amber],
  ["GAMES", "PAD", FACTORY_PALETTE.red],
  ["MUSIC", "MUSIC", FACTORY_PALETTE.green],
  ["CLOCK", "TIME", FACTORY_PALETTE.blue],
  ["CALCULATOR", "CALC", FACTORY_PALETTE.amber],
  ["PDF READER", "PDF", FACTORY_PALETTE.red],
  ["CODE EDITOR", "CODE", FACTORY_PALETTE.violet],
  ["TASKS", "TODO", FACTORY_PALETTE.green],
  ["SHEETS", "XLS", FACTORY_PALETTE.cyan],
  ["SLIDES", "PPT", FACTORY_PALETTE.amber],
  ["PASSWORDS", "KEY", FACTORY_PALETTE.green],
  ["VPN", "VPN", FACTORY_PALETTE.blue],
  ["BACKUP", "BAK", FACTORY_PALETTE.cyan],
  ["ARCHIVE", "ZIP", FACTORY_PALETTE.amber],
  ["SCANNER", "SCAN", FACTORY_PALETTE.blue],
  ["PAINT", "DRAW", FACTORY_PALETTE.red],
  ["PODCASTS", "POD", FACTORY_PALETTE.violet],
  ["RSS", "RSS", FACTORY_PALETTE.amber],
  ["TRANSLATE", "LANG", FACTORY_PALETTE.cyan],
  ["MONITOR", "MON", FACTORY_PALETTE.green],
  ["LOGS", "LOG", FACTORY_PALETTE.blue],
  ["DATABASE", "DB", FACTORY_PALETTE.violet],
  ["API CLIENT", "API", FACTORY_PALETTE.cyan],
  ["CONTAINERS", "CTR", FACTORY_PALETTE.blue],
  ["VIRTUAL MACHINE", "VM", FACTORY_PALETTE.violet],
  ["SHELL", "SH", FACTORY_PALETTE.green],
  ["REMOTE", "RDP", FACTORY_PALETTE.blue],
  ["DOWNLOADS", "DL", FACTORY_PALETTE.cyan],
  ["BOOKS", "BOOK", FACTORY_PALETTE.amber],
  ["WALLET", "PAY", FACTORY_PALETTE.green],
  ["HEALTH", "PLUS", FACTORY_PALETTE.red],
  ["FITNESS", "FIT", FACTORY_PALETTE.green],
  ["TRAVEL", "TRIP", FACTORY_PALETTE.blue],
  ["RECORDER", "REC", FACTORY_PALETTE.red],
  ["STREAMING", "LIVE", FACTORY_PALETTE.violet],
  ["RADIO", "FM", FACTORY_PALETTE.cyan],
  ["GALLERY", "IMG", FACTORY_PALETTE.red],
  ["LAUNCHER", "RUN", FACTORY_PALETTE.green],
  ["UTILITIES", "TOOL", FACTORY_PALETTE.amber],
  ["NEWS", "NEWS", FACTORY_PALETTE.blue],
  ["DICTIONARY", "ABC", FACTORY_PALETTE.cyan],
  ["AUTOMATION", "AUTO", FACTORY_PALETTE.violet],
]);

function createRingSlots(count) {
  const slots = [];
  for (let ring = 1; slots.length < count; ring += 1) {
    for (let x = -ring; x < ring && slots.length < count; x += 1) slots.push([x, -ring]);
    for (let z = -ring; z < ring && slots.length < count; z += 1) slots.push([ring, z]);
    for (let x = ring; x > -ring && slots.length < count; x -= 1) slots.push([x, ring]);
    for (let z = ring; z > -ring && slots.length < count; z -= 1) slots.push([-ring, z]);
  }
  return slots;
}

const ISLAND_SLOTS = createRingSlots(APP_CATALOG.length);
if (APP_CATALOG.length !== ARCHIPELAGO_TIMING.islandCount) {
  throw new Error("Archipelago app catalog and configured island count must match.");
}
const ISLAND_SIZE_PATTERN = Object.freeze([0.68, 0.86, 1.14, 0.76, 1.28, 0.95, 1.08, 0.72, 1.36, 0.84]);
const APP_DEFINITIONS = Object.freeze(APP_CATALOG.map(([labelCopy, iconCopy, accent], index) => {
  const [gridX, gridZ] = ISLAND_SLOTS[index];
  const widthScale = ISLAND_SIZE_PATTERN[index % ISLAND_SIZE_PATTERN.length];
  const depthScale = ISLAND_SIZE_PATTERN[(index * 3 + 4) % ISLAND_SIZE_PATTERN.length];
  return Object.freeze({
    labelCopy,
    iconCopy,
    accent,
    start: ISLAND_REVEAL_START + index * ISLAND_STAGGER_SECONDS,
    width: 2.75 * widthScale,
    depth: 2.75 * depthScale,
    height: 0.28 + 0.13 * ISLAND_SIZE_PATTERN[(index + 6) % ISLAND_SIZE_PATTERN.length],
    position: Object.freeze({
      x: ARCHIPELAGO_ANCHOR.x + gridX * LATTICE_STEP,
      y: ARCHIPELAGO_ANCHOR.y,
      z: ARCHIPELAGO_ANCHOR.z + gridZ * LATTICE_STEP,
    }),
  });
}));

function setOpacity(root, opacity) {
  const value = THREE.MathUtils.clamp(opacity, 0, 1);
  root.visible = value > 0.001;
  root.traverse((object) => {
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (material.userData.archipelagoBaseOpacity === undefined) {
        material.userData.archipelagoBaseOpacity = material.opacity;
      }
      const baseOpacity = material.userData.archipelagoBaseOpacity;
      material.transparent = material.userData.preserveTransparency || baseOpacity < 0.999 || value < 0.999;
      material.opacity = baseOpacity * value;
    });
  });
}

function windowAlpha(time, start, end, fade) {
  return smoothstep(interval(time, start, start + fade))
    * (1 - smoothstep(interval(time, end - fade, end)));
}

function createTransparentText(tracker, {
  pixelWidth = 1600,
  pixelHeight = 220,
  worldWidth,
  worldHeight,
  renderOrder = 80,
  draw,
}) {
  const surface = createCanvasSprite(tracker, {
    pixelWidth, pixelHeight, worldWidth, worldHeight, renderOrder,
  });
  draw(surface.context, 1);
  surface.texture.needsUpdate = true;
  return surface;
}

function createCompactCaption(tracker) {
  return createTransparentText(tracker, {
    worldWidth: 15.8,
    worldHeight: 1.35,
    draw(context) {
      context.clearRect(0, 0, 1600, 220);
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = "900 42px Consolas, monospace";
      context.lineWidth = 13;
      context.strokeStyle = "#020508";
      context.strokeText("THE APP KEEPS EXACTLY THE SPACE AND RIGHTS IT NEEDS.", 800, 110, 1520);
      context.fillStyle = "#c5ccd5";
      context.fillText("THE APP KEEPS EXACTLY THE SPACE AND RIGHTS IT NEEDS.", 800, 110, 1520);
    },
  });
}

function createCounter(tracker) {
  const surface = createCanvasSprite(tracker, {
    pixelWidth: 1280,
    pixelHeight: 176,
    worldWidth: 9.4,
    worldHeight: 1.3,
    renderOrder: 84,
  });
  let renderedCount = -1;
  const draw = (count) => {
    if (renderedCount === count) return;
    renderedCount = count;
    const { context } = surface;
    context.clearRect(0, 0, 1280, 176);
    roundedRect(context, 12, 12, 1256, 152, 76);
    context.fillStyle = "rgba(3,9,12,.88)";
    context.fill();
    context.strokeStyle = "rgba(105,228,152,.62)";
    context.lineWidth = 6;
    context.stroke();
    context.beginPath();
    context.arc(108, 88, 18, 0, Math.PI * 2);
    context.fillStyle = "#69e498";
    context.shadowColor = "#69e498";
    context.shadowBlur = 22;
    context.fill();
    context.shadowBlur = 0;
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.font = "900 36px Consolas, monospace";
    context.fillStyle = "#bdeacd";
    context.fillText(`${count} MORE PRIVATE APP ISLAND${count === 1 ? "" : "S"}`, 162, 91, 1040);
    surface.texture.needsUpdate = true;
  };
  draw(0);
  return { ...surface, draw };
}

function createFinalTitle(tracker) {
  const surface = createCanvasSprite(tracker, {
    pixelWidth: 1800,
    pixelHeight: 320,
    worldWidth: 17.2,
    worldHeight: 3.05,
    renderOrder: 86,
  });
  let renderedTextAlpha = -1;
  const draw = (textAlpha) => {
    const alpha = Math.round(textAlpha * 100) / 100;
    if (alpha === renderedTextAlpha) return;
    renderedTextAlpha = alpha;
    const { context } = surface;
    context.clearRect(0, 0, 1800, 320);
    roundedRect(context, 18, 18, 1764, 284, 72);
    context.fillStyle = "rgba(3,8,12,.86)";
    context.fill();
    context.strokeStyle = "rgba(105,228,152,.58)";
    context.lineWidth = 6;
    context.stroke();
    if (alpha <= 0) {
      surface.texture.needsUpdate = true;
      return;
    }
    context.globalAlpha = alpha;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#c8d2dc";
    context.font = "800 62px Consolas, monospace";
    context.fillText("ONE APP. ONE PRIVATE ISLAND.", 900, 118, 1680);
    context.fillStyle = "#aab8c4";
    context.font = "700 31px Consolas, monospace";
    context.fillText("Games, tools and everyday software arrive without sharing a room.", 900, 218, 1650);
    context.globalAlpha = 1;
    surface.texture.needsUpdate = true;
  };
  draw(0);
  return { ...surface, draw };
}

function createAppIsland(tracker, definition) {
  const {
    labelCopy,
    iconCopy,
    start,
    width,
    depth,
    height,
    position,
    accent,
  } = definition;
  const group = new THREE.Group();
  group.name = `app-island-${labelCopy.toLowerCase().replace(/\s+/g, "-")}`;
  group.position.set(position.x, position.y, position.z);
  const layer = createVectorLayer({
    tracker,
    id: `app-${labelCopy.toLowerCase().replace(/\s+/g, "-")}`,
    width,
    depth,
    height,
    baseY: 0,
    color: 0x071a16,
    edgeColor: 0x69df98,
    topOpacity: 0.94,
    gridDivisions: Math.max(2, Math.round(Math.max(width, depth) / 0.8)),
    gridOpacity: 0.16,
  });
  const content = new THREE.Group();
  content.name = "app-island-content";
  const core = createVectorBox(tracker, {
    size: [0.92, 0.58, 0.74],
    color: 0x061014,
    edgeColor: accent,
    position: [0, height + 0.29, 0],
  });
  const icon = createTextLabel(tracker, {
    text: iconCopy,
    width: 0.9,
    height: 0.38,
    color: accent,
    background: 0x04090d,
    position: [0, height + 0.33, 0.4],
    fontSize: iconCopy.length > 2 ? 38 : 52,
    billboard: true,
  });
  const stem = createVectorBox(tracker, {
    size: [0.055, 0.52, 0.055],
    color: 0x69df98,
    position: [0, height + 0.84, 0],
  });
  const beaconMaterial = tracker.material(new THREE.MeshBasicMaterial({ color: 0x94ffba }));
  const beacon = new THREE.Mesh(tracker.geometry(new THREE.SphereGeometry(0.115, 14, 9)), beaconMaterial);
  beacon.position.set(0, height + 1.16, 0);
  const haloMaterial = tracker.material(new THREE.MeshBasicMaterial({
    color: 0x69df98, transparent: true, opacity: 0.18, depthWrite: false,
  }));
  haloMaterial.userData.preserveTransparency = true;
  const halo = new THREE.Mesh(tracker.geometry(new THREE.SphereGeometry(0.34, 12, 8)), haloMaterial);
  halo.position.copy(beacon.position);
  const label = createTextLabel(tracker, {
    text: labelCopy,
    width: labelCopy.length > 10 ? 2.5 : 1.9,
    height: 0.36,
    color: 0xc4d1dc,
    background: 0x020608,
    position: [0, height * 0.52, depth / 2 + 0.38],
    fontSize: 42,
    billboard: true,
  });
  content.add(core, icon, stem, beacon, halo, label);
  group.add(layer.group, content);
  return {
    group,
    layer,
    content,
    start,
    beacon,
    halo,
    routePoint: new THREE.Vector3(position.x, position.y + height + 0.05, position.z),
  };
}

function createArchipelagoRoutes(tracker, islands) {
  return Array.from({ length: 6 }, (_, routeIndex) => {
    const linkedIslands = islands.filter((_, index) => index % 6 === routeIndex);
    const routePoints = [
      new THREE.Vector3(
        ARCHIPELAGO_ANCHOR.x,
        ARCHIPELAGO_ANCHOR.y + 0.08,
        ARCHIPELAGO_ANCHOR.z,
      ),
      ...linkedIslands.map(({ routePoint }) => routePoint),
    ].map((point) => point.toArray());
    const route = createRoute(tracker, routePoints, 0x315f46, 0.014, {
      direction: VECTOR_CABLE_DIRECTIONS.forward,
    });
    route.name = "archipelago-route";
    const cable = route.userData.vectorCable;
    route.userData.setRouteTime = undefined;
    return { route, cable, start: linkedIslands[0].start + 0.24 };
  });
}

export function createArchipelagoSequence(tracker) {
  const group = new THREE.Group();
  group.name = "compact-domain-and-app-archipelago";

  const compactRoute = createRoute(tracker, [
    [ARCHIPELAGO_ANCHOR.x, ARCHIPELAGO_ANCHOR.y + 0.12, ARCHIPELAGO_ANCHOR.z],
    [ARCHIPELAGO_ANCHOR.x + 0.7, ARCHIPELAGO_ANCHOR.y + 0.18, ARCHIPELAGO_ANCHOR.z + 0.7],
    [ARCHIPELAGO_ANCHOR.x + 1.35, ARCHIPELAGO_ANCHOR.y + 0.24, ARCHIPELAGO_ANCHOR.z + 1.35],
    [ARCHIPELAGO_ANCHOR.x + 1.9, ARCHIPELAGO_ANCHOR.y + 0.12, ARCHIPELAGO_ANCHOR.z + 1.9],
  ], FACTORY_PALETTE.green, 0.035);
  compactRoute.name = "compact-domain-single-capability";
  const compactCable = compactRoute.userData.vectorCable;
  compactRoute.userData.setRouteTime = undefined;

  const compactDoor = createFreestandingFactoryDoor(tracker, FACTORY_PALETTE.green, {
    position: [
      ARCHIPELAGO_ANCHOR.x + 1.9,
      ARCHIPELAGO_ANCHOR.y + 0.12,
      ARCHIPELAGO_ANCHOR.z + 1.9,
    ],
    scale: 0.18,
    rotationY: Math.PI / 4,
    label: "one door",
    labelColor: 0xbdeacd,
  });
  const compactLabel = createTextLabel(tracker, {
    text: "MUSIC PLAYER", width: 3.2, height: 0.48,
    color: 0xc5ccd5, background: 0x020608,
    position: [ARCHIPELAGO_ANCHOR.x + 1.35, 0.22, ARCHIPELAGO_ANCHOR.z + 1.35],
    fontSize: 48, billboard: true,
  });
  const compactCaption = createCompactCaption(tracker);
  compactCaption.sprite.position.set(
    ARCHIPELAGO_ANCHOR.x + 6.55,
    0.65,
    ARCHIPELAGO_ANCHOR.z + 6.55,
  );

  const islands = APP_DEFINITIONS.map((definition) => createAppIsland(tracker, definition));
  const routes = createArchipelagoRoutes(tracker, islands);
  const counter = createCounter(tracker);
  counter.sprite.position.set(
    ARCHIPELAGO_ANCHOR.x + 13.2,
    0.35,
    ARCHIPELAGO_ANCHOR.z + 13.2,
  );
  const title = createFinalTitle(tracker);
  title.sprite.position.set(
    ARCHIPELAGO_ANCHOR.x - 16,
    4.8,
    ARCHIPELAGO_ANCHOR.z - 16,
  );

  group.add(
    compactRoute,
    compactDoor.group,
    compactLabel,
    compactCaption.sprite,
    ...routes.map(({ route }) => route),
    ...islands.map(({ group: island }) => island),
    counter.sprite,
    title.sprite,
  );

  function setTime(rawTime) {
    const time = THREE.MathUtils.clamp(Number(rawTime) || 0, 0, 148);
    group.position.set(0, 0, 0);
    const connectionProgress = smootherstep(interval(
      time,
      ARCHIPELAGO_TIMING.connection.start,
      ARCHIPELAGO_TIMING.connection.end,
    ));
    setOpacity(compactRoute, connectionProgress * (time >= 134.1 ? 1 : 0));
    setVectorCableTime(compactCable, time, {
      progress: connectionProgress,
      persistent: true,
      active: time >= 134.45,
    });

    const doorRise = smootherstep(interval(time, 135, 136.2));
    compactDoor.group.visible = doorRise > 0.001;
    compactDoor.group.scale.setScalar(0.18 * Math.max(0.001, doorRise));
    compactDoor.group.position.y = 0.22 - (1 - doorRise) * 0.9;
    setFactoryDoorOpen(compactDoor, 0);
    const compactLabelAlpha = smoothstep(interval(time, 136.45, 136.75));
    setOpacity(compactLabel, compactLabelAlpha);
    const captionAlpha = windowAlpha(time, 134, 140.7, 0.7);
    compactCaption.sprite.visible = captionAlpha > 0.001;
    compactCaption.material.opacity = captionAlpha;

    let visibleApps = 0;
    islands.forEach((island, index) => {
      const revealEnd = island.start + ISLAND_BUILD_SECONDS;
      const reveal = smootherstep(interval(time, island.start, revealEnd));
      setVectorLayerLifecycle(island.layer, time, {
        introStart: island.start,
        introEnd: revealEnd,
        opacity: 1,
        outlineShare: 0.42,
      });
      const contentReveal = smootherstep(interval(
        time,
        island.start + ISLAND_BUILD_SECONDS * 0.68,
        island.start + ISLAND_BUILD_SECONDS + 0.2,
      ));
      island.content.position.y = -(1 - contentReveal) * 0.42;
      island.content.scale.setScalar(0.72 + contentReveal * 0.28);
      setOpacity(island.content, contentReveal);
      const cycleStart = revealEnd;
      const lit = smoothstep(interval(time, cycleStart, cycleStart + 0.35));
      const beat = 1 + lit * 0.34 + Math.max(0, Math.sin((time - cycleStart) * 4.5)) * 0.08 * lit;
      island.beacon.scale.setScalar(beat);
      island.halo.scale.setScalar(0.7 + beat * 0.55);
      island.halo.material.opacity = contentReveal * (0.08 + reveal * (0.12 + lit * 0.16));
      if (reveal >= 0.5) visibleApps += 1;
    });

    routes.forEach(({ route, cable, start }, index) => {
      const reveal = smootherstep(interval(time, start, start + ARCHIPELAGO_TIMING.routeDrawSeconds));
      setOpacity(route, reveal * 0.72);
      setVectorCableTime(cable, time + index * 0.8, {
        progress: reveal,
        persistent: true,
        active: reveal > 0.2,
      });
    });

    const counterAlpha = smoothstep(interval(
      time,
      ARCHIPELAGO_TIMING.countFade.start,
      ARCHIPELAGO_TIMING.countFade.end,
    ));
    counter.sprite.visible = counterAlpha > 0.001;
    counter.material.opacity = counterAlpha;
    counter.draw(visibleApps);

    const titlePanelAlpha = smoothstep(interval(time, 144.6, 145.05));
    const titleTextAlpha = windowAlpha(time, 144.6, 147.45, 0.55);
    title.sprite.visible = titlePanelAlpha > 0.001;
    title.material.opacity = titlePanelAlpha;
    title.draw(titleTextAlpha);
  }

  setTime(0);
  return { group, setTime, compactAnchor: ARCHIPELAGO_ANCHOR };
}
