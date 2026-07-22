import * as THREE from "three";
import { FACTORY_PALETTE } from "./config.js";

function createCanvasSprite(tracker, width, height, worldWidth, worldHeight) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const texture = tracker.texture(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = tracker.material(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  }));
  material.userData.preserveTransparency = true;
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(worldWidth, worldHeight, 1);
  sprite.renderOrder = 49;
  return { canvas, context, texture, material, sprite };
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

export function createTwinVerifierPanel(tracker) {
  const group = new THREE.Group();
  group.name = "verifier-twin-console";
  group.position.set(2.2, -0.62, -2.38);
  const surface = createCanvasSprite(tracker, 768, 640, 4.36, 3.64);
  group.add(surface.sprite);

  let renderedState = "";
  const draw = ({
    progress = 0,
    hashesVisible = false,
    result = "WAITING",
    drills = [false, false, false],
  } = {}) => {
    const percent = Math.round(THREE.MathUtils.clamp(progress, 0, 1) * 100);
    const state = `${percent}|${hashesVisible}|${result}|${drills.map(Number).join("")}`;
    if (state === renderedState) return;
    renderedState = state;
    const { context } = surface;
    context.clearRect(0, 0, 768, 640);
    context.lineJoin = "round";
    context.textAlign = "center";
    context.textBaseline = "middle";

    roundedRect(context, 74, 58, 620, 266, 30);
    context.fillStyle = "rgba(7,17,29,.92)";
    context.fill();
    context.strokeStyle = "#42698e";
    context.lineWidth = 10;
    context.stroke();

    [104, 394].forEach((x, index) => {
      roundedRect(context, x, 112, 254, 174, 24);
      context.fillStyle = "#0c1726";
      context.fill();
      context.strokeStyle = index === 1 && result === "RED · BYTE DRIFT" ? "#d66b68" : "#4c779f";
      context.lineWidth = 9;
      context.stroke();
      context.fillStyle = "#d7e5f5";
      context.font = "900 70px Consolas, monospace";
      context.fillText(index === 0 ? "A" : "B", x + 127, 207);
      context.fillStyle = index === 1 && result === "RED · BYTE DRIFT" ? "#f18a83" : "#a9c8e9";
      context.font = "800 35px Consolas, monospace";
      if (hashesVisible) context.fillText("A91E", x + 127, 88);
      context.fillStyle = "#263d56";
      context.fillRect(x + 25, 250, 204, 11);
      context.fillStyle = result === "RED · BYTE DRIFT" ? "#bf635f" : "#7e9eba";
      context.fillRect(x + 25, 250, 204 * (percent / 100), 11);
    });

    const resultVisible = result !== "WAITING";
    context.fillStyle = result === "RED · BYTE DRIFT"
      ? "#ff8a80"
      : result === "EQUAL"
        ? "#82f0ac"
        : "#8698ad";
    context.font = "900 54px Consolas, monospace";
    if (resultVisible) context.fillText(result, 384, 374);

    ["WALL", "IMPORT", "FUEL"].forEach((copy, index) => {
      const y = 440 + index * 66;
      context.beginPath();
      context.arc(130, y, 21, 0, Math.PI * 2);
      context.fillStyle = drills[index] ? "rgba(46,157,91,.92)" : "rgba(7,17,29,.9)";
      context.fill();
      context.strokeStyle = drills[index] ? "#82f0ac" : "#435267";
      context.lineWidth = 9;
      context.stroke();
      context.fillStyle = drills[index] ? "#a9eec1" : "#667489";
      context.font = "800 31px Consolas, monospace";
      context.textAlign = "left";
      context.fillText(copy, 172, y + 2);
    });
    surface.texture.needsUpdate = true;
  };
  draw();
  return { group, sprite: surface.sprite, material: surface.material, draw };
}

