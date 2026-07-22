import * as THREE from "three";

const UNIT_Y = new THREE.Vector3(0, 1, 0);
const CAMERA_PANEL_DISTANCE = 0.7;
const CAMERA_PANEL_SCALE = 3.84;
const DOCKED_PANEL_SCALE = 0.3;

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const progress = (time, start, end) => smoothstep((time - start) / Math.max(0.000001, end - start));

function drawLayerCallout(callout, titleAmount, copyAmount, cursorVisible) {
  const titleLength = Math.floor(callout.title.length * clamp01(titleAmount));
  const copyLength = Math.floor(callout.copy.length * clamp01(copyAmount));
  const renderKey = `${titleLength}:${copyLength}:${cursorVisible ? 1 : 0}`;
  if (renderKey === callout.renderKey) return;
  callout.renderKey = renderKey;

  const { canvas, context } = callout;
  const stroke = `#${callout.color.toString(16).padStart(6, "0")}`;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.beginPath();
  context.roundRect(10, 10, 1180, 280, 34);
  context.fillStyle = "rgba(12, 21, 33, 0.94)";
  context.fill();
  context.lineWidth = 8;
  context.strokeStyle = stroke;
  context.stroke();
  context.beginPath();
  context.moveTo(46, 48);
  context.lineTo(46, 252);
  context.lineWidth = 18;
  context.lineCap = "round";
  context.strokeStyle = stroke;
  context.stroke();
  context.beginPath();
  context.moveTo(102, 150);
  context.lineTo(1110, 150);
  context.lineWidth = 4;
  context.strokeStyle = `${stroke}88`;
  context.stroke();

  const titleCopy = callout.title.slice(0, titleLength);
  const bodyCopy = callout.copy.slice(0, copyLength);
  const typingTitle = titleLength < callout.title.length;
  const typingCopy = titleLength >= callout.title.length && copyLength < callout.copy.length;
  context.font = "900 58px Consolas, monospace";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillStyle = "#eef5ff";
  context.fillText(`${titleCopy}${cursorVisible && typingTitle ? "▌" : ""}`, 102, 94, 1008);
  context.font = "800 35px Consolas, monospace";
  context.fillStyle = "#9fb2c9";
  context.fillText(`${bodyCopy}${cursorVisible && typingCopy ? "▌" : ""}`, 102, 212, 1008);
  callout.texture.needsUpdate = true;
}

function createDynamicBeam(radius, color) {
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  material.userData.preserveTransparency = true;
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 1, 8),
    material,
  );
  beam.renderOrder = 78;
  return beam;
}

function updateBeam(beam, start, end) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  beam.visible = length > 0.0001;
  if (!beam.visible) return;
  beam.position.copy(start).add(end).multiplyScalar(0.5);
  beam.quaternion.setFromUnitVectors(UNIT_Y, direction.multiplyScalar(1 / length));
  beam.scale.set(1, length, 1);
}

function setRouteOpacity(route, opacity) {
  const value = clamp01(opacity);
  route.visible = value > 0.001;
  route.traverse((object) => {
    if (!object.material) return;
    object.material.opacity = value;
  });
}

