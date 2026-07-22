import * as THREE from "three";
import { createCanvasSprite, roundedRect } from "./canvas-primitives.js";
import { FACTORY_PALETTE } from "./config.js";
import { createFactoryDoor } from "./door-primitives.js";
import { createRoute, createTextLabel, createVectorBox } from "./primitives.js";
import { interval, smoothstep, smootherstep } from "./timeline.js";

const COMPACT_ANCHOR = Object.freeze({ x: -0.25, y: 0.28, z: 14.09 });
const SVG_ANCHOR = Object.freeze({ x: 600, y: 410 });
const LATTICE_STEP = 5.8;

const APP_DEFINITIONS = Object.freeze([
  ["FORTNITE", "F", 165, 194, 111.55, 1.12, FACTORY_PALETTE.amber],
  ["BROWSER", "WEB", 310, 122, 111.82, 0.92, FACTORY_PALETTE.blue],
  ["DOCS", "DOC", 455, 50, 112.09, 0.84, FACTORY_PALETTE.cyan],
  ["EMAIL", "MAIL", 600, 122, 112.36, 0.84, FACTORY_PALETTE.red],
  ["WEATHER", "SUN", 745, 50, 112.63, 0.84, FACTORY_PALETTE.cyan],
  ["VIDEO PLAYER", "PLAY", 890, 122, 112.9, 0.98, FACTORY_PALETTE.violet],
  ["MINECRAFT", "M", 1035, 50, 113.17, 1.12, FACTORY_PALETTE.green],
  ["MESSAGES", "CHAT", 600, 266, 113.44, 0.84, FACTORY_PALETTE.violet],
  ["FILES", "DIR", 745, 194, 113.71, 0.84, FACTORY_PALETTE.blue],
  ["PHOTOS", "PIC", 890, 266, 113.98, 0.88, FACTORY_PALETTE.red],
  ["MAPS", "MAP", 1035, 194, 114.25, 0.88, FACTORY_PALETTE.amber],
  ["NOTES", "TXT", 1180, 266, 114.52, 0.84, FACTORY_PALETTE.amber],
  ["CALENDAR", "CAL", 745, 338, 114.79, 0.84, FACTORY_PALETTE.red],
  ["CAMERA", "CAM", 890, 410, 115.06, 0.84, FACTORY_PALETTE.blue],
  ["CONTACTS", "ID", 1035, 338, 115.33, 0.84, FACTORY_PALETTE.cyan],
  ["STUDIO", "EDIT", 1180, 410, 115.6, 0.94, FACTORY_PALETTE.violet],
  ["TERMINAL", "CLI", 455, 554, 115.87, 0.9, FACTORY_PALETTE.green],
  ["STORE", "GET", 600, 626, 116.14, 0.84, FACTORY_PALETTE.blue],
  ["SETTINGS", "CFG", 745, 554, 116.41, 0.84, FACTORY_PALETTE.amber],
  ["GAMES", "PAD", 890, 626, 116.68, 0.84, FACTORY_PALETTE.red],
]);

const ROUTE_DEFINITIONS = Object.freeze([
  [111.55, [[320, 395], [600, 266], [890, 122]]],
  [111.82, [[600, 266], [745, 194], [890, 266], [1035, 194], [1180, 266]]],
  [112.09, [[320, 395], [600, 410], [745, 338], [890, 410], [1035, 338], [1180, 410]]],
  [112.36, [[320, 395], [455, 554], [600, 626], [745, 554], [890, 626]]],
  [112.63, [[455, 50], [600, 122], [745, 50], [890, 122], [1035, 50]]],
  [112.9, [[165, 194], [310, 122], [455, 50]]],
]);

