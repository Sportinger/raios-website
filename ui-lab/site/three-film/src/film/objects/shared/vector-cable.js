import * as THREE from "three";

export const VECTOR_CABLE_DIRECTIONS = Object.freeze({
  none: "none",
  forward: "forward",
  reverse: "reverse",
  bidirectional: "bidirectional",
});

const UNIT_Y = new THREE.Vector3(0, 1, 0);
const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (value) => {
  const amount = clamp01(value);
  return amount * amount * (3 - 2 * amount);
};
const timedProgress = (time, start, end) => {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return smoothstep((time - start) / (end - start));
};
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
  { clearance = 0.04, edgeOffset = 0.16 } = {},
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

export function cableDoorLandingDrop(
  door,
  lowerSurface,
  {
    clearance = 0.04,
    edgeOffset = 0.18,
    parentOffset = new THREE.Vector3(),
  } = {},
) {
  const mechanism = door?.mechanism ?? door;
  if (!door?.group || !mechanism?.hatch || !Number.isFinite(door.group.position?.y)) {
    throw new TypeError("A door landing cable transition requires a vector door instance.");
  }
  const mechanismScale = mechanism.group === door.group ? 1 : mechanism.group.scale.x;
  const scale = door.group.scale.x * mechanismScale;
  const normalX = Math.sin(mechanism.rotationY) * mechanism.porchSide;
  const normalZ = Math.cos(mechanism.rotationY) * mechanism.porchSide;
  const frameX = parentOffset.x + door.group.position.x;
  const frameZ = parentOffset.z + door.group.position.z;
  const upperY = parentOffset.y + door.group.position.y + clearance;
  const lowerY = resolveSurfaceTop(lowerSurface) + clearance;
  const centerOffset = mechanism.porchOffset * scale;
  const outerOffset = (mechanism.porchOffset + mechanism.hatch.depth * 0.5) * scale;
  const outsideOffset = outerOffset + edgeOffset;
  return [
    new THREE.Vector3(frameX, upperY, frameZ),
    new THREE.Vector3(
      frameX + normalX * centerOffset,
      upperY,
      frameZ + normalZ * centerOffset,
    ),
    new THREE.Vector3(
      frameX + normalX * outerOffset,
      upperY,
      frameZ + normalZ * outerOffset,
    ),
    new THREE.Vector3(
      frameX + normalX * outsideOffset,
      upperY,
      frameZ + normalZ * outsideOffset,
    ),
    new THREE.Vector3(
      frameX + normalX * outsideOffset,
      lowerY,
      frameZ + normalZ * outsideOffset,
    ),
  ];
}

function createRoundedPolylineCurve(points, cornerRadius) {
  const curve = new THREE.CurvePath();
  let cursor = points[0].clone();
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const corner = points[index];
    const next = points[index + 1];
    const incomingLength = previous.distanceTo(corner);
    const outgoingLength = corner.distanceTo(next);
    if (incomingLength <= 0.000001 || outgoingLength <= 0.000001) continue;
    const trim = Math.min(cornerRadius, incomingLength * 0.34, outgoingLength * 0.34);
    const before = corner.clone().add(
      previous.clone().sub(corner).normalize().multiplyScalar(trim),
    );
    const after = corner.clone().add(
      next.clone().sub(corner).normalize().multiplyScalar(trim),
    );
    if (cursor.distanceTo(before) > 0.000001) {
      curve.add(new THREE.LineCurve3(cursor, before));
    }
    curve.add(new THREE.QuadraticBezierCurve3(before, corner, after));
    cursor = after;
  }
  const last = points.at(-1);
  if (cursor.distanceTo(last) > 0.000001) {
    curve.add(new THREE.LineCurve3(cursor, last));
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
  return {
    mesh,
    start,
    end,
    rangeStart,
    rangeEnd,
    baseLength: Math.max(0.000001, start.distanceTo(end)),
    pathLengthScale: 1,
  };
}

function setBeamReveal(record, progress) {
  const span = Math.max(0.000001, record.rangeEnd - record.rangeStart);
  const amount = clamp01((progress - record.rangeStart) / span);
  record.mesh.visible = amount > 0.001;
  if (!record.mesh.visible) return;
  const visibleEnd = new THREE.Vector3().lerpVectors(record.start, record.end, amount);
  record.mesh.position.copy(record.start).add(visibleEnd).multiplyScalar(0.5);
  record.mesh.scale.y = Math.max(0.001, record.pathLengthScale * amount);
}

