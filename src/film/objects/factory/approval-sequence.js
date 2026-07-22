import * as THREE from "three";
import { createCanvasSprite, roundedRect } from "./canvas-primitives.js";
import { interval, smoothstep, smootherstep } from "./timeline.js";
import {
  createVectorCable,
  setVectorCableState,
  VECTOR_CABLE_DIRECTIONS,
} from "../shared/vector-cable.js";

const CARD_LOGICAL_WIDTH = 674;
const CARD_LOGICAL_HEIGHT = 516;

function windowAlpha(time, start, end, fade) {
  return smoothstep(interval(time, start, start + fade))
    * (1 - smoothstep(interval(time, end - fade, end)));
}

function drawText(context, copy, x, y, {
  size = 11,
  color = "#aebed0",
  align = "left",
  weight = 800,
  maxWidth,
} = {}) {
  context.font = `${weight} ${size}px Consolas, ui-monospace, monospace`;
  context.textAlign = align;
  context.textBaseline = "middle";
  context.fillStyle = color;
  context.fillText(copy, x, y, maxWidth);
}

function drawApprovalCard(surface, time) {
  const pointerProgress = smoothstep(interval(time, 110.15, 112.25));
  const clickDown = smoothstep(interval(time, 112.12, 112.25))
    * (1 - smoothstep(interval(time, 112.25, 112.5)));
  const pointerAlpha = windowAlpha(time, 110, 113.4, 0.3);
  const approved = time >= 112.55;
  const stampProgress = smootherstep(interval(time, 112.2, 113));
  const state = `${approved}|${Math.round(pointerProgress * 120)}|${Math.round(clickDown * 20)}|${Math.round(stampProgress * 30)}|${Math.round(pointerAlpha * 20)}`;
  if (surface.renderedState === state) return;
  surface.renderedState = state;

  const { canvas, context, texture } = surface;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.scale(canvas.width / CARD_LOGICAL_WIDTH, canvas.height / CARD_LOGICAL_HEIGHT);
  context.lineJoin = "round";

  roundedRect(context, 0, 0, 674, 516, 20);
  context.fillStyle = "rgba(0,4,9,.72)";
  context.fill();
  context.strokeStyle = "rgba(64,95,126,.65)";
  context.lineWidth = 2;
  context.stroke();

  roundedRect(context, 16, 16, 642, 484, 13);
  context.fillStyle = "rgba(10,20,31,.96)";
  context.fill();
  context.strokeStyle = "#263d55";
  context.lineWidth = 1.5;
  context.stroke();
  roundedRect(context, 16, 16, 642, 5, 2.5);
  context.fillStyle = "#4897f2";
  context.fill();

  drawText(context, "GUARD / LIVE EXECUTION GRANT", 56, 56, { size: 11, color: "#aab9ca" });
  drawText(context, "Authorize PLAYER.WASM", 56, 105, { size: 15, color: "#e4edf7", weight: 900 });
  drawText(context, "Run this exact WebAssembly service — with only the rights below.", 56, 135, {
    size: 10,
    color: "#aeb8c6",
  });

  roundedRect(context, 472, 77, 78, 31, 15.5);
  context.fillStyle = "#14263a";
  context.fill();
  context.strokeStyle = "#4f8fc8";
  context.lineWidth = 1.5;
  context.stroke();
  drawText(context, "WASM", 511, 98, { size: 10, color: "#9fceff", align: "center", weight: 900 });

  const drawFact = (x, width, title, value, passed = false) => {
    roundedRect(context, x, 159, width, 74, 9);
    context.fillStyle = "#08121e";
    context.fill();
    context.strokeStyle = passed ? "#275f46" : "#263d55";
    context.lineWidth = 1.5;
    context.stroke();
    drawText(context, title, x + 19, 184, { size: 9, color: "#91a4b9" });
    drawText(context, value, x + 19, 213, {
      size: 11,
      color: passed ? "#b2e4c2" : "#c5d3e2",
      weight: 900,
    });
  };
  drawFact(56, 290, "EXACT PROGRAM HASH", "a91e44c07d21…");
  drawFact(362, 256, "SHADOW-WORLD REPORT", "PASS · SIGNED 03", true);

  drawText(context, "EXACT CAPABILITIES", 56, 266, { size: 10, color: "#aebbc9" });
  [
    [56, 142, "display · fb"],
    [211, 126, "input · read"],
    [350, 174, "file · dream.wav"],
  ].forEach(([x, width, copy]) => {
    roundedRect(context, x, 281, width, 36, 18);
    context.fillStyle = "#112337";
    context.fill();
    context.strokeStyle = "#416989";
    context.lineWidth = 1.5;
    context.stroke();
    drawText(context, copy, x + width / 2, 304, {
      size: 10,
      color: "#9bc9f5",
      align: "center",
      weight: 900,
    });
  });

  ["REPORT", "HASH", "RIGHTS", "OWNER"].forEach((copy, index) => {
    const x = 56 + index * 133;
    const passed = index < 3 || approved;
    roundedRect(context, x, 336, 125, 30, 7);
    context.fillStyle = passed ? "rgba(11,42,31,.9)" : "rgba(54,42,13,.9)";
    context.fill();
    context.strokeStyle = passed ? "#2a8153" : "#9a742d";
    context.lineWidth = 1.4;
    context.stroke();
    context.beginPath();
    context.arc(x + 15, 351, 4, 0, Math.PI * 2);
    context.fillStyle = passed ? "#67dd95" : "#e7b75c";
    context.fill();
    drawText(context, copy, x + 27, 352, {
      size: 8.5,
      color: passed ? "#bde9ca" : "#d9bb78",
      weight: 900,
    });
  });

  roundedRect(context, 56, 387, 562, 70, 11);
  context.fillStyle = approved ? "#2bab65" : "#3988d8";
  context.fill();
  context.strokeStyle = approved ? "#8af0ae" : "#84bcf4";
  context.lineWidth = 2;
  context.stroke();
  drawText(context, approved ? "LIVE EXECUTION GRANTED" : "GRANT LIVE EXECUTION", 337, 417, {
    size: 12,
    color: "#eef8ff",
    align: "center",
    weight: 900,
  });
  drawText(
    context,
    approved
      ? "BOUND TO PLAYER.WASM + THIS EXACT RIGHT SET"
      : "PLAYER.WASM · EXACT HASH · 3 CAPABILITIES",
    337,
    441,
    { size: 9, color: "#cfdfed", align: "center", weight: 900 },
  );

  if (stampProgress > 0.001) {
    context.save();
    context.globalAlpha = stampProgress;
    const stampScale = 0.58 + stampProgress * 0.42;
    context.translate(591, 85);
    context.scale(stampScale, stampScale);
    context.translate(-591, -85);
    context.fillStyle = "#c79a46";
    context.strokeStyle = "#f2c86b";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(578, 52);
    context.lineTo(600, 52);
    context.lineTo(605, 76);
    context.lineTo(615, 83);
    context.lineTo(615, 98);
    context.lineTo(565, 98);
    context.lineTo(565, 83);
    context.lineTo(575, 76);
    context.closePath();
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(575, 106);
    context.lineTo(586, 117);
    context.lineTo(608, 94);
    context.strokeStyle = "#70e29a";
    context.lineWidth = 7;
    context.lineCap = "round";
    context.stroke();
    context.restore();
  }

  if (pointerAlpha > 0.001) {
    const x = 527 + 58 * (1 - pointerProgress);
    const y = 417 - 54 * (1 - pointerProgress) + 5 * clickDown;
    context.save();
    context.globalAlpha = pointerAlpha;
    context.translate(x, y);
    context.scale(1 - 0.045 * clickDown, 1 - 0.045 * clickDown);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, 45);
    context.lineTo(12, 34);
    context.lineTo(21, 55);
    context.lineTo(31, 50);
    context.lineTo(21, 30);
    context.lineTo(38, 30);
    context.closePath();
    context.fillStyle = "#f4f8fb";
    context.fill();
    context.strokeStyle = "#06101a";
    context.lineWidth = 3;
    context.stroke();
    context.restore();
  }

  context.restore();
  texture.needsUpdate = true;
}

