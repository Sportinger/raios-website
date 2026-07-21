export function createViewport({ camera, renderer, onResize }) {
  const resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    onResize({ width, height });
  };

  window.addEventListener("resize", resize, { passive: true });

  return {
    resize,
    dispose() {
      window.removeEventListener("resize", resize);
    },
  };
}
