import * as THREE from "three";

export const VECTOR_CABLE_DIRECTIONS = Object.freeze({
  none: "none",
  forward: "forward",
  reverse: "reverse",
  bidirectional: "bidirectional",
});

const UNIT_Y = new THREE.Vector3(0, 1, 0);
const clamp01 = (value) => Math.min(1, Math.max(0, value));
const trackGeometry = (tracker, geometry) => tracker?.geometry?.(geometry) ?? geometry;
const trackMaterial = (tracker, material) => tracker?.material?.(material) ?? material;

function resolveSurfaceTop(surface) {
  const top = typeof surface?.top === "function" ? surface.top() : surface?.top;
  if (!Number.isFinite(top)) {
    throw new TypeError("A cable surface requires a finite top height.");
  }
  return top;
}

export function cableSurfacePoint(surface, x, z, clearance = 0.04) {
  return Object.freeze({ type: "surface", surface, x, z, clearance });
}

function resolveCablePoint(point) {
  if (point?.isVector3) return point.clone();
  if (Array.isArray(point) && point.length === 3) return new THREE.Vector3(...point);
  if (point?.type === "surface") {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.z)) {
      throw new TypeError("A cable surface point requires finite x/z coordinates.");
    }
    return new THREE.Vector3(
      point.x,
      resolveSurfaceTop(point.surface) + (point.clearance ?? 0.04),
      point.z,
    );
  }
  if (Number.isFinite(point?.x) && Number.isFinite(point?.y) && Number.isFinite(point?.z)) {
    return new THREE.Vector3(point.x, point.y, point.z);
  }
  throw new TypeError("A vector cable received an invalid waypoint.");
}

function getSurfaceEdge(surface, edge, along) {
  const bounded = Number.isFinite(surface?.centerX)
    && Number.isFinite(surface?.centerZ)
    && Number.isFinite(surface?.width)
    && Number.isFinite(surface?.depth);
  if (!bounded || !["front", "back", "left", "right"].includes(edge)) {
    throw new TypeError("A cable edge transition requires a bounded surface and valid edge.");
  }
  return {
    front: { x: surface.centerX + along, z: surface.centerZ + surface.depth / 2, nx: 0, nz: 1 },
    back: { x: surface.centerX + along, z: surface.centerZ - surface.depth / 2, nx: 0, nz: -1 },
    right: { x: surface.centerX + surface.width / 2, z: surface.centerZ + along, nx: 1, nz: 0 },
    left: { x: surface.centerX - surface.width / 2, z: surface.centerZ + along, nx: -1, nz: 0 },
  }[edge];
}

export function cableEdgeDrop(
  upperSurface,
  lowerSurface,
  edge,
  along,
  { clearance = 0.04, edgeOffset = 0.055 } = {},
) {
  const anchor = getSurfaceEdge(upperSurface, edge, along);
  const upperY = resolveSurfaceTop(upperSurface) + clearance;
  const lowerY = resolveSurfaceTop(lowerSurface) + clearance;
  const outsideX = anchor.x + anchor.nx * edgeOffset;
  const outsideZ = anchor.z + anchor.nz * edgeOffset;
  return [
    new THREE.Vector3(anchor.x, upperY, anchor.z),
    new THREE.Vector3(outsideX, upperY, outsideZ),
    new THREE.Vector3(outsideX, lowerY, outsideZ),
  ];
}

function createPolylineCurve(points) {
  const curve = new THREE.CurvePath();
  for (let index = 1; index < points.length; index += 1) {
    curve.add(new THREE.LineCurve3(points[index - 1], points[index]));
  }
  return curve;
}

function createMaterial(tracker, color, opacity = 1) {
  const material = trackMaterial(tracker, new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 0.999,
    opacity,
  }));
  material.userData.vectorCableBaseOpacity = opacity;
  return material;
}

function createBeam(tracker, start, end, radius, material, radialSegments) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const mesh = new THREE.Mesh(
    trackGeometry(tracker, new THREE.CylinderGeometry(radius, radius, length, radialSegments)),
    material,
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(UNIT_Y, direction.normalize());
  return mesh;
}

function createBeamRecord(tracker, {
  start,
  end,
  radius,
  material,
  radialSegments,
  rangeStart,
  rangeEnd,
}) {
  const mesh = createBeam(tracker, start, end, radius, material, radialSegments);
  return { mesh, start, end, rangeStart, rangeEnd };
}

function setBeamReveal(record, progress) {
  const span = Math.max(0.000001, record.rangeEnd - record.rangeStart);
  const amount = clamp01((progress - record.rangeStart) / span);
  record.mesh.visible = amount > 0.001;
  if (!record.mesh.visible) return;
  const visibleEnd = new THREE.Vector3().lerpVectors(record.start, record.end, amount);
  record.mesh.position.copy(record.start).add(visibleEnd).multiplyScalar(0.5);
  record.mesh.scale.y = Math.max(0.001, amount);
}

function setMaterialOpacity(material, opacity) {
  const baseOpacity = material.userData.vectorCableBaseOpacity ?? material.opacity;
  material.transparent = baseOpacity < 0.999 || opacity < 0.999;
  material.opacity = baseOpacity * opacity;
}

function createPulse(tracker, color, radius) {
  const material = createMaterial(tracker, color);
  const pulse = new THREE.Mesh(
    trackGeometry(tracker, new THREE.SphereGeometry(radius, 12, 8)),
    material,
  );
  const glowMaterial = createMaterial(tracker, color, 0.16);
  glowMaterial.depthWrite = false;
  const glow = new THREE.Mesh(
    trackGeometry(tracker, new THREE.SphereGeometry(radius * 2.8, 12, 8)),
    glowMaterial,
  );
  return { pulse, glow, materials: [material, glowMaterial] };
}

