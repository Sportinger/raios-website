import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createPowerButton } from "../../features/power-button/index.js";
import { POWER_ON_TIMELINE } from "./timeline.js";

export function createPowerOnChapter() {
  const powerButton = createPowerButton();

  return {
    id: "power-on",
    group: powerButton.group,

    update(progress) {
      const pressIn = smootherstep(intervalProgress(progress, ...POWER_ON_TIMELINE.press));
      const settle = smootherstep(intervalProgress(progress, ...POWER_ON_TIMELINE.settle));
      powerButton.setState({
        revealProgress: intervalProgress(progress, ...POWER_ON_TIMELINE.reveal),
        pressProgress: pressIn * (1 - settle * 0.18),
        powerProgress: intervalProgress(progress, ...POWER_ON_TIMELINE.power),
        exitProgress: intervalProgress(progress, ...POWER_ON_TIMELINE.exit),
      });
    },

    resize() {},
    dispose: () => powerButton.dispose(),
  };
}
