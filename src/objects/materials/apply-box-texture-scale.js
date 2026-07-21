export function applyBoxTextureScale(
  geometry,
  { width, height, depth, tileSize = 2 },
) {
  const positions = geometry.getAttribute("position");
  const uvs = geometry.getAttribute("uv");

  geometry.groups.forEach(({ start, count, materialIndex }) => {
    for (let offset = start; offset < start + count; offset += 1) {
      const vertexIndex = geometry.index.getX(offset);
      const x = positions.getX(vertexIndex);
      const y = positions.getY(vertexIndex);
      const z = positions.getZ(vertexIndex);

      if (materialIndex <= 1) {
        uvs.setXY(vertexIndex, (z + depth / 2) / tileSize, (y + height / 2) / tileSize);
      } else if (materialIndex <= 3) {
        uvs.setXY(vertexIndex, (x + width / 2) / tileSize, (z + depth / 2) / tileSize);
      } else {
        uvs.setXY(vertexIndex, (x + width / 2) / tileSize, (y + height / 2) / tileSize);
      }
    }
  });
  uvs.needsUpdate = true;
}
