import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createHorizontalLabel } from "../labels/create-horizontal-label.js";

function createDivider(start, end, color) {
  const positions = new Float32Array(6);
  start.toArray(positions, 0);
  start.toArray(positions, 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 });
  return {
    end, geometry, line: new THREE.Line(geometry, material), material,
    positions, start, cursor: new THREE.Vector3(),
  };
}

function renderDivider(divider, progress, opacity) {
  divider.cursor.copy(divider.start).lerp(divider.end, progress);
  divider.cursor.toArray(divider.positions, 3);
  divider.geometry.attributes.position.needsUpdate = true;
  divider.material.opacity = progress > 0 ? opacity : 0;
}

function createSectionPiece(options) {
  const {
    index, column, row, columns, rows, cellWidth, cellDepth, height,
    bottomY, gap, definition, color, edgeColor, metalness, roughness,
  } = options;
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(cellWidth, height, cellDepth);
  const material = new THREE.MeshStandardMaterial({ color, metalness, roughness });
  group.add(new THREE.Mesh(geometry, material));

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: edgeColor, transparent: true, opacity: 0.76,
  });
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial));

  const label = createHorizontalLabel(
    definition.title,
    "",
    cellWidth,
    height / 0.7,
    {
      panel: false,
      titleFont: "900 190px ui-monospace, SFMono-Regular, Consolas, monospace",
      descriptionFont: "600 62px ui-monospace, SFMono-Regular, Consolas, monospace",
    },
  );
  label.plane.position.z = cellDepth / 2 + 0.012;
  label.plane.rotation.x = 0;
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

  return { group, index, joinedPosition, labelMaterial: label.material, splitOffset };
}

export function createSectionedLayer(options) {
  const {
    width, height, depth, bottomY, sections, columns = 3, rows = 2, gap = 0.2,
    color, edgeColor, outlineColor = edgeColor, metalness = 0.4,
    roughness = 0.5, mergedLabel = "RUST KERNEL",
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
      columns, rows, cellWidth, cellDepth, height, bottomY, gap, definition,
      color, edgeColor, metalness, roughness,
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

  const finalLabel = createHorizontalLabel(
    mergedLabel,
    "",
    width * 0.86,
    height / 0.7,
    {
      panel: false,
      titleFont: "900 300px ui-monospace, SFMono-Regular, Consolas, monospace",
      descriptionFont: "600 82px ui-monospace, SFMono-Regular, Consolas, monospace",
    },
  );
  finalLabel.plane.position.set(0, bottomY + height / 2, depth / 2 + 0.018);
  finalLabel.plane.rotation.x = 0;
  group.add(finalLabel.plane);

  const render = (progress) => {
    const splitProgress = smootherstep(intervalProgress(progress, 0.16, 0.28));
    dividers.forEach((divider, index) => {
      const dividerProgress = smootherstep(intervalProgress(
        progress, 0.02 + index * 0.035, 0.09 + index * 0.035,
      ));
      renderDivider(divider, dividerProgress, 0.92 * (1 - splitProgress));
    });

    pieces.forEach((piece, index) => {
      const dockStart = 0.62 + index * 0.04;
      const dockProgress = smootherstep(intervalProgress(progress, dockStart, dockStart + 0.1));
      const separation = splitProgress * (1 - dockProgress);
      piece.group.position.copy(piece.joinedPosition).addScaledVector(
        piece.splitOffset, separation,
      );
      const labelIn = smootherstep(intervalProgress(
        progress, 0.28 + index * 0.045, 0.35 + index * 0.045,
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
