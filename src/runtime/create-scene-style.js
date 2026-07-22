import * as THREE from "three";

const TEXTURE_PROPERTIES = Object.freeze([
  "alphaMap",
  "aoMap",
  "bumpMap",
  "clearcoatMap",
  "clearcoatNormalMap",
  "clearcoatRoughnessMap",
  "displacementMap",
  "emissiveMap",
  "envMap",
  "lightMap",
  "map",
  "metalnessMap",
  "normalMap",
  "roughnessMap",
  "specularColorMap",
  "specularIntensityMap",
  "thicknessMap",
  "transmissionMap",
]);

const NUMERIC_PROPERTIES = Object.freeze([
  "_transmission",
  "clearcoat",
  "clearcoatRoughness",
  "envMapIntensity",
  "metalness",
  "roughness",
  "sheen",
  "thickness",
  "transmission",
]);

function getMaterials(object) {
  if (!object.material) return [];
  return Array.isArray(object.material) ? object.material : [object.material];
}

function createVectorColor(material) {
  const override = material.userData.vectorStyleColor;
  if (override !== undefined) return new THREE.Color(override);

  const color = material.color.clone();
  const hsl = {};
  color.getHSL(hsl);
  if (hsl.s < 0.08) {
    return new THREE.Color().setHSL(0.59, 0.3, hsl.l < 0.12 ? 0.075 : 0.15);
  }
  return new THREE.Color().setHSL(hsl.h, Math.min(0.58, hsl.s), 0.24);
}

export function createSceneStyle({ renderer, scene, viewportElement }) {
  const materialSnapshots = new Map();
  const outlines = [];
  const normalToneMapping = renderer.toneMapping;
  const normalExposure = renderer.toneMappingExposure;
  let vectorEnabled = false;

  const snapshotMaterial = (material) => {
    if (materialSnapshots.has(material)) return materialSnapshots.get(material);
    const snapshot = {
      color: material.color?.clone(),
      numeric: {},
      textures: {},
    };
    TEXTURE_PROPERTIES.forEach((property) => {
      if (property in material) snapshot.textures[property] = material[property];
    });
    NUMERIC_PROPERTIES.forEach((property) => {
      if (property in material) snapshot.numeric[property] = material[property];
    });
    materialSnapshots.set(material, snapshot);
    return snapshot;
  };

  const flattenMaterial = (material) => {
    if (!material.isMeshStandardMaterial && !material.isMeshPhysicalMaterial) return;
    const snapshot = snapshotMaterial(material);
    Object.keys(snapshot.textures).forEach((property) => {
      material[property] = null;
    });
    if ("metalness" in material) material.metalness = 0;
    if ("roughness" in material) material.roughness = 1;
    if ("envMapIntensity" in material) material.envMapIntensity = 0;
    if ("clearcoat" in material) material.clearcoat = 0;
    if ("sheen" in material) material.sheen = 0;
    if ("transmission" in material) material.transmission = 0;
    if ("_transmission" in material) material._transmission = 0;
    if ("thickness" in material) material.thickness = 0;
    material.color?.copy(createVectorColor(material));
    material.needsUpdate = true;
  };

  const restoreMaterial = (material, snapshot) => {
    Object.entries(snapshot.textures).forEach(([property, value]) => {
      material[property] = value;
    });
    Object.entries(snapshot.numeric).forEach(([property, value]) => {
      material[property] = value;
    });
    if (snapshot.color && material.color) material.color.copy(snapshot.color);
    material.needsUpdate = true;
  };

  const addOutline = (mesh, material) => {
    if (!mesh.geometry?.isBufferGeometry || outlines.some(({ source }) => source === mesh)) {
      return;
    }
    const geometry = new THREE.EdgesGeometry(mesh.geometry, 32);
    if (geometry.getAttribute("position").count === 0) {
      geometry.dispose();
      return;
    }
    const lineMaterial = new THREE.LineBasicMaterial({
      color: material.userData.vectorStyleEdgeColor ?? 0x5f91c7,
      depthWrite: false,
      opacity: 0.72,
      transparent: true,
    });
    const line = new THREE.LineSegments(geometry, lineMaterial);
    line.name = "vector-style-outline";
    line.renderOrder = mesh.renderOrder + 1;
    mesh.add(line);
    outlines.push({ line, material, source: mesh });
  };

  const enableVectorStyle = () => {
    scene.traverse((object) => {
      const materials = getMaterials(object);
      materials.forEach(flattenMaterial);
      const surfaceMaterial = materials.find((material) => (
        material.isMeshStandardMaterial || material.isMeshPhysicalMaterial
      ));
      if (object.isMesh && surfaceMaterial) addOutline(object, surfaceMaterial);
    });
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1;
  };

  const disableVectorStyle = () => {
    materialSnapshots.forEach((snapshot, material) => {
      restoreMaterial(material, snapshot);
    });
    outlines.forEach(({ line }) => {
      line.geometry.dispose();
      line.material.dispose();
      line.removeFromParent();
    });
    outlines.length = 0;
    materialSnapshots.clear();
    renderer.toneMapping = normalToneMapping;
    renderer.toneMappingExposure = normalExposure;
  };

  return {
    get enabled() {
      return vectorEnabled;
    },
    setEnabled(enabled) {
      const nextEnabled = Boolean(enabled);
      if (nextEnabled === vectorEnabled) return;
      vectorEnabled = nextEnabled;
      if (vectorEnabled) enableVectorStyle();
      else disableVectorStyle();
      viewportElement?.classList.toggle("viewport--vector-style", vectorEnabled);
    },
    update() {
      if (!vectorEnabled) return;
      outlines.forEach(({ line, material, source }) => {
        const opacity = material.opacity ?? 1;
        line.visible = source.visible && material.visible !== false && opacity > 0.001;
        line.material.opacity = Math.min(0.72, opacity * 0.86);
      });
    },
    dispose() {
      if (vectorEnabled) disableVectorStyle();
      viewportElement?.classList.remove("viewport--vector-style");
    },
  };
}
