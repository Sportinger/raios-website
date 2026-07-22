import * as THREE from "three";
import { FILM_ACTION_TIMINGS } from "../../film-data.js";
import { createCanvasSprite, roundedRect } from "./canvas-primitives.js";
import { FACTORY_LAYOUT, FACTORY_PALETTE } from "./config.js";
import {
  createFreestandingFactoryDoor,
  setFactoryDoorOpen,
} from "./door-primitives.js";
import { createTextLabel, createVectorBox } from "./primitives.js";
import { interval, smoothstep, smootherstep } from "./timeline.js";
import {
  createVectorLayer,
  setVectorLayerLifecycle,
} from "../shared/vector-layer.js";

const PLAYER_ANCHOR = Object.freeze({
  x: FACTORY_LAYOUT.shadow.position.x,
  y: FACTORY_LAYOUT.shadow.position.y + FACTORY_LAYOUT.shadow.thickness,
  z: FACTORY_LAYOUT.shadow.position.z,
});
// Final Foundation kernel bounds expressed in Factory-local coordinates.
// App layers use the kernel top as their base plane and stay inside its inset.
const RUST_SURFACE = Object.freeze({
  centerX: -7.02,
  centerZ: 3.045,
  width: 27.45,
  depth: 27.45,
  top: FACTORY_LAYOUT.shadow.position.y,
});
const GENESIS_CLEARANCE = Object.freeze({
  centerX: PLAYER_ANCHOR.x,
  centerZ: PLAYER_ANCHOR.z + 12.755,
  width: 10.35,
  depth: 10.35,
});
const PLAYER_CLEARANCE = Object.freeze({
  centerX: PLAYER_ANCHOR.x,
  centerZ: PLAYER_ANCHOR.z,
  width: 2.7,
  depth: 2.7,
});
const ARCHIPELAGO_TIMING = FILM_ACTION_TIMINGS.archipelago;
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

function overlapsClearance(x, z, clearance, margin = 1.35) {
  return Math.abs(x - clearance.centerX) < clearance.width / 2 + margin
    && Math.abs(z - clearance.centerZ) < clearance.depth / 2 + margin;
}

function createRustSurfaceSlots(count) {
  const columns = 10;
  const rows = 9;
  const spacingX = 2.6;
  const spacingZ = 3;
  const candidates = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = RUST_SURFACE.centerX + (column - (columns - 1) / 2) * spacingX;
      const z = RUST_SURFACE.centerZ + (row - (rows - 1) / 2) * spacingZ;
      if (overlapsClearance(x, z, GENESIS_CLEARANCE)) continue;
      if (overlapsClearance(x, z, PLAYER_CLEARANCE, 1.1)) continue;
      candidates.push({
        x,
        z,
        distance: Math.hypot(x - PLAYER_ANCHOR.x, z - PLAYER_ANCHOR.z),
      });
    }
  }
  candidates.sort((left, right) => left.distance - right.distance || left.z - right.z || left.x - right.x);
  if (candidates.length < count) {
    throw new Error("Rust surface does not provide enough non-overlapping app slots.");
  }
  return candidates.slice(0, count);
}

