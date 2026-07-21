import { intervalProgress } from "../animation/progress.js";
import { STORY_MAP } from "./story-map.js";

export function createStory({ scene }) {
  const totalWeight = STORY_MAP.reduce((total, entry) => total + entry.weight, 0);
  let weightCursor = 0;
  const chapters = STORY_MAP.map((entry) => {
    const chapter = entry.create();
    if (chapter.id !== entry.id) {
      throw new Error(`Chapter id mismatch: expected ${entry.id}, received ${chapter.id}`);
    }
    const start = weightCursor / totalWeight;
    weightCursor += entry.weight;
    const end = weightCursor / totalWeight;
    scene.add(chapter.group);
    return { chapter, end, start };
  });

  return {
    totalWeight,

    update(progress) {
      chapters.forEach(({ chapter, start, end }) => {
        chapter.update(intervalProgress(progress, start, end));
      });
    },

    resize(viewport) {
      chapters.forEach(({ chapter }) => chapter.resize(viewport));
    },

    dispose() {
      chapters.forEach(({ chapter }) => chapter.dispose());
    },
  };
}