function mapSvgPoint(x, y, height = COMPACT_ANCHOR.y) {
  const horizontal = (x - SVG_ANCHOR.x) / 145;
  const vertical = (y - SVG_ANCHOR.y) / 72;
  return new THREE.Vector3(
    COMPACT_ANCHOR.x + LATTICE_STEP * 0.5 * (horizontal + vertical),
    height,
    COMPACT_ANCHOR.z + LATTICE_STEP * 0.5 * (vertical - horizontal),
  );
}

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
  const [labelCopy, iconCopy, x, y, start, authoredScale, accent] = definition;
  const group = new THREE.Group();
  group.name = `app-island-${labelCopy.toLowerCase().replace(/\s+/g, "-")}`;
  const position = mapSvgPoint(x, y);
  group.position.copy(position);
  const base = createVectorBox(tracker, {
    size: [2.75, 0.36, 2.75],
    color: 0x071a16,
    edgeColor: 0x69df98,
    position: [0, 0.18, 0],
    opacity: 0.94,
  });
  const footing = createVectorBox(tracker, {
    size: [0.48, 0.56, 0.48],
    color: 0x07120f,
    edgeColor: 0x69df98,
    position: [0, -0.1, 1.02],
  });
  const core = createVectorBox(tracker, {
    size: [0.92, 0.58, 0.74],
    color: 0x061014,
    edgeColor: accent,
    position: [0, 0.63, 0],
  });
  const icon = createTextLabel(tracker, {
    text: iconCopy,
    width: 0.9,
    height: 0.38,
    color: accent,
    background: 0x04090d,
    position: [0, 0.67, 0.4],
    fontSize: iconCopy.length > 2 ? 38 : 52,
    billboard: true,
  });
  const stem = createVectorBox(tracker, {
    size: [0.055, 0.52, 0.055],
    color: 0x69df98,
    position: [0, 1.18, 0],
  });
  const beaconMaterial = tracker.material(new THREE.MeshBasicMaterial({ color: 0x94ffba }));
  const beacon = new THREE.Mesh(tracker.geometry(new THREE.SphereGeometry(0.115, 14, 9)), beaconMaterial);
  beacon.position.set(0, 1.48, 0);
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
    position: [0, -0.12, 1.72],
    fontSize: 42,
    billboard: true,
  });
  group.add(base, footing, core, icon, stem, beacon, halo, label);
  return { group, start, authoredScale, beacon, halo };
}

function createArchipelagoRoutes(tracker) {
  return ROUTE_DEFINITIONS.map(([start, points]) => {
    const routePoints = points.map(([x, y]) => mapSvgPoint(x, y, 0.12).toArray());
    const route = createRoute(tracker, routePoints, 0x315f46, 0.014);
    route.name = "archipelago-route";
    const pulseMaterial = tracker.material(new THREE.MeshBasicMaterial({ color: 0x6be29a }));
    const pulse = new THREE.Mesh(tracker.geometry(new THREE.SphereGeometry(0.07, 10, 7)), pulseMaterial);
    route.add(pulse);
    return { route, pulse, start, curve: route.userData.curve };
  });
}

