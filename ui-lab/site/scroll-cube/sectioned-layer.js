import * as THREE from "three";

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function intervalProgress(value, start, end) {
  return clamp((value - start) / Math.max(0.0001, end - start), 0, 1);
}

function smootherstep(value) {
  const progress = clamp(value, 0, 1);
  return progress * progress * progress * (progress * (progress * 6 - 15) + 10);
}

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

function createLabelTexture(title, description = "") {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(4, 9, 16, 0.82)";
  context.strokeStyle = "rgba(113, 183, 255, 0.72)";
  context.lineWidth = 5;
  context.beginPath();
  context.roundRect(18, 18, 988, 476, 32);
  context.fill();
  context.stroke();

  context.fillStyle = "#eef1f5";
  context.font = "700 62px ui-monospace, SFMono-Regular, Consolas, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(title, 512, description ? 178 : 256, 900);

  if (description) {
    context.fillStyle = "#9fb5cd";
    context.font = "500 34px ui-monospace, SFMono-Regular, Consolas, monospace";
    const lines = wrapLines(context, description, 850).slice(0, 3);
    lines.forEach((line, index) => {
      context.fillText(line, 512, 290 + index * 48, 850);
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createHorizontalLabel(title, description, width, depth) {
  const material = new THREE.MeshBasicMaterial({
    map: createLabelTexture(title, description),
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

function createDivider(start, end, color) {
  const positions = new Float32Array(6);
  start.toArray(positions, 0);
  start.toArray(positions, 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
  });
  return {
    end,
    geometry,
    line: new THREE.Line(geometry, material),
    material,
    positions,
    start,
    cursor: new THREE.Vector3(),
  };
}

function renderDivider(divider, progress, opacity) {
  divider.cursor.copy(divider.start).lerp(divider.end, progress);
  divider.cursor.toArray(divider.positions, 3);
  divider.geometry.attributes.position.needsUpdate = true;
  divider.material.opacity = progress > 0 ? opacity : 0;
}

function createSectionPiece({
  index,
  column,
  row,
  columns,
  rows,
  cellWidth,
  cellDepth,
  height,
  bottomY,
  gap,
  definition,
  color,
  edgeColor,
  metalness,
  roughness,
}) {
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(cellWidth, height, cellDepth);
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
  });
  group.add(new THREE.Mesh(geometry, material));

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: edgeColor,
    transparent: true,
    opacity: 0.76,
  });
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial));

  const label = createHorizontalLabel(
    definition.title,
    definition.description,
    cellWidth,
    cellDepth,
  );
  label.plane.position.y = height / 2 + 0.018;
  group.add(label.plane);

  const joinedPosition = new THREE.Vector3(
    (column - (columns - 1) / 2) * cellWidth,
    bottomY + height / 2,
    (row - (rows - 1) / 2) * cellDepth,
  );
  const splitOffset = new THREE.Vector3(
    Math.sign(joinedPosition.x) * gap,
    0,
    Math.sign(joinedPosition.z) * gap,
  );
  group.position.copy(joinedPosition);

  return {
    group,
    index,
    joinedPosition,
    labelMaterial: label.material,
    splitOffset,
  };
}

export function createSectionedLayer(options) {
  const {
    width,
    height,
    depth,
    bottomY,
    sections,
    columns = 3,
    rows = 2,
    gap = 0.2,
    color,
    edgeColor,
    outlineColor = edgeColor,
    metalness = 0.4,
    roughness = 0.5,
    mergedLabel = "RUST KERNEL",
  } = options;

  if (sections.length !== columns * rows) {
    throw new Error("Section count must match columns × rows");
  }

  const group = new THREE.Group();
  const piecesGroup = new THREE.Group();
  group.add(piecesGroup);

  const cellWidth = width / columns;
  const cellDepth = depth / rows;
  const pieces = sections.map((definition, index) => {
    const piece = createSectionPiece({
      index,
      column: index % columns,
      row: Math.floor(index / columns),
      columns,
      rows,
      cellWidth,
      cellDepth,
      height,
      bottomY,
      gap,
      definition,
      color,
      edgeColor,
      metalness,
      roughness,
    });
    piecesGroup.add(piece.group);
    return piece;
  });

  const topY = bottomY + height + 0.008;
  const dividers = [];
  for (let column = 1; column < columns; column += 1) {
    const x = -width / 2 + cellWidth * column;
    dividers.push(createDivider(
      new THREE.Vector3(x, topY, -depth / 2),
      new THREE.Vector3(x, topY, depth / 2),
      outlineColor,
    ));
  }
  for (let row = 1; row < rows; row += 1) {
    const z = -depth / 2 + cellDepth * row;
    dividers.push(createDivider(
      new THREE.Vector3(-width / 2, topY, z),
      new THREE.Vector3(width / 2, topY, z),
      outlineColor,
    ));
  }
  dividers.forEach((divider) => group.add(divider.line));

  const finalLabel = createHorizontalLabel(mergedLabel, "", width * 0.52, depth * 0.34);
  finalLabel.plane.position.set(0, topY + 0.012, 0);
  group.add(finalLabel.plane);

  const render = (progress) => {
    const splitProgress = smootherstep(intervalProgress(progress, 0.16, 0.28));

    dividers.forEach((divider, index) => {
      const dividerProgress = smootherstep(intervalProgress(
        progress,
        0.02 + index * 0.035,
        0.09 + index * 0.035,
      ));
      renderDivider(divider, dividerProgress, 0.92 * (1 - splitProgress));
    });

    pieces.forEach((piece, index) => {
      const dockStart = 0.62 + index * 0.04;
      const dockProgress = smootherstep(intervalProgress(progress, dockStart, dockStart + 0.1));
      const separation = splitProgress * (1 - dockProgress);
      piece.group.position.copy(piece.joinedPosition).addScaledVector(
        piece.splitOffset,
        separation,
      );

      const labelIn = smootherstep(intervalProgress(
        progress,
        0.28 + index * 0.045,
        0.35 + index * 0.045,
      ));
      piece.labelMaterial.opacity = labelIn * (1 - dockProgress);
    });

    const piecesActive = progress >= 0.16 && progress < 0.96;
    piecesGroup.visible = piecesActive;
    finalLabel.material.opacity = smootherstep(intervalProgress(progress, 0.94, 0.99));

    return { replacesBase: piecesActive };
  };

  render(0);
  return { group, pieces, render };
}