function createRemoteDenied(tracker) {
  const surface = createCanvasSprite(tracker, {
    pixelWidth: 1024,
    pixelHeight: 192,
    worldWidth: 5.5,
    worldHeight: 1.03,
    renderOrder: 68,
  });
  const { context } = surface;
  context.clearRect(0, 0, 1024, 192);
  context.strokeStyle = "#ff6865";
  context.lineWidth = 10;
  context.setLineDash([38, 25]);
  context.beginPath();
  context.moveTo(30, 148);
  context.lineTo(994, 148);
  context.stroke();
  context.setLineDash([]);
  context.font = "900 48px Consolas, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#ff7772";
  context.fillText("REMOTE START DENIED", 512, 72);
  surface.texture.needsUpdate = true;
  return surface;
}

function createGrantRoute(tracker) {
  return createVectorCable({
    tracker,
    points: [
    new THREE.Vector3(-7.465, 1.16, 2.436),
    new THREE.Vector3(-7.465, 0.76, 2.436),
    new THREE.Vector3(-5.85, 0.76, 0.7),
    new THREE.Vector3(-3.865, 0.76, -1.164),
    new THREE.Vector3(-3.865, 2.56, -1.164),
    ],
    color: 0x69e498,
    underlayColor: 0x173828,
    radius: 0.066,
    underlayRadius: 0.045,
    direction: VECTOR_CABLE_DIRECTIONS.forward,
    pulseRadius: 0.12,
    name: "guard-live-grant-route",
  });
}