function setBeamPath(record, start, end) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  record.start.copy(start);
  record.end.copy(end);
  record.pathLengthScale = length / record.baseLength;
  record.mesh.position.copy(start).add(end).multiplyScalar(0.5);
  if (length > 0.000001) {
    record.mesh.quaternion.setFromUnitVectors(UNIT_Y, direction.normalize());
  }
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
  cornerRadius = Math.max(0.16, radius * 4.5),
  name = "vector-cable",
} = {}) {
  if (!Object.values(VECTOR_CABLE_DIRECTIONS).includes(direction)) {
    throw new TypeError(`Unknown vector cable direction: ${direction}`);
  }
  const resolvedPoints = (points ?? []).map(resolveCablePoint);
  if (resolvedPoints.length < 2) {
    throw new TypeError("A vector cable requires at least two waypoints.");
  }
  const curve = createRoundedPolylineCurve(resolvedPoints, cornerRadius);
  const totalLength = curve.getLength();
  if (totalLength <= 0.000001) {
    throw new TypeError("A vector cable requires waypoints with measurable distance.");
  }
  const renderDivisions = Math.max(8, Math.ceil(totalLength / Math.max(0.08, radius * 1.8)));
  const renderPoints = curve.getSpacedPoints(renderDivisions);
  const lengths = renderPoints.slice(1).map((point, index) => point.distanceTo(renderPoints[index]));
  const group = new THREE.Group();
  group.name = name;
  const underlayMaterial = createMaterial(tracker, underlayColor);
  const cableMaterial = createMaterial(tracker, color);
  const underlayRecords = [];
  const cableRecords = [];
  let traversed = 0;
  lengths.forEach((length, segmentIndex) => {
    if (length <= 0.000001) return;
    const start = renderPoints[segmentIndex];
    const end = renderPoints[segmentIndex + 1];
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
    }
    traversed += length;
  });
  if (dashed) {
    for (let offset = 0; offset < totalLength; offset += dashLength + dashGap) {
      const dashEnd = Math.min(totalLength, offset + dashLength);
      const dash = createBeamRecord(tracker, {
        start: curve.getPointAt(offset / totalLength),
        end: curve.getPointAt(dashEnd / totalLength),
        radius,
        material: cableMaterial,
        radialSegments: 7,
        rangeStart: offset / totalLength,
        rangeEnd: dashEnd / totalLength,
      });
      cableRecords.push(dash);
      group.add(dash.mesh);
    }
  }
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
    cornerRadius,
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
  cable.currentState = {
    progress: reveal,
    persistent: Boolean(persistent),
    active: Boolean(active && alpha > 0.001),
  };
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

export function setVectorCablePoints(cable, points) {
  const resolvedPoints = (points ?? []).map(resolveCablePoint);
  if (resolvedPoints.length < 2) {
    throw new TypeError("A vector cable requires at least two waypoints.");
  }
  const curve = createRoundedPolylineCurve(resolvedPoints, cable.cornerRadius);
  if (curve.getLength() <= 0.000001) {
    throw new TypeError("A vector cable requires waypoints with measurable distance.");
  }
  cable.points = resolvedPoints;
  cable.curve = curve;
  cable.group.userData.curve = curve;
  [...cable.underlayRecords, ...cable.cableRecords].forEach((record) => {
    setBeamPath(
      record,
      curve.getPointAt(record.rangeStart),
      curve.getPointAt(record.rangeEnd),
    );
    setBeamReveal(record, cable.currentState?.progress ?? 1);
  });
}

export function createVectorCableJourney(cables) {
  const journey = new THREE.CurvePath();
  (cables ?? []).forEach((cable) => {
    if (!cable?.curve) {
      throw new TypeError("A cable journey requires vector cable instances.");
    }
    journey.add(cable.curve);
  });
  if (journey.curves.length === 0) {
    throw new TypeError("A cable journey requires at least one cable.");
  }
  return journey;
}

export function setVectorCableLifecycle(cable, time, {
  introStart,
  introEnd,
  outroStart = Number.POSITIVE_INFINITY,
  outroEnd = Number.POSITIVE_INFINITY,
  opacity = 1,
  persistent = true,
  active = true,
} = {}) {
  const revealIn = timedProgress(time, introStart, introEnd);
  const retract = Number.isFinite(outroStart) && Number.isFinite(outroEnd)
    ? timedProgress(time, outroStart, outroEnd)
    : 0;
  const progress = revealIn * (1 - retract);
  setVectorCableState(cable, {
    progress,
    time,
    opacity,
    persistent,
    active: active && revealIn >= 0.999 && retract <= 0.001,
  });
  return Object.freeze({ progress, retract });
}

export function setVectorCableTime(cable, time, options = {}) {
  const progress = options.progress ?? cable.currentState?.progress ?? 1;
  const persistent = options.persistent ?? cable.currentState?.persistent ?? true;
  const active = options.active ?? cable.currentState?.active ?? true;
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
    const visible = active && reveal >= 0.999;
    entry.pulse.visible = visible;
    entry.glow.visible = visible;
  });
}
