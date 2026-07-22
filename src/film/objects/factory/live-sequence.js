import * as THREE from "three";
import { createCanvasSprite, roundedRect } from "./canvas-primitives.js";
import { FACTORY_LAYOUT, FACTORY_PALETTE } from "./config.js";
import {
  createFactoryDoorOnSurface,
  FACTORY_STANDARD_DOOR_SCALE,
  setFactoryDoorEmergence,
  setFactoryDoorOpen,
} from "./door-primitives.js";
import { createRoute, createTextLabel, createVectorBox } from "./primitives.js";
import { interval, smoothstep, smootherstep } from "./timeline.js";
import {
  cableEdgeDrop,
  cableSurfacePoint,
  VECTOR_CABLE_DIRECTIONS,
} from "../shared/vector-cable.js";

const DOMAIN_CENTER = new THREE.Vector3(
  FACTORY_LAYOUT.shadow.position.x,
  FACTORY_LAYOUT.shadow.position.y + FACTORY_LAYOUT.shadow.thickness,
  FACTORY_LAYOUT.shadow.position.z,
);
const COMPACT_DOMAIN_CENTER = new THREE.Vector3(-0.25, 1.5, 14.09);
const AGENT_PORT = new THREE.Vector3(-11.695, 0.18, 13.45);
const DOMAIN_DOOR_X = Object.freeze([-4.48, -1.48, 1.52]);
const LIVE_KERNEL_SURFACE = Object.freeze({ id: "live-kernel", top: AGENT_PORT.y - 0.04 });

function windowAlpha(time, start, end, fade) {
  return smoothstep(interval(time, start, start + fade))
    * (1 - smoothstep(interval(time, end - fade, end)));
}

function setOpacity(root, opacity) {
  const value = THREE.MathUtils.clamp(opacity, 0, 1);
  root.visible = value > 0.001;
  root.traverse((object) => {
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (material.userData.liveBaseOpacity === undefined) {
        material.userData.liveBaseOpacity = material.opacity;
      }
      const baseOpacity = material.userData.liveBaseOpacity;
      material.transparent = material.userData.preserveTransparency || baseOpacity < 0.999 || value < 0.999;
      material.opacity = baseOpacity * value;
    });
  });
}

function createDomain(tracker) {
  const group = new THREE.Group();
  group.name = "player-domain";
  group.position.copy(DOMAIN_CENTER);
  const surface = new THREE.Group();
  surface.name = "player-domain-surface";
  const { width, depth, thickness, gridStep } = FACTORY_LAYOUT.shadow;
  const slab = createVectorBox(tracker, {
    size: [width, thickness, depth],
    color: 0x0b1a17,
    edgeColor: 0x70e29a,
    position: [0, -thickness / 2, 0],
    opacity: 1,
  });
  surface.add(slab);
  for (let offset = -4.2; offset <= 4.2; offset += gridStep) {
    const xLine = createRoute(tracker, [[offset, 0.035, -depth / 2], [offset, 0.035, depth / 2]], 0x244f40, 0.014);
    const zLine = createRoute(tracker, [[-width / 2, 0.035, offset], [width / 2, 0.035, offset]], 0x244f40, 0.014);
    surface.add(xLine, zLine);
  }
  const title = createTextLabel(tracker, {
    text: "PLAYER DOMAIN",
    width: 3.35,
    height: 0.42,
    color: 0x6b836f,
    background: 0x07110e,
    position: [0, -thickness * 0.45, depth / 2 + 0.04],
    fontSize: 45,
    billboard: true,
  });
  surface.add(title);
  group.add(surface);

  const labels = ["fb region", "input", "file door"];
  const domainSurface = Object.freeze({
    id: "player-domain",
    centerX: 0,
    centerZ: 0,
    width,
    depth,
    top: 0,
  });
  const routeSurface = Object.freeze({
    id: "player-domain-world",
    centerX: DOMAIN_CENTER.x,
    centerZ: DOMAIN_CENTER.z,
    width,
    depth,
    top: DOMAIN_CENTER.y,
  });
  const doors = DOMAIN_DOOR_X.map((x, index) => {
    const door = createFactoryDoorOnSurface(tracker, FACTORY_PALETTE.edge, {
      surface: domainSurface,
      edge: "front",
      along: x,
      scale: FACTORY_STANDARD_DOOR_SCALE,
      label: labels[index],
      labelColor: 0xa9bdad,
    });
    group.add(door.group);
    return door;
  });
  return {
    group,
    surface,
    slab,
    title,
    doors,
    supportSurface: domainSurface,
    routeSurface,
  };
}

