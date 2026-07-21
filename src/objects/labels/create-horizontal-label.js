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

function resizeFont(font, scale) {
  return font.replace(
    /(\d+(?:\.\d+)?)px/,
    (_, size) => `${Number(size) * scale}px`,
  );
}

function fitSingleLine(context, copy, font, maximumWidth, maximumHeight) {
  context.font = font;
  const requestedSize = Number(font.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? 16);
  const measuredWidth = Math.max(context.measureText(copy).width, 1);
  const scale = Math.min(
    1,
    maximumWidth / measuredWidth,
    maximumHeight / requestedSize,
  );
  context.font = resizeFont(font, scale);
}

function createLabelTexture(title, description = "", {
  panel = true,
  titleFont = "700 62px ui-monospace, SFMono-Regular, Consolas, monospace",
  descriptionFont = "500 34px ui-monospace, SFMono-Regular, Consolas, monospace",
  titleColor = "#ffffff",
  descriptionColor = "#c1d2e5",
} = {}, aspectRatio = 2) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = Math.max(1, Math.round(canvas.width / aspectRatio));
  const context = canvas.getContext("2d");
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const horizontalPadding = canvas.width * 0.06;

  context.clearRect(0, 0, canvas.width, canvas.height);
  if (panel) {
    context.fillStyle = "rgba(4, 9, 16, 0.82)";
    context.strokeStyle = "rgba(113, 183, 255, 0.72)";
    context.lineWidth = 5;
    context.beginPath();
    const inset = Math.max(4, canvas.height * 0.04);
    context.roundRect(
      inset,
      inset,
      canvas.width - inset * 2,
      canvas.height - inset * 2,
      Math.max(6, canvas.height * 0.06),
    );
    context.fill();
    context.stroke();
  }

  context.fillStyle = titleColor;
  context.textAlign = "center";
  context.textBaseline = "middle";
  const titleY = description ? canvas.height * 0.34 : centerY;
  fitSingleLine(
    context,
    title,
    titleFont,
    canvas.width - horizontalPadding * 2,
    canvas.height * (description ? 0.38 : 0.72),
  );
  context.fillText(title, centerX, titleY);

  if (description) {
    context.fillStyle = descriptionColor;
    fitSingleLine(
      context,
      description,
      descriptionFont,
      canvas.width - horizontalPadding * 2,
      canvas.height * 0.2,
    );
    const lines = wrapLines(
      context,
      description,
      canvas.width - horizontalPadding * 2,
    ).slice(0, 3);
    const lineHeight = canvas.height * 0.16;
    lines.forEach((line, index) => {
      context.fillText(
        line,
        centerX,
        canvas.height * 0.66 + index * lineHeight,
      );
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createHorizontalLabel(title, description, width, depth, options) {
  const planeWidth = width * 0.86;
  const planeHeight = depth * 0.7;
  const material = new THREE.MeshBasicMaterial({
    map: createLabelTexture(title, description, options, planeWidth / planeHeight),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(planeWidth, planeHeight),
    material,
  );
  plane.rotation.x = -Math.PI / 2;
  plane.renderOrder = 4;
  return {
    material,
    plane,
    setScaleCompensation(
      parentScaleX = 1,
      parentScaleY = 1,
      uniformScale = Math.min(parentScaleX, parentScaleY),
    ) {
      const safeScaleX = Math.max(Math.abs(parentScaleX), 0.0001);
      const safeScaleY = Math.max(Math.abs(parentScaleY), 0.0001);
      plane.scale.set(
        uniformScale / safeScaleX,
        uniformScale / safeScaleY,
        1,
      );
    },
  };
}
