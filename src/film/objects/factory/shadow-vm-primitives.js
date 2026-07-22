import * as THREE from "three";
import { createCanvasSprite, roundedRect } from "./canvas-primitives.js";
import { FACTORY_PALETTE } from "./config.js";
import { createFlatMaterial, createTextLabel, createVectorBox } from "./primitives.js";

const UNIT_Y = new THREE.Vector3(0, 1, 0);
const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1);

function setShadowOpacity(root, opacity) {
  const alpha = clamp01(opacity);
  root.visible = alpha > 0.001;
  root.traverse((object) => {
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (material.userData.shadowBaseOpacity === undefined) {
        material.userData.shadowBaseOpacity = material.opacity;
      }
      const baseOpacity = material.userData.shadowBaseOpacity;
      material.transparent = material.userData.preserveTransparency
        || baseOpacity < 0.999
        || alpha < 0.999;
      material.opacity = baseOpacity * alpha;
    });
  });
}

function createBeamBetween(tracker, start, end, radius, color) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const beam = new THREE.Mesh(
    tracker.geometry(new THREE.CylinderGeometry(radius, radius, direction.length(), 8)),
    createFlatMaterial(tracker, color, { transparent: true, opacity: 1, depthWrite: false }),
  );
  beam.position.copy(start).add(end).multiplyScalar(0.5);
  beam.quaternion.setFromUnitVectors(UNIT_Y, direction.normalize());
  beam.material.userData.shadowBaseOpacity = 1;
  return beam;
}

function configureCanvasSurface(surface) {
  surface.material.userData.preserveTransparency = true;
  surface.material.userData.shadowBaseOpacity = 1;
  surface.material.userData.factoryBaseOpacity = 1;
  return surface;
}

export function createShadowHud(tracker) {
  const group = new THREE.Group();
  group.name = "shadow-vm-hud";
  const surface = configureCanvasSurface(createCanvasSprite(tracker, {
    pixelWidth: 720,
    pixelHeight: 900,
    worldWidth: 3.35,
    worldHeight: 4.18,
    renderOrder: 82,
  }));
  group.add(surface.sprite);
  let renderedState = "";

  const draw = ({
    act = 1,
    mode = "PREDICATE",
    count = 0,
    current = "",
    claims = 0,
    accent = "#b77cff",
  } = {}) => {
    const key = `${act}|${mode}|${count}|${current}|${claims}|${accent}`;
    if (key === renderedState) return;
    renderedState = key;
    const { context } = surface;
    context.clearRect(0, 0, 720, 900);
    roundedRect(context, 38, 34, 644, 824, 28);
    context.fillStyle = "rgba(7, 9, 18, .94)";
    context.fill();
    context.strokeStyle = accent;
    context.lineWidth = 9;
    context.stroke();
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillStyle = "#f1e8ff";
    context.font = "900 48px Consolas, monospace";
    context.fillText(`SHADOW VM · ACT ${Math.min(3, act)}`, 76, 95);
    context.fillStyle = mode === "FAIL-CLOSED" ? "#ff7772" : accent;
    context.font = "800 34px Consolas, monospace";
    context.fillText(mode === "FAIL-CLOSED" ? "FAIL-CLOSED · RED IS THE TARGET" : mode, 76, 150);

    if (act === 1) {
      context.fillStyle = "#82f0ac";
      context.font = "900 78px Consolas, monospace";
      context.fillText(`${claims} / 654`, 76, 246);
      context.fillStyle = "#a9bad0";
      context.font = "700 31px Consolas, monospace";
      ["INPUT HASH", "FRAME HASH", "FILE HASH"].forEach((copy, index) => {
        context.fillText(`${claims >= 654 ? "✓" : "·"} ${copy}`, 90, 338 + index * 66);
      });
    } else if (act === 2) {
      context.fillStyle = "#82f0ac";
      context.font = "900 56px Consolas, monospace";
      context.fillText(current || "DIVERGENCE · 0%", 76, 252);
      context.fillStyle = "#a9bad0";
      context.font = "700 31px Consolas, monospace";
      context.fillText("SAME INPUT", 90, 348);
      context.fillText("TWO CELLS", 90, 414);
      context.fillText("SAME RESULT", 90, 480);
    } else {
      context.fillStyle = "#82f0ac";
      context.font = "900 72px Consolas, monospace";
      context.fillText(`${count} / 7 BLOCKED`, 76, 246);
      context.fillStyle = "#c9d5e5";
      context.font = "700 27px Consolas, monospace";
      const tests = [
        "UNKNOWN IMPORT",
        "PATH ESCAPE",
        "FUEL EXHAUSTED",
        "MEMORY.GROW",
        "FORGED RECEIPT",
        "BYTE TAMPER",
        "REPLAY",
      ];
      tests.forEach((copy, index) => {
        const passed = index < count;
        context.fillStyle = passed ? "#82f0ac" : index === count ? "#ff8a80" : "#657287";
        context.fillText(`${passed ? "✓" : index === count ? "×" : "·"} ${copy}`, 88, 330 + index * 65);
      });
    }
    surface.texture.needsUpdate = true;
  };
  draw();
  return { group, surface, draw };
}