function createDomainRoutes(tracker, domain) {
  return domain.doors.map((door, index) => {
    const end = DOMAIN_CENTER.clone();
    end.x += door.group.position.x * 0.2;
    end.y += 0.1;
    end.z += 0.12;
    const route = createRoute(tracker, [
      AGENT_PORT.toArray(),
      cableSurfacePoint(LIVE_KERNEL_SURFACE, AGENT_PORT.x, AGENT_PORT.z),
      cableSurfacePoint(LIVE_KERNEL_SURFACE, -11.0 + index * 0.34, 9.4 - index * 0.42),
      ...cableEdgeDrop(
        domain.routeSurface,
        LIVE_KERNEL_SURFACE,
        "front",
        door.group.position.x,
      ).reverse(),
      cableSurfacePoint(domain.routeSurface, end.x, end.z),
    ], FACTORY_PALETTE.green, 0.035, {
      direction: VECTOR_CABLE_DIRECTIONS.bidirectional,
    });
    route.name = `player-capability-route-${index + 1}`;
    return route;
  });
}

function createEgressDots(tracker) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.05, 0.42, 0.855),
    new THREE.Vector3(-2.25, 0.62, 0.62),
    new THREE.Vector3(-3.2, 0.42, 0.2),
    new THREE.Vector3(-3.882, 0.26, -0.157),
  ], false, "centripetal");
  const material = tracker.material(new THREE.MeshBasicMaterial({ color: 0x7ff0ab }));
  const geometry = tracker.geometry(new THREE.SphereGeometry(0.105, 12, 8));
  const dots = Array.from({ length: 5 }, () => {
    const dot = new THREE.Mesh(geometry, material);
    dot.renderOrder = 22;
    return dot;
  });
  return { curve, dots };
}

