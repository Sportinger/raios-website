function disposeMaterial(material) {
  Object.values(material).forEach((value) => {
    if (value?.isTexture) value.dispose();
  });
  material.dispose();
}

export function disposeObject3D(root) {
  root.traverse((object) => {
    object.geometry?.dispose();
    if (Array.isArray(object.material)) {
      object.material.forEach(disposeMaterial);
    } else if (object.material) {
      disposeMaterial(object.material);
    }
  });
}