export function createArchipelagoSequence(tracker) {
  const group = new THREE.Group();
  group.name = "compact-domain-and-app-archipelago";

  const compactRoute = createRoute(tracker, [
    mapSvgPoint(320, 395, 0.14).toArray(),
    mapSvgPoint(412, 388, 0.26).toArray(),
    mapSvgPoint(504, 410, 0.34).toArray(),
    mapSvgPoint(596, 447, 0.2).toArray(),
  ], FACTORY_PALETTE.green, 0.035);
  compactRoute.name = "compact-domain-single-capability";
  const compactPulseMaterial = tracker.material(new THREE.MeshBasicMaterial({ color: 0x8affb3 }));
  const compactPulse = new THREE.Mesh(tracker.geometry(new THREE.SphereGeometry(0.1, 12, 8)), compactPulseMaterial);
  compactRoute.add(compactPulse);

  const compactDoor = createFactoryDoor(tracker, FACTORY_PALETTE.green, mapSvgPoint(596, 447, 0.22).toArray(), 0.18);
  compactDoor.group.rotation.y = Math.PI / 4;
  const doorLabel = createTextLabel(tracker, {
    text: "one door", width: 1.35, height: 0.3,
    color: 0xbdeacd, background: 0x03080a,
    position: [0, 4.25, 0], fontSize: 44, billboard: true,
  });
  compactDoor.group.add(doorLabel);
  const compactLabel = createTextLabel(tracker, {
    text: "MUSIC PLAYER", width: 3.2, height: 0.48,
    color: 0xc5ccd5, background: 0x020608,
    position: [COMPACT_ANCHOR.x + 1.35, 0.22, COMPACT_ANCHOR.z + 1.35],
    fontSize: 48, billboard: true,
  });
  const compactCaption = createCompactCaption(tracker);
  compactCaption.sprite.position.set(COMPACT_ANCHOR.x + 6.55, 0.65, COMPACT_ANCHOR.z + 6.55);

  const islands = APP_DEFINITIONS.map((definition) => createAppIsland(tracker, definition));
  const routes = createArchipelagoRoutes(tracker);
  const counter = createCounter(tracker);
  counter.sprite.position.set(COMPACT_ANCHOR.x + 13.2, 0.35, COMPACT_ANCHOR.z + 13.2);
  const title = createFinalTitle(tracker);
  title.sprite.position.set(COMPACT_ANCHOR.x - 16, 4.8, COMPACT_ANCHOR.z - 16);

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
    const time = THREE.MathUtils.clamp(Number(rawTime) || 0, 0, 120);
    const finaleDrift = smootherstep(interval(time, 109, 117));
    group.position.set(3.2 * finaleDrift, 0, 3.2 * finaleDrift);
    const connectionProgress = smootherstep(interval(time, 106.45, 109.1));
    setOpacity(compactRoute, connectionProgress * (time >= 106.1 ? 1 : 0));
    compactPulse.position.copy(compactRoute.userData.curve.getPointAt((time * 0.18) % 1));
    compactPulse.visible = time >= 106.45;

    const doorRise = smootherstep(interval(time, 107, 108.2));
    compactDoor.group.visible = doorRise > 0.001;
    compactDoor.group.scale.setScalar(0.18 * Math.max(0.001, doorRise));
    compactDoor.group.position.y = 0.22 - (1 - doorRise) * 0.9;
    compactDoor.hinge.rotation.y = 0;
    const compactLabelAlpha = smoothstep(interval(time, 108.45, 108.75));
    setOpacity(compactLabel, compactLabelAlpha);
    const captionAlpha = windowAlpha(time, 106, 112.7, 0.7);
    compactCaption.sprite.visible = captionAlpha > 0.001;
    compactCaption.material.opacity = captionAlpha;

    let visibleApps = 0;
    islands.forEach((island, index) => {
      const reveal = smootherstep(interval(time, island.start, island.start + 0.62));
      const bounce = Math.sin(reveal * Math.PI) * (1 - reveal) * 0.22;
      const scale = island.authoredScale * (0.22 + reveal * 0.78 + bounce);
      island.group.visible = reveal > 0.001;
      island.group.scale.setScalar(Math.max(0.001, scale));
      island.group.position.y = COMPACT_ANCHOR.y - (1 - reveal) * 1.15;
      setOpacity(island.group, reveal);
      const cycleStart = 114.3 + index * 0.48;
      const lit = smoothstep(interval(time, cycleStart, cycleStart + 0.35));
      const beat = 1 + lit * 0.34 + Math.max(0, Math.sin((time - cycleStart) * 4.5)) * 0.08 * lit;
      island.beacon.scale.setScalar(beat);
      island.halo.scale.setScalar(0.7 + beat * 0.55);
      island.halo.material.opacity = 0.08 + reveal * (0.12 + lit * 0.16);
      if (reveal >= 0.5) visibleApps += 1;
    });

    routes.forEach(({ route, pulse, start, curve }, index) => {
      const reveal = smootherstep(interval(time, start, start + 0.88));
      setOpacity(route, reveal * 0.72);
      const rawPhase = (time - start) * 0.16 + index * 0.13;
      const phase = ((rawPhase % 1) + 1) % 1;
      pulse.position.copy(curve.getPointAt(phase));
      pulse.visible = reveal > 0.2;
    });

    const counterAlpha = smoothstep(interval(time, 111.75, 112.45));
    counter.sprite.visible = counterAlpha > 0.001;
    counter.material.opacity = counterAlpha;
    counter.draw(visibleApps);

    const titlePanelAlpha = smoothstep(interval(time, 116.6, 117.05));
    const titleTextAlpha = windowAlpha(time, 116.6, 119.45, 0.55);
    title.sprite.visible = titlePanelAlpha > 0.001;
    title.material.opacity = titlePanelAlpha;
    title.draw(titleTextAlpha);
  }

  setTime(0);
  return { group, setTime, compactAnchor: COMPACT_ANCHOR };
}