export function setShadowHud(hud, state, opacity = 1) {
  hud.draw(state);
  setShadowOpacity(hud.group, opacity);
}

export function createShadowHashBadge(tracker) {
  const group = new THREE.Group();
  group.name = "shadow-hash-badge";
  const surface = configureCanvasSurface(createCanvasSprite(tracker, {
    pixelWidth: 900,
    pixelHeight: 350,
    worldWidth: 3.9,
    worldHeight: 1.52,
    renderOrder: 80,
  }));
  group.add(surface.sprite);
  let renderedState = "";
  const draw = ({ locked = false, broken = false } = {}) => {
    const key = `${locked}|${broken}`;
    if (key === renderedState) return;
    renderedState = key;
    const { context } = surface;
    context.clearRect(0, 0, 900, 350);
    [[40, "FRAME", "A91E"], [470, "FILE", broken ? "C77C" : "C77B"]].forEach(([x, title, hash]) => {
      roundedRect(context, x, 42, 390, 220, 25);
      context.fillStyle = "rgba(9, 13, 24, .94)";
      context.fill();
      context.strokeStyle = broken ? "#ff6464" : locked ? "#82f0ac" : "#b77cff";
      context.lineWidth = 9;
      context.stroke();
      context.textAlign = "center";
      context.fillStyle = "#9baac0";
      context.font = "800 34px Consolas, monospace";
      context.fillText(title, x + 195, 105);
      context.fillStyle = broken ? "#ff7772" : locked ? "#82f0ac" : "#f1e8ff";
      context.font = "900 72px Consolas, monospace";
      context.fillText(hash, x + 195, 190);
    });
    context.textAlign = "center";
    context.fillStyle = broken ? "#ff7772" : locked ? "#82f0ac" : "#8c99ac";
    context.font = "900 38px Consolas, monospace";
    context.fillText(broken ? "HASH TORN · REJECTED" : locked ? "EXPECTED · LOCKED" : "EXPECTED · WAITING", 450, 315);
    surface.texture.needsUpdate = true;
  };
  draw();
  return { group, surface, draw };
}

export function setShadowHashBadge(badge, state, opacity = 1) {
  badge.draw(state);
  setShadowOpacity(badge.group, opacity);
}

export function createShadowFramePanel(tracker) {
  const group = new THREE.Group();
  group.name = "shadow-frame-panel";
  const hinge = new THREE.Group();
  const panel = createVectorBox(tracker, {
    size: [2.75, 1.55, 0.1],
    color: 0x101826,
    edgeColor: FACTORY_PALETTE.cyan,
    position: [0, 0.78, 0],
  });
  const pixels = [
    [-0.82, 0.98, 0x4c82ff], [-0.2, 1.05, 0x82f0ac], [0.52, 0.92, 0xffc857],
    [-0.68, 0.48, 0x28e0ff], [0.08, 0.54, 0xad7cff], [0.76, 0.42, 0x68b7ff],
  ].map(([x, y, color]) => createVectorBox(tracker, {
    size: [0.42, 0.28, 0.035], color, position: [x, y, 0.075],
  }));
  hinge.add(panel, ...pixels);
  group.add(hinge);
  return { group, hinge };
}