const ISLAND_SLOTS = createRustSurfaceSlots(APP_CATALOG.length);
if (APP_CATALOG.length !== ARCHIPELAGO_TIMING.islandCount) {
  throw new Error("Archipelago app catalog and configured island count must match.");
}
const ISLAND_SIZE_PATTERN = Object.freeze([0.72, 0.86, 1.06, 0.78, 1.18, 0.94, 1.1, 0.74, 1.2, 0.84]);
const APP_DEFINITIONS = Object.freeze(APP_CATALOG.map(([labelCopy, iconCopy, accent], index) => {
  const slot = ISLAND_SLOTS[index];
  const widthScale = ISLAND_SIZE_PATTERN[index % ISLAND_SIZE_PATTERN.length];
  const depthScale = ISLAND_SIZE_PATTERN[(index * 3 + 4) % ISLAND_SIZE_PATTERN.length];
  return Object.freeze({
    labelCopy,
    iconCopy,
    accent,
    start: ISLAND_REVEAL_START + index * ISLAND_STAGGER_SECONDS,
    width: 2.1 * widthScale,
    depth: 2.1 * depthScale,
    height: 0.28 + 0.13 * ISLAND_SIZE_PATTERN[(index + 6) % ISLAND_SIZE_PATTERN.length],
    position: Object.freeze({
      x: slot.x,
      y: RUST_SURFACE.top,
      z: slot.z,
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
  };
}

export function createArchipelagoSequence(tracker) {
  const group = new THREE.Group();
  group.name = "compact-domain-and-app-archipelago";

  const compactDoor = createFreestandingFactoryDoor(tracker, FACTORY_PALETTE.green, {
    position: [
      PLAYER_ANCHOR.x + 1.35,
      PLAYER_ANCHOR.y + 0.06,
      PLAYER_ANCHOR.z + 1.35,
    ],
    scale: 0.18,
    rotationY: Math.PI / 4,
    label: "one door",
    labelColor: 0xbdeacd,
  });
  const compactLabel = createTextLabel(tracker, {
    text: "MUSIC PLAYER", width: 3.2, height: 0.48,
    color: 0xc5ccd5, background: 0x020608,
    position: [PLAYER_ANCHOR.x + 0.95, PLAYER_ANCHOR.y + 0.01, PLAYER_ANCHOR.z + 0.95],
    fontSize: 48, billboard: true,
  });
  const compactCaption = createCompactCaption(tracker);
  compactCaption.sprite.position.set(
    PLAYER_ANCHOR.x + 5.4,
    0.65,
    PLAYER_ANCHOR.z + 5.4,
  );

  const islands = APP_DEFINITIONS.map((definition) => createAppIsland(tracker, definition));
  const counter = createCounter(tracker);
  counter.sprite.position.set(
    RUST_SURFACE.centerX + 8.4,
    0.35,
    RUST_SURFACE.centerZ + 10.8,
  );
  const title = createFinalTitle(tracker);
  title.sprite.position.set(
    RUST_SURFACE.centerX - 12,
    4.8,
    RUST_SURFACE.centerZ - 12,
  );

  group.add(
    compactDoor.group,
    compactLabel,
    compactCaption.sprite,
    ...islands.map(({ group: island }) => island),
    counter.sprite,
    title.sprite,
  );

  function setTime(rawTime) {
    const time = THREE.MathUtils.clamp(Number(rawTime) || 0, 0, 148);
    group.position.set(0, 0, 0);

    const doorRise = smootherstep(interval(time, 135, 136.2));
    compactDoor.group.visible = doorRise > 0.001;
    compactDoor.group.scale.setScalar(0.18 * Math.max(0.001, doorRise));
    compactDoor.group.position.y = PLAYER_ANCHOR.y + 0.01 - (1 - doorRise) * 0.9;
    setFactoryDoorOpen(compactDoor, 0);
    const compactLabelAlpha = smoothstep(interval(time, 136.45, 136.75));
    setOpacity(compactLabel, compactLabelAlpha);
    const captionAlpha = windowAlpha(time, 134, 140.7, 0.7);
    compactCaption.sprite.visible = captionAlpha > 0.001;
    compactCaption.material.opacity = captionAlpha;

    let visibleApps = 0;
    islands.forEach((island) => {
      const revealEnd = island.start + ISLAND_BUILD_SECONDS;
      const reveal = smootherstep(interval(time, island.start, revealEnd));
      const contentEnd = island.start + ISLAND_BUILD_SECONDS + 0.2;
      const phase = time < island.start ? "before" : time < contentEnd ? "building" : "built";
      const contentReveal = smootherstep(interval(
        time,
        island.start + ISLAND_BUILD_SECONDS * 0.68,
        contentEnd,
      ));
      if (phase === "building" || phase !== island.timelinePhase) {
        setVectorLayerLifecycle(island.layer, time, {
          introStart: island.start,
          introEnd: revealEnd,
          opacity: 1,
          outlineShare: 0.42,
        });
        island.content.position.y = -(1 - contentReveal) * 0.32;
        island.content.scale.setScalar(0.78 + contentReveal * 0.22);
        setOpacity(island.content, contentReveal);
        island.beacon.scale.setScalar(0.88 + contentReveal * 0.12);
        island.halo.scale.setScalar(1.05 + contentReveal * 0.18);
        island.halo.material.opacity = contentReveal * 0.2;
        island.timelinePhase = phase;
      }
      if (reveal >= 0.5) visibleApps += 1;
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
  return { group, setTime, compactAnchor: PLAYER_ANCHOR };
}