export function createVerifierVerdict(tracker) {
  const group = new THREE.Group();
  group.name = "verifier-verdict";
  group.position.set(3.27, 1.15, -3.07);
  const surface = createCanvasSprite(tracker, 384, 384, 0.95, 0.95);
  let renderedVerdict = "";
  const draw = (verdict) => {
    if (verdict === renderedVerdict) return;
    renderedVerdict = verdict;
    const granted = verdict === "granted";
    const { context } = surface;
    context.clearRect(0, 0, 384, 384);
    context.save();
    context.translate(190, 185);
    context.scale(6, 6);
    context.lineWidth = 2.7;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = granted ? "#7af0a7" : "#ff7772";
    context.fillStyle = granted ? "rgba(25,113,68,.96)" : "rgba(119,30,32,.96)";
    context.beginPath();
    context.moveTo(-9, 15);
    context.lineTo(-9, -2);
    context.lineTo(-2, -7);
    context.lineTo(3, -24);
    context.bezierCurveTo(4, -28, 10, -27, 10, -23);
    context.lineTo(10, -11);
    context.lineTo(21, -11);
    context.bezierCurveTo(26, -11, 28, -7, 27, -3);
    context.lineTo(23, 12);
    context.bezierCurveTo(22, 16, 19, 18, 15, 18);
    context.lineTo(0, 18);
    context.closePath();
    context.fill();
    context.stroke();
    context.fillStyle = granted ? "rgba(14,68,40,.98)" : "rgba(70,19,22,.98)";
    context.beginPath();
    context.roundRect(-21, -3, 12, 22, 2);
    context.fill();
    context.stroke();
    context.restore();
    surface.texture.needsUpdate = true;
  };
  draw("denied");
  group.add(surface.sprite);
  return { group, sprite: surface.sprite, material: surface.material, draw };
}

export function createGuardStatusPanel(tracker) {
  const group = new THREE.Group();
  group.name = "guard-status-panel";
  group.position.set(-5.74, 4.2, 2.85);
  const surface = createCanvasSprite(tracker, 1024, 256, 5.3, 1.33);
  group.add(surface.sprite);
  let renderedCopy = "";
  const draw = (copy) => {
    if (copy === renderedCopy) return;
    renderedCopy = copy;
    const { context } = surface;
    context.clearRect(0, 0, 1024, 256);
    roundedRect(context, 18, 18, 988, 220, 42);
    context.fillStyle = "rgba(7,17,29,.94)";
    context.fill();
    context.strokeStyle = "#9d454e";
    context.lineWidth = 12;
    context.stroke();
    context.beginPath();
    context.arc(93, 128, 31, 0, Math.PI * 2);
    context.fillStyle = "rgba(153,53,62,.95)";
    context.fill();
    context.strokeStyle = "#ff7772";
    context.lineWidth = 9;
    context.stroke();
    context.font = "900 61px Consolas, monospace";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.lineJoin = "round";
    context.lineWidth = 13;
    context.strokeStyle = "#05080d";
    context.fillStyle = "#e5edf8";
    context.strokeText(copy, 151, 132, 820);
    context.fillText(copy, 151, 132, 820);
    surface.texture.needsUpdate = true;
  };
  draw("GUARD · WAITING FOR TEST REPORT");
  return { group, material: surface.material, draw };
}

export function setTwinVerifierPanel(panel, {
  progress,
  hashesVisible,
  result,
  drills,
  opacity,
}) {
  panel.draw({ progress, hashesVisible, result, drills });
  panel.group.visible = opacity > 0.001;
  panel.material.opacity = THREE.MathUtils.clamp(opacity, 0, 1);
}

export function setVerifierVerdict(verdict, time) {
  const state = time >= 60.72 && time < 66.8
    ? { kind: "denied", start: 60.72, end: 66.8, rotation: 180, punch: -18 }
    : time >= 75.5 && time < 79.2
      ? { kind: "granted", start: 75.5, end: 79.2, rotation: 0, punch: 14 }
      : null;
  if (!state) {
    verdict.group.visible = false;
    verdict.material.opacity = 0;
    return;
  }
  verdict.draw(state.kind);
  const intro = THREE.MathUtils.smootherstep(time, state.start, state.start + 0.68);
  const outro = 1 - THREE.MathUtils.smoothstep(time, state.end - 0.35, state.end);
  const opacity = intro * outro;
  verdict.group.visible = opacity > 0.001;
  verdict.material.opacity = opacity;
  const punch = Math.sin(intro * Math.PI) * (1 - intro);
  verdict.group.scale.setScalar(THREE.MathUtils.lerp(0.42, 1, intro) * (1 + 0.16 * punch));
  verdict.material.rotation = THREE.MathUtils.degToRad(
    THREE.MathUtils.lerp(-92, state.rotation, intro) + state.punch * punch,
  );
  verdict.material.color.setHex(FACTORY_PALETTE.white);
}

export function setGuardStatusPanel(panel, copy, opacity) {
  panel.draw(copy);
  panel.group.visible = opacity > 0.001;
  panel.material.opacity = THREE.MathUtils.clamp(opacity, 0, 1);
}