export function setShadowFramePanel(panel, openAmount, opacity = 1) {
  const open = clamp01(openAmount);
  panel.hinge.rotation.x = -Math.PI * 0.5 * (1 - open);
  setShadowOpacity(panel.group, opacity);
}

export function createShadowByteStrip(tracker) {
  const group = new THREE.Group();
  group.name = "shadow-byte-strip";
  const cellGeometry = tracker.geometry(new THREE.BoxGeometry(0.42, 0.1, 0.32));
  const cellMaterial = createFlatMaterial(tracker, 0x27344a);
  const cells = new THREE.InstancedMesh(cellGeometry, cellMaterial, 28);
  const seamGeometry = tracker.geometry(new THREE.BoxGeometry(0.36, 0.06, 0.08));
  const seamMaterial = createFlatMaterial(tracker, FACTORY_PALETTE.green);
  const seam = new THREE.InstancedMesh(seamGeometry, seamMaterial, 14);
  const diffMarker = createVectorBox(tracker, {
    size: [0.46, 0.18, 0.8], color: FACTORY_PALETTE.red, edgeColor: 0xffb0a9,
  });
  const values = createTextLabel(tracker, {
    text: "IDENTICAL",
    width: 4.8,
    height: 0.55,
    color: FACTORY_PALETTE.green,
    background: 0x100b19,
    position: [0, 0.75, 0],
    fontSize: 54,
    billboard: true,
  });
  group.add(cells, seam, diffMarker, values);
  const matrix = new THREE.Matrix4();
  const scale = new THREE.Vector3(1, 1, 1);
  const quaternion = new THREE.Quaternion();
  let renderedDiff = null;
  const update = ({ progress = 0, diff = false } = {}) => {
    const scroll = clamp01(progress) * 0.46;
    for (let index = 0; index < 14; index += 1) {
      const x = (index - 6.5) * 0.46 + scroll;
      [-0.27, 0.27].forEach((z, row) => {
        matrix.compose(new THREE.Vector3(x, 0.08, z), quaternion, scale);
        cells.setMatrixAt(index + row * 14, matrix);
      });
      const seamScale = diff && index === 9 ? new THREE.Vector3(0.01, 0.01, 0.01) : scale;
      matrix.compose(new THREE.Vector3(x, 0.16, 0), quaternion, seamScale);
      seam.setMatrixAt(index, matrix);
    }
    cells.instanceMatrix.needsUpdate = true;
    seam.instanceMatrix.needsUpdate = true;
    diffMarker.visible = diff;
    diffMarker.position.set((9 - 6.5) * 0.46 + scroll, 0.12, 0);
    if (renderedDiff !== diff) {
      renderedDiff = diff;
      values.userData.setText?.(diff ? "DIVERGED 0x1A4F · 7C ≠ 9D" : "IDENTICAL");
    }
  };
  update();
  return { group, cells, seam, diffMarker, values, update };
}

export function setShadowByteStrip(strip, state, opacity = 1) {
  strip.update(state);
  setShadowOpacity(strip.group, opacity);
}

export function createShadowComparisonBridge(tracker, {
  start,
  end,
  height = 2.2,
} = {}) {
  const group = new THREE.Group();
  group.name = "shadow-comparison-bridge";
  const lineGroup = new THREE.Group();
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const control = midpoint.clone();
  control.y += height;
  const curve = new THREE.QuadraticBezierCurve3(start, control, end);
  const points = curve.getPoints(36);
  const rainbow = [0xff6b6b, 0xffc857, 0x82f0ac, 0x28e0ff, 0x68b7ff, 0xad7cff];
  const segments = [];
  points.slice(0, -1).forEach((point, index) => {
    if (index % 2 !== 0) return;
    const beam = createBeamBetween(
      tracker,
      point,
      points[index + 1],
      0.055,
      rainbow[Math.floor(index / 2) % rainbow.length],
    );
    beam.userData.bridgeOrder = segments.length;
    lineGroup.add(beam);
    segments.push(beam);
  });

  const counter = configureCanvasSurface(createCanvasSprite(tracker, {
    pixelWidth: 820,
    pixelHeight: 300,
    worldWidth: 3.65,
    worldHeight: 1.34,
    renderOrder: 86,
  }));
  counter.sprite.position.copy(curve.getPointAt(0.5));
  counter.sprite.position.y += 0.72;
  const counterGroup = new THREE.Group();
  counterGroup.add(counter.sprite);
  group.add(lineGroup, counterGroup);

  let renderedPercent = null;
  const draw = (divergence) => {
    const percent = Math.round(THREE.MathUtils.clamp(divergence, 0, 100));
    if (percent === renderedPercent) return;
    renderedPercent = percent;
    const { context } = counter;
    context.clearRect(0, 0, 820, 300);
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineJoin = "round";
    context.font = "900 58px Consolas, monospace";
    context.lineWidth = 15;
    context.strokeStyle = "#05080d";
    context.fillStyle = "#ffe29a";
    context.strokeText("DIVERGENCE", 410, 72, 760);
    context.fillText("DIVERGENCE", 410, 72, 760);
    context.font = "900 142px Consolas, monospace";
    context.lineWidth = 22;
    context.fillStyle = percent === 0 ? "#82f0ac" : "#f1f7ff";
    context.strokeText(`${percent}%`, 410, 202, 760);
    context.fillText(`${percent}%`, 410, 202, 760);
    counter.texture.needsUpdate = true;
  };
  draw(100);
  return { group, lineGroup, counterGroup, segments, draw };
}