export function createLayerCallout({ title, copy, color, width = 7 }) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 300;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  material.userData.preserveTransparency = true;
  const card = new THREE.Sprite(material);
  const height = width * canvas.height / canvas.width;
  card.renderOrder = 80;

  const firstSegment = createDynamicBeam(0.018, color);
  const secondSegment = createDynamicBeam(0.018, color);
  const targetDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 10, 6),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
  );
  targetDot.renderOrder = 79;
  const route = new THREE.Group();
  route.add(firstSegment, secondSegment, targetDot);
  const group = new THREE.Group();
  group.name = `layer-callout-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  group.add(route, card);
  const callout = {
    group,
    card,
    route,
    firstSegment,
    secondSegment,
    targetDot,
    canvas,
    context,
    texture,
    title,
    copy,
    color,
    width,
    height,
    renderKey: "",
  };
  drawLayerCallout(callout, 0, 0, false);
  return callout;
}

export function setLayerCallout(callout, time, {
  start,
  introEnd,
  titleStart,
  end,
  root,
  camera,
  targetObject,
  targetLocalPoint,
  angle,
}) {
  const active = time >= start && time < end;
  callout.group.visible = active;
  if (!active || !camera) return;

  const introDuration = Math.max(0.001, introEnd - start);
  const openEnd = start + introDuration * 0.48;
  const titleTypeStart = openEnd + 0.04;
  const titleTypeEnd = introEnd + introDuration * 0.18;
  const copyTypeStart = titleTypeEnd - 0.04;
  const copyTypeEnd = introEnd + introDuration * 0.82;
  const moveEnd = Math.max(titleStart + 0.001, end - 0.38);
  const stickEnd = Math.max(moveEnd + 0.001, end - 0.22);
  const panelOpen = progress(time, start, openEnd);
  const titleAmount = progress(time, titleTypeStart, titleTypeEnd);
  const copyAmount = progress(time, copyTypeStart, copyTypeEnd);
  const docking = progress(time, titleStart, moveEnd);
  const stuck = progress(time, moveEnd, stickEnd);
  const fadeOut = progress(time, end - 0.22, end);
  const alpha = progress(time, start, start + 0.1) * (1 - fadeOut);
  const cursorVisible = (titleAmount < 1 || copyAmount < 1) && Math.floor(time * 8) % 2 === 0;
  drawLayerCallout(callout, titleAmount, copyAmount, cursorVisible);

  camera.updateMatrixWorld();
  root.updateWorldMatrix(true, false);
  targetObject.updateWorldMatrix(true, false);
  const rootInverse = root.matrixWorld.clone().invert();
  const rootScale = new THREE.Vector3();
  root.getWorldScale(rootScale);
  const viewDirection = new THREE.Vector3();
  camera.getWorldDirection(viewDirection);
  const screenRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).normalize();
  const screenUp = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1).normalize();
  const cameraCenter = camera.position.clone().addScaledVector(viewDirection, CAMERA_PANEL_DISTANCE);
  const targetWorld = targetLocalPoint.clone().applyMatrix4(targetObject.matrixWorld);
  const curveControl = cameraCenter.clone().lerp(targetWorld, 0.48)
    .addScaledVector(screenUp, 1.15)
    .addScaledVector(screenRight, -0.45);
  const inverseDocking = 1 - docking;
  const cardCenterWorld = cameraCenter.clone().multiplyScalar(inverseDocking * inverseDocking)
    .addScaledVector(curveControl, 2 * inverseDocking * docking)
    .addScaledVector(targetWorld, docking * docking);
  const scaleFactor = THREE.MathUtils.lerp(CAMERA_PANEL_SCALE, DOCKED_PANEL_SCALE, docking);
  const zoomCompensation = camera.isOrthographicCamera
    ? THREE.MathUtils.lerp(1 / Math.max(0.01, camera.zoom), 1, docking)
    : 1;
  const fullWidth = callout.width * scaleFactor * zoomCompensation;
  const fullHeight = callout.height * scaleFactor * zoomCompensation;
  const visibleWidth = fullWidth * Math.max(0.001, panelOpen);
  cardCenterWorld.addScaledVector(
    screenRight,
    -fullWidth * (1 - panelOpen) * 0.5 * (1 - docking),
  );
  callout.card.position.copy(cardCenterWorld).applyMatrix4(rootInverse);
  callout.card.scale.set(
    visibleWidth / Math.max(0.0001, rootScale.x),
    fullHeight / Math.max(0.0001, rootScale.y),
    1,
  );
  callout.card.material.opacity = alpha;
  callout.card.material.rotation = angle * docking;

  const targetDelta = targetWorld.clone().sub(cardCenterWorld);
  const screenX = targetDelta.dot(screenRight);
  const screenY = targetDelta.dot(screenUp);
  const halfWidth = Math.max(0.001, visibleWidth * 0.5);
  const halfHeight = Math.max(0.001, fullHeight * 0.5);
  const edgeDivisor = Math.max(Math.abs(screenX) / halfWidth, Math.abs(screenY) / halfHeight, 0.0001);
  const edgeAmount = 1 / edgeDivisor;
  const anchorWorld = cardCenterWorld.clone()
    .addScaledVector(screenRight, screenX * edgeAmount)
    .addScaledVector(screenUp, screenY * edgeAmount);
  const screenDirection = screenRight.clone().multiplyScalar(screenX)
    .addScaledVector(screenUp, screenY);
  const screenDistance = screenDirection.length();
  if (screenDistance > 0.0001) screenDirection.multiplyScalar(1 / screenDistance);
  else screenDirection.copy(screenUp).negate();
  const elbowWorld = anchorWorld.clone().addScaledVector(
    screenDirection,
    Math.min(0.8, screenDistance * 0.18),
  );
  const anchorLocal = anchorWorld.applyMatrix4(rootInverse);
  const elbowLocal = elbowWorld.applyMatrix4(rootInverse);
  const targetLocal = targetWorld.applyMatrix4(rootInverse);
  updateBeam(callout.firstSegment, anchorLocal, elbowLocal);
  updateBeam(callout.secondSegment, elbowLocal, targetLocal);
  callout.targetDot.position.copy(targetLocal);
  const routeReveal = progress(time, openEnd, copyTypeEnd);
  const routeRetire = Math.max(stuck, fadeOut);
  setRouteOpacity(callout.route, routeReveal * (1 - routeRetire));
}
