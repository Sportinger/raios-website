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
  const draw = ({ progress = 0, hashesVisible = false, result = "WAITING" } = {}) => {
    const percent = Math.round(THREE.MathUtils.clamp(progress, 0, 1) * 100);
    const state = `${percent}|${hashesVisible}|${result}`;
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
    context.fillStyle = result === "RED · BYTE DRIFT" ? "#ff8a80" : "#8698ad";
    context.font = "900 54px Consolas, monospace";
    if (resultVisible) context.fillText(result, 384, 374);

    ["WALL", "IMPORT", "FUEL"].forEach((copy, index) => {
      const y = 440 + index * 66;
      context.beginPath();
      context.arc(130, y, 21, 0, Math.PI * 2);
      context.strokeStyle = "#435267";
      context.lineWidth = 9;
      context.stroke();
      context.fillStyle = "#667489";
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
  group.position.set(2.6, 3.15, -2.4);
  const surface = createCanvasSprite(tracker, 384, 384, 1.35, 1.35);
  const { context } = surface;
  context.clearRect(0, 0, 384, 384);
  context.strokeStyle = "#ff786f";
  context.fillStyle = "rgba(116,29,35,.48)";
  context.lineWidth = 18;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(95, 92);
  context.lineTo(95, 232);
  context.lineTo(138, 246);
  context.lineTo(166, 326);
  context.quadraticCurveTo(182, 354, 205, 337);
  context.lineTo(205, 250);
  context.lineTo(276, 250);
  context.quadraticCurveTo(311, 250, 317, 214);
  context.lineTo(329, 128);
  context.quadraticCurveTo(333, 92, 295, 92);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeRect(47, 82, 48, 164);
  surface.texture.needsUpdate = true;
  group.add(surface.sprite);
  return { group, sprite: surface.sprite, material: surface.material };
}

export function setTwinVerifierPanel(panel, {
  progress,
  hashesVisible,
  result,
  opacity,
}) {
  panel.draw({ progress, hashesVisible, result });
  panel.group.visible = opacity > 0.001;
  panel.material.opacity = THREE.MathUtils.clamp(opacity, 0, 1);
}

export function setVerifierVerdict(verdict, time) {
  const intro = THREE.MathUtils.smootherstep(time, 60.72, 61.4);
  const outro = 1 - THREE.MathUtils.smootherstep(time, 66.45, 66.8);
  const opacity = intro * outro;
  verdict.group.visible = opacity > 0.001;
  verdict.material.opacity = opacity;
  const punch = Math.sin(intro * Math.PI) * (1 - intro);
  verdict.group.scale.setScalar(0.72 + intro * 0.28 + punch * 0.16);
  verdict.material.rotation = THREE.MathUtils.degToRad(92 * (1 - intro) - 8 * punch);
  verdict.material.color.setHex(FACTORY_PALETTE.white);
}