export function setShadowComparisonBridge(bridge, {
  progress = 0,
  divergence = 100,
} = {}, opacity = 1) {
  const drawAmount = clamp01(progress);
  bridge.draw(divergence);
  bridge.segments.forEach((segment, index) => {
    segment.visible = (index + 1) / bridge.segments.length <= drawAmount + 0.001;
  });
  setShadowOpacity(bridge.lineGroup, drawAmount * opacity);
  setShadowOpacity(
    bridge.counterGroup,
    clamp01((drawAmount - 0.28) / 0.32) * opacity,
  );
}

export function createShadowTendril(tracker, { start, control, end, color = FACTORY_PALETTE.red }) {
  const group = new THREE.Group();
  group.name = "shadow-tendril";
  const curve = new THREE.QuadraticBezierCurve3(start, control, end);
  const points = curve.getPoints(20);
  const segments = points.slice(0, -1).map((point, index) => {
    const beam = createBeamBetween(tracker, point, points[index + 1], 0.055, color);
    group.add(beam);
    return beam;
  });
  return { group, segments };
}

export function setShadowTendril(tendril, amount, opacity = 1) {
  const draw = clamp01(amount);
  tendril.group.visible = draw * opacity > 0.001;
  tendril.segments.forEach((segment, index) => {
    const segmentAmount = clamp01(draw * tendril.segments.length - index);
    segment.visible = segmentAmount > 0.001;
    segment.scale.y = Math.max(0.001, segmentAmount);
  });
  setShadowOpacity(tendril.group, opacity);
}

export function createShadowTrapFlash(tracker) {
  const group = new THREE.Group();
  group.name = "shadow-trap-flash";
  const rays = Array.from({ length: 8 }, (_, index) => {
    const angle = index / 8 * Math.PI * 2;
    const start = new THREE.Vector3(Math.cos(angle) * 0.18, 0.08, Math.sin(angle) * 0.18);
    const end = new THREE.Vector3(Math.cos(angle) * 0.82, 0.08, Math.sin(angle) * 0.82);
    const ray = createBeamBetween(tracker, start, end, 0.045, 0xff8179);
    group.add(ray);
    return ray;
  });
  return { group, rays };
}

export function setShadowTrapFlash(flash, amount, opacity = 1) {
  const pulse = Math.sin(clamp01(amount) * Math.PI);
  flash.group.scale.setScalar(0.35 + pulse * 1.05);
  setShadowOpacity(flash.group, pulse * opacity);
}

export function createShadowFuelRing(tracker, radius = 1.1) {
  const group = new THREE.Group();
  group.name = "shadow-fuel-ring";
  const segments = Array.from({ length: 24 }, (_, index) => {
    const angle = index / 24 * Math.PI * 2;
    const segment = createVectorBox(tracker, {
      size: [0.28, 0.08, 0.1],
      color: FACTORY_PALETTE.amber,
      position: [Math.cos(angle) * radius, 0.08, Math.sin(angle) * radius],
    });
    segment.rotation.y = -angle;
    group.add(segment);
    return segment;
  });
  return { group, segments };
}