function drawPlayerUi(surface, time) {
  const track = smoothstep(interval(time, 97, 105.4));
  const trapped = time >= 101.4 && time < 103.1;
  const fresh = time >= 103.1;
  const state = `${Math.round(track * 100)}|${trapped}|${fresh}|${time >= 102.25}`;
  if (surface.renderedState === state) return;
  surface.renderedState = state;
  const { canvas, context, texture } = surface;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.scale(canvas.width / 850, canvas.height / 520);
  context.lineJoin = "round";
  context.textBaseline = "middle";
  context.font = "800 12px Consolas, monospace";

  context.fillStyle = "#aebdca";
  context.textAlign = "right";
  context.fillText("F12 · REVOKE ALL", 622, 18);
  roundedRect(context, 0, 30, 635, 466, 18);
  context.fillStyle = "rgba(4,9,15,.88)";
  context.fill();
  context.strokeStyle = "#20384f";
  context.lineWidth = 3;
  context.stroke();
  roundedRect(context, 16, 46, 603, 434, 11);
  context.fillStyle = "#0e1824";
  context.fill();
  context.strokeStyle = "#31465b";
  context.lineWidth = 2;
  context.stroke();
  context.textAlign = "left";
  context.fillStyle = "#dce7ef";
  context.fillText("MUSIC PLAYER", 56, 88);
  context.fillStyle = "#9baab8";
  context.font = "700 11px Consolas, monospace";
  context.fillText("running in its cage", 56, 116);

  roundedRect(context, 56, 157, 164, 164, 16);
  context.fillStyle = "#17314d";
  context.fill();
  context.strokeStyle = "#67a7dc";
  context.lineWidth = 2;
  context.stroke();
  context.textAlign = "center";
  context.fillStyle = "#c8e2f7";
  context.font = "900 52px Consolas, monospace";
  context.fillText("♪", 138, 250);
  context.textAlign = "left";
  context.font = "800 12px Consolas, monospace";
  context.fillStyle = "#d9e3eb";
  context.fillText("dream.wav", 264, 184);
  context.fillStyle = "#9baab8";
  context.font = "700 11px Consolas, monospace";
  context.fillText("track 01 · local file door", 264, 214);
  roundedRect(context, 264, 252, 300, 8, 4);
  context.fillStyle = "#050a0f";
  context.fill();
  roundedRect(context, 264, 252, 30 + 270 * track, 8, 4);
  context.fillStyle = "#65dd96";
  context.shadowBlur = 12;
  context.shadowColor = "#65dd96";
  context.fill();
  context.shadowBlur = 0;
  [34, 54, 41, 59, 30].forEach((height, index) => {
    context.fillStyle = "#46ad76";
    context.fillRect(264 + index * 24, 344 - height, 12, height);
  });

  if (trapped || fresh) {
    roundedRect(context, 678, 290, 140, 126, 8);
    context.fillStyle = "#15253a";
    context.fill();
    context.strokeStyle = trapped ? "#ff6865" : "#69df98";
    context.lineWidth = 3;
    context.stroke();
    context.textAlign = "center";
    context.font = "900 18px Consolas, monospace";
    context.fillStyle = trapped ? "#ff7772" : "#a9efc1";
    context.fillText(trapped ? "TRAP" : "FRESH", 748, 360);
    if (trapped && time < 102.25) {
      context.beginPath();
      context.arc(748, 310, 14, 0, Math.PI * 2);
      context.fillStyle = "#ff6464";
      context.shadowBlur = 22;
      context.shadowColor = "#ff6464";
      context.fill();
      context.shadowBlur = 0;
    }
  }
  if (time < 102.25) {
    context.strokeStyle = trapped ? "#ff6865" : "#416989";
    context.lineWidth = 6;
    context.setLineDash([18, 14]);
    context.beginPath();
    context.moveTo(620, 415);
    context.lineTo(820, 415);
    context.stroke();
    context.setLineDash([]);
  }
  context.restore();
  texture.needsUpdate = true;
}

function createPlayerUi(tracker) {
  const surface = createCanvasSprite(tracker, {
    pixelWidth: 1700,
    pixelHeight: 1040,
    worldWidth: 14.2,
    worldHeight: 8.68,
    renderOrder: 72,
  });
  surface.sprite.position.set(-4.29, -0.95, -5.71);
  return surface;
}

function createCaption(tracker, lines, width, height) {
  const surface = createCanvasSprite(tracker, {
    pixelWidth: 1400,
    pixelHeight: 270,
    worldWidth: width,
    worldHeight: height,
    renderOrder: 70,
  });
  const { context } = surface;
  context.clearRect(0, 0, 1400, 270);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "900 42px Consolas, monospace";
  lines.forEach((line, index) => {
    context.fillStyle = index === 1 ? "#77e4a0" : "#c4d0db";
    context.strokeStyle = "#03070b";
    context.lineWidth = 12;
    context.strokeText(line, 700, 55 + index * 78, 1340);
    context.fillText(line, 700, 55 + index * 78, 1340);
  });
  surface.texture.needsUpdate = true;
  return surface;
}

