import * as THREE from "three";
import { intervalProgress } from "../animation/progress.js";
import { STORY_MAP } from "./story-map.js";

export function createStory({ scene, context }) {
  const totalWeight = STORY_MAP.reduce((total, entry) => total + entry.weight, 0);
  let weightCursor = 0;
  const chapters = STORY_MAP.map((entry, index) => {
    const chapter = entry.create(context);
    if (chapter.id !== entry.id) {
      throw new Error(`Chapter id mismatch: expected ${entry.id}, received ${chapter.id}`);
    }
    const start = weightCursor / totalWeight;
    weightCursor += entry.weight;
    const end = weightCursor / totalWeight;
    const root = new THREE.Group();
    root.name = `chapter:${entry.id}`;
    root.add(chapter.group);
    scene.add(root);
    return {
      chapter,
      end,
      index,
      isLast: index === STORY_MAP.length - 1,
      label: entry.label,
      root,
      start,
    };
  });
  const navigationItems = chapters.map(({ chapter, end, index, label, start }) => (
    Object.freeze({ end, id: chapter.id, index, label, start })
  ));

  return {
    navigationItems,
    totalWeight,

    update(progress) {
      chapters.forEach(({ chapter, start, end, isLast, root }) => {
        const isActive = progress >= start && (progress < end || isLast);
        root.visible = isActive;
        if (isActive) chapter.update(intervalProgress(progress, start, end));
      });
    },

    resize(viewport) {
      chapters.forEach(({ chapter }) => chapter.resize(viewport));
    },

    dispose() {
      chapters.forEach(({ chapter, root }) => {
        chapter.dispose();
        root.removeFromParent();
      });
    },
  };
}
