export function createPlaybackControls({ container, onOrbitToggle, onToggle }) {
  if (!container) throw new Error("The playback controls container is required");

  const abortController = new AbortController();
  const button = document.createElement("button");
  const orbitButton = document.createElement("button");
  let playing = false;
  let orbitEnabled = false;
  let playbackDisabled = false;
  button.type = "button";
  button.className = "playback-controls__button";
  orbitButton.type = "button";
  orbitButton.className = "playback-controls__button";

  const update = () => {
    button.textContent = playing ? "PAUSE" : "PLAY";
    button.setAttribute("aria-label", playing
      ? "Automatischen Bildlauf pausieren"
      : "Automatischen Bildlauf starten");
    button.setAttribute("aria-pressed", String(playing));
    button.disabled = playbackDisabled || orbitEnabled;
    orbitButton.textContent = "ORBIT";
    orbitButton.setAttribute("aria-label", orbitEnabled
      ? "Freie Orbit-Kamera ausschalten"
      : "Freie Orbit-Kamera einschalten");
    orbitButton.setAttribute("aria-pressed", String(orbitEnabled));
  };
  button.addEventListener("click", () => onToggle(!playing), {
    signal: abortController.signal,
  });
  orbitButton.addEventListener("click", () => onOrbitToggle(!orbitEnabled), {
    signal: abortController.signal,
  });
  update();
  container.append(button, orbitButton);

  return {
    setDisabled(disabled) {
      playbackDisabled = disabled;
      button.title = disabled
        ? "Automatischer Bildlauf ist bei reduzierter Bewegung deaktiviert"
        : orbitEnabled ? "Autoplay ist im Orbit-Modus pausiert" : "";
      update();
    },
    setOrbitEnabled(enabled) {
      orbitEnabled = enabled;
      button.title = enabled
        ? "Autoplay ist im Orbit-Modus pausiert"
        : playbackDisabled
          ? "Automatischer Bildlauf ist bei reduzierter Bewegung deaktiviert"
          : "";
      update();
    },
    setPlaying(nextPlaying) {
      playing = nextPlaying;
      update();
    },
    dispose() {
      abortController.abort();
      container.replaceChildren();
    },
  };
}