export function createLiveSequence(tracker) {
  const group = new THREE.Group();
  group.name = "live-release-and-runtime";
  const domain = createDomain(tracker);
  const routes = createDomainRoutes(tracker, domain);
  const egress = createEgressDots(tracker);
  const playerUi = createPlayerUi(tracker);
  const egressCaption = createCaption(tracker, [
    "OWNER APPROVED · EGRESS GATE COMPLETE",
    "GUARD OPENS /out → PLAYER.WASM DOMAIN",
    "THE APPROVED PROGRAM LEAVES THE BUILD WORLD.",
  ], 11.6, 2.24);
  egressCaption.sprite.position.set(4.6, -2.2, -8.3);
  const crashCaption = createCaption(tracker, [
    "A CRASH COSTS ONE BLOCK, NEVER THE HOUSE.",
  ], 13, 0.9);
  crashCaption.sprite.position.set(-7.8, -8.3, 7.8);
  group.add(domain.group, ...routes, ...egress.dots, playerUi.sprite, egressCaption.sprite, crashCaption.sprite);

  function setTime(rawTime) {
    const time = THREE.MathUtils.clamp(Number(rawTime) || 0, 0, 120);
    const domainAlpha = windowAlpha(time, 88.8, 120, 0.45);
    const domainRise = smootherstep(interval(time, 89.2, 92));
    const contraction = smootherstep(interval(time, 106, 109));
    const finaleDrift = smootherstep(interval(time, 109, 117));
    const compactX = COMPACT_DOMAIN_CENTER.x + 4.1 * finaleDrift;
    const compactZ = COMPACT_DOMAIN_CENTER.z + 4.1 * finaleDrift;
    setOpacity(domain.group, domainAlpha);
    domain.group.position.set(
      THREE.MathUtils.lerp(DOMAIN_CENTER.x, compactX, contraction),
      DOMAIN_CENTER.y - (1 - domainRise) * 2.6,
      THREE.MathUtils.lerp(DOMAIN_CENTER.z, compactZ, contraction),
    );
    domain.group.scale.setScalar(THREE.MathUtils.lerp(1, 0.25, contraction));
    domain.title.material.opacity = domainAlpha * (1 - smootherstep(interval(time, 106, 109)));
    domain.doors.forEach((door, index) => {
      const delay = index * 0.05;
      const outline = smootherstep(interval(time, 92.35 + delay, 92.72 + delay));
      const labelWrite = smootherstep(interval(time, 92.64 + delay, 93.04 + delay));
      const rise = smootherstep(interval(time, 92.92 + delay, 93.55 + delay));
      door.group.visible = outline > 0.001 && time < 106.55;
      setFactoryDoorEmergence(door, {
        porchAmount: outline,
        labelAmount: labelWrite,
        riseAmount: rise,
        opacity: domainAlpha,
      });
      setFactoryDoorOpen(door, smootherstep(interval(time, 93.55, 94.35)));
    });
    const routeProgress = smootherstep(interval(time, 92.35, 95.35));
    routes.forEach((route, index) => {
      route.visible = routeProgress > index * 0.08 && time < 106.6;
      setOpacity(route, route.visible ? Math.min(1, (routeProgress - index * 0.08) / 0.32) : 0);
    });

    egress.dots.forEach((dot, index) => {
      const start = 88 + index * 0.16;
      const end = 89.28 + index * 0.16;
      const progress = smootherstep(interval(time, start, end));
      dot.position.copy(egress.curve.getPointAt(progress));
      dot.visible = windowAlpha(time, start, end, 0.18) > 0.001;
    });

    const uiAlpha = windowAlpha(time, 96, 106, 0.45);
    playerUi.sprite.visible = uiAlpha > 0.001;
    playerUi.material.opacity = uiAlpha;
    if (playerUi.sprite.visible) drawPlayerUi(playerUi, time);
    const egressAlpha = windowAlpha(time, 88, 96, 0.6);
    egressCaption.sprite.visible = egressAlpha > 0.001;
    egressCaption.material.opacity = egressAlpha;
    const crashAlpha = windowAlpha(time, 96, 106, 0.45);
    crashCaption.sprite.visible = crashAlpha > 0.001;
    crashCaption.material.opacity = crashAlpha;
  }

  setTime(0);
  return { group, setTime, domain, routes, playerUi };
}
