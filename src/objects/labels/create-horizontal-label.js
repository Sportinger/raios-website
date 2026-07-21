import * as THREE from "three";

function wrapLines(context, copy, maximumWidth) {
  const words = copy.split(/\s+/);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maximumWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function createLabelTexture(title, description = "", {
  panel = true,
  titleFont = "700 62px ui-monospace, SFMono-Regular, Consolas, monospace",
} = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");

  context.clearRect(0, 0, canvas.width, canvas.height);
  if (panel) {
    context.fillStyle = "rgba(4, 9, 16, 0.82)";
    context.strokeStyle = "rgba(113, 183, 255, 0.72)";
    context.lineWidth = 5;
    context.beginPath();
    context.roundRect(18, 18, 988, 476, 32);
    context.fill();
    context.stroke();
  }

  context.fillStyle = "#eef1f5";
  context.font = titleFont;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(title, 512, description ? 178 : 256, 900);

  if (description) {
    context.fillStyle = "#9fb5cd";
    context.font = "500 34px ui-monospace, SFMono-Regular, Consolas, monospace";
    wrapLines(context, description, 850).slice(0, 3).forEach((line, index) => {
      context.fillText(line, 512, 290 + index * 48, 850);
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createHorizontalLabel(title, description, width, depth, options) {
  const material = new THREE.MeshBasicMaterial({
    map: createLabelTexture(title, description, options),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.86, depth * 0.7),
    material,
  );
  plane.rotation.x = -Math.PI / 2;
  plane.renderOrder = 4;
  return { material, plane };
}