export function createVectorCable({
  tracker,
  points,
  color = 0x68b7ff,
  underlayColor = 0x172b40,
  radius = 0.045,
  underlayRadius = radius * 0.72,
  dashed = true,
  dashLength = Math.max(0.18, radius * 5),
  dashGap = dashLength * 0.82,
  direction = VECTOR_CABLE_DIRECTIONS.forward,
  pulseRadius = radius * 1.85,
  speed = 0.42,
  name = "vector-cable",
} = {}) {
  if (!Object.values(VECTOR_CABLE_DIRECTIONS).includes(direction)) {
    throw new TypeError(`Unknown vector cable direction: ${direction}`);
  }
  const resolvedPoints = (points ?? []).map(resolveCablePoint);
  if (resolvedPoints.length < 2) {
    throw new TypeError("A vector cable requires at least two waypoints.");
  }
  const lengths = [];
  let totalLength = 0;
  for (let index = 1; index < resolvedPoints.length; index += 1) {
    const length = resolvedPoints[index - 1].distanceTo(resolvedPoints[index]);
    lengths.push(length);
    totalLength += length;
  }
  const group = new THREE.Group();
  group.name = name;
  const curve = createPolylineCurve(resolvedPoints);
  const underlayMaterial = createMaterial(tracker, underlayColor);
  const cableMaterial = createMaterial(tracker, color);
  const underlayRecords = [];
  const cableRecords = [];
  let traversed = 0;
  lengths.forEach((length, segmentIndex) => {
    if (length <= 0.000001) return;
    const start = resolvedPoints[segmentIndex];
    const end = resolvedPoints[segmentIndex + 1];
    const rangeStart = traversed / totalLength;
    const rangeEnd = (traversed + length) / totalLength;
    const underlay = createBeamRecord(tracker, {
      start, end, radius: underlayRadius, material: underlayMaterial,
      radialSegments: 7, rangeStart, rangeEnd,
    });
    underlayRecords.push(underlay);
    group.add(underlay.mesh);
    if (!dashed) {
      const cable = createBeamRecord(tracker, {
        start, end, radius, material: cableMaterial,
        radialSegments: 7, rangeStart, rangeEnd,
      });
      cableRecords.push(cable);
      group.add(cable.mesh);
    } else {
      const directionVector = new THREE.Vector3().subVectors(end, start).normalize();
      for (let offset = 0; offset < length; offset += dashLength + dashGap) {
        const dashEnd = Math.min(length, offset + dashLength);
        const dashStartPoint = start.clone().addScaledVector(directionVector, offset);
        const dashEndPoint = start.clone().addScaledVector(directionVector, dashEnd);
        const dash = createBeamRecord(tracker, {
          start: dashStartPoint,
          end: dashEndPoint,
          radius,
          material: cableMaterial,
          radialSegments: 7,
          rangeStart: (traversed + offset) / totalLength,
          rangeEnd: (traversed + dashEnd) / totalLength,
        });
        cableRecords.push(dash);
        group.add(dash.mesh);
      }
    }
    traversed += length;
  });
  const pulseCount = direction === VECTOR_CABLE_DIRECTIONS.bidirectional ? 2 : direction === VECTOR_CABLE_DIRECTIONS.none ? 0 : 1;
  const pulseEntries = Array.from({ length: pulseCount }, () => createPulse(tracker, color, pulseRadius));
  pulseEntries.forEach(({ pulse, glow }) => group.add(glow, pulse));
  const cable = {
    group,
    curve,
    points: resolvedPoints,
    underlayRecords,
    cableRecords,
    pulseEntries,
    pulse: pulseEntries[0]?.pulse,
    glow: pulseEntries[0]?.glow,
    direction,
    speed,
    materials: [underlayMaterial, cableMaterial, ...pulseEntries.flatMap((entry) => entry.materials)],
  };
  group.userData.vectorCable = cable;
  group.userData.curve = curve;
  setVectorCableState(cable, { progress: 0, time: 0 });
  return cable;
}

export function setVectorCableState(cable, {
  progress = 1,
  time = 0,
  opacity = 1,
  persistent = false,
  active = true,
} = {}) {
  const reveal = clamp01(progress);
  const alpha = clamp01(opacity);
  cable.group.visible = reveal > 0.001 && alpha > 0.001;
  cable.underlayRecords.forEach((record) => setBeamReveal(record, reveal));
  cable.cableRecords.forEach((record) => setBeamReveal(record, reveal));
  cable.materials.forEach((material) => setMaterialOpacity(material, alpha));
  setVectorCableTime(cable, time, {
    progress: reveal,
    persistent,
    active: active && alpha > 0.001,
  });
}

export function setVectorCableTime(cable, time, {
  progress = 1,
  persistent = true,
  active = true,
} = {}) {
  const reveal = clamp01(progress);
  const movingPhase = persistent && reveal >= 0.999
    ? ((time * cable.speed) % 1 + 1) % 1
    : reveal;
  cable.pulseEntries.forEach((entry, index) => {
    let phase = movingPhase;
    if (cable.direction === VECTOR_CABLE_DIRECTIONS.reverse) phase = 1 - movingPhase;
    if (cable.direction === VECTOR_CABLE_DIRECTIONS.bidirectional && index === 1) phase = 1 - movingPhase;
    cable.curve.getPointAt(clamp01(phase), entry.pulse.position);
    entry.glow.position.copy(entry.pulse.position);
    const visible = active && reveal > 0.02;
    entry.pulse.visible = visible;
    entry.glow.visible = visible;
  });
}
