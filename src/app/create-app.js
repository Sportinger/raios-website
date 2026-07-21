import { disposeObject3D } from "../shared/dispose-object-3d.js";
import { createStory } from "../story/create-story.js";
import { createCamera } from "../runtime/create-camera.js";
import { createCameraRig } from "../runtime/create-camera-rig.js";
import { createMotionPreference } from "../runtime/create-motion-preference.js";
import { createRenderer } from "../runtime/create-renderer.js";
import { createScrollDriver } from "../runtime/create-scroll-driver.js";
import { createViewport } from "../runtime/create-viewport.js";
import { createWorld } from "../runtime/create-world.js";

const SCROLL_VIEWPORTS_PER_WEIGHT = 620;

export function createApp({ canvas, stage }) {
  if (!canvas || !stage) {
    throw new Error("The scroll canvas and stage are required");
  }

  const renderer = createRenderer(canvas);
  const camera = createCamera();
  const cameraRig = createCameraRig(camera);
  const world = createWorld();
  const story = createStory({ scene: world.scene, context: { cameraRig } });
  const motionPreference = createMotionPreference();

  const renderAt = (progress) => {
    story.update(motionPreference.matches ? 1 : progress);
    renderer.render(world.scene, camera);
  };

  const scrollDriver = createScrollDriver({ stage, onProgress: renderAt });
  const viewport = createViewport({
    camera,
    renderer,
    onResize: (viewportSize) => {
      story.resize(viewportSize);
      renderAt(scrollDriver.getProgress());
    },
  });

  const updateScrollTravel = () => {
    stage.style.minHeight = motionPreference.matches
      ? "100svh"
      : `${100 + story.totalWeight * SCROLL_VIEWPORTS_PER_WEIGHT}vh`;
  };

  const unsubscribeMotion = motionPreference.subscribe(() => {
    updateScrollTravel();
    renderAt(scrollDriver.getProgress());
  });

  updateScrollTravel();
  viewport.resize();

  return {
    dispose() {
      unsubscribeMotion();
      viewport.dispose();
      scrollDriver.dispose();
      story.dispose();
      disposeObject3D(world.environment);
      renderer.dispose();
    },
  };
}