function setGrantRoute(route, time) {
  const grant = smootherstep(interval(time, 112.55, 113.25));
  const revoke = smootherstep(interval(time, 120.15, 121));
  const amount = grant * (1 - revoke);
  setVectorCableState(route, {
    progress: amount,
    time,
    persistent: amount >= 0.999,
    active: amount >= 0.999 && time < 120.15,
  });
}

export function createApprovalSequence(tracker, { guardMachine }) {
  const group = new THREE.Group();
  group.name = "approval-sequence";
  const card = createCanvasSprite(tracker, {
    pixelWidth: 2022,
    pixelHeight: 1548,
    worldWidth: 19.3,
    worldHeight: 14.78,
    renderOrder: 67,
  });
  card.sprite.position.set(-8.305, -1.8, 5.415);
  const remoteDenied = createRemoteDenied(tracker);
  remoteDenied.sprite.position.set(-17.165, -6.6, 14.275);
  const grantRoute = createGrantRoute(tracker);
  group.add(card.sprite, remoteDenied.sprite, grantRoute.group);

  const guardBase = guardMachine.group.position.clone();
  // In the film projection +Z reads as a clear left/down sidestep. It keeps
  // the Guard on the Builder surface while exposing /out.
  const guardShift = new THREE.Vector3(0, 0, 2.4);

  function setTime(rawTime) {
    const time = THREE.MathUtils.clamp(Number(rawTime) || 0, 0, 148);
    const cardAlpha = windowAlpha(time, 109.8, 116, 0.7);
    card.sprite.visible = cardAlpha > 0.001;
    card.material.opacity = cardAlpha;
    if (card.sprite.visible) drawApprovalCard(card, time);

    const remoteAlpha = windowAlpha(time, 113, 115.2, 0.24);
    remoteDenied.sprite.visible = remoteAlpha > 0.001;
    remoteDenied.material.opacity = remoteAlpha;

    const guardStep = smootherstep(interval(time, 112.55, 113.25));
    guardMachine.group.position.copy(guardBase).addScaledVector(guardShift, guardStep);
    setGrantRoute(grantRoute, time);
  }

  setTime(0);
  return { group, setTime, card, remoteDenied, grantRoute };
}