export function setShadowFuelRing(ring, fuel, opacity = 1) {
  const remaining = Math.round(clamp01(fuel) * ring.segments.length);
  ring.segments.forEach((segment, index) => {
    segment.visible = index < remaining;
  });
  setShadowOpacity(ring.group, opacity);
}

export function createShadowToken(tracker) {
  const group = createVectorBox(tracker, {
    size: [1.15, 0.12, 0.72],
    color: FACTORY_PALETTE.cyan,
    edgeColor: 0xb5f5ff,
  });
  group.name = "shadow-forged-token";
  const label = createTextLabel(tracker, {
    text: "RECEIPT",
    width: 1.2,
    height: 0.28,
    color: FACTORY_PALETTE.white,
    background: FACTORY_PALETTE.ink,
    position: [0, 0.18, 0],
    fontSize: 42,
    billboard: true,
  });
  group.add(label);
  return { group, label };
}

export function setShadowToken(token, amount, rejected, opacity = 1) {
  token.group.scale.setScalar(Math.max(0.001, clamp01(amount)));
  token.group.traverse((object) => {
    if (object.material?.color && object !== token.label) {
      object.material.color.setHex(rejected ? FACTORY_PALETTE.red : FACTORY_PALETTE.cyan);
    }
  });
  token.label.userData.setText?.(rejected ? "FORGED" : "RECEIPT");
  setShadowOpacity(token.group, opacity);
}

export function createShadowFragments(tracker) {
  const group = new THREE.Group();
  group.name = "shadow-ghost-fragments";
  const directions = [
    [-1, 0.4, -1], [-0.3, 1, -1], [0.7, 0.5, -1], [1, 0.8, -0.2],
    [1, 0.3, 0.8], [0.2, 1.2, 1], [-0.8, 0.6, 0.7], [-1, 1, 0.1],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize());
  const pieces = directions.map((direction, index) => {
    const piece = createVectorBox(tracker, {
      size: [0.34, 0.28, 0.34],
      color: 0x6b448b,
      edgeColor: 0xe0b8ff,
    });
    piece.userData.direction = direction;
    piece.userData.spin = (index % 2 ? -1 : 1) * (0.7 + index * 0.1);
    group.add(piece);
    return piece;
  });
  return { group, pieces };
}

export function setShadowFragments(fragments, amount, origin, opacity = 1) {
  const progress = clamp01(amount);
  fragments.group.position.copy(origin);
  fragments.pieces.forEach((piece, index) => {
    piece.position.copy(piece.userData.direction).multiplyScalar(progress * (1.2 + index * 0.08));
    piece.position.y += progress * progress * 0.7;
    piece.rotation.set(progress * piece.userData.spin, progress * 1.8, progress * 0.7);
    piece.scale.setScalar(THREE.MathUtils.lerp(1, 0.35, progress));
  });
  setShadowOpacity(fragments.group, opacity * (1 - progress * 0.72));
}

export function createShadowReceipt(tracker) {
  const group = new THREE.Group();
  group.name = "shadow-testimony";
  const surface = configureCanvasSurface(createCanvasSprite(tracker, {
    pixelWidth: 640,
    pixelHeight: 420,
    worldWidth: 1.6,
    worldHeight: 1.05,
    renderOrder: 84,
  }));
  const { context } = surface;
  context.clearRect(0, 0, 640, 420);
  roundedRect(context, 22, 20, 596, 380, 24);
  context.fillStyle = "rgba(7, 17, 29, .98)";
  context.fill();
  context.strokeStyle = "#82f0ac";
  context.lineWidth = 10;
  context.stroke();
  context.textAlign = "left";
  context.fillStyle = "#82f0ac";
  context.font = "900 62px Consolas, monospace";
  context.fillText("TESTIMONY", 58, 94);
  context.fillStyle = "#d7e5f5";
  context.font = "700 38px Consolas, monospace";
  context.fillText("ID   T-101…107", 58, 176);
  context.fillText("HASH A91E:C77B", 58, 244);
  context.fillText("7 / 7 BLOCKED", 58, 312);
  surface.texture.needsUpdate = true;
  group.add(surface.sprite);
  return { group, surface };
}

export { setShadowOpacity };
