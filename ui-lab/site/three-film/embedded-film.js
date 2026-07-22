import { createFilmApp } from "./src/film/create-film-app.js";

const embeddedStyleText = `
  :host {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 100svh;
    background: transparent;
    contain: layout paint style;
  }

  .embedded-film-shell,
  .film-stage,
  .film-viewport {
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  .film-stage {
    position: relative;
  }

  .film-viewport {
    position: relative;
    top: auto;
    background: transparent;
  }

  .film-viewport::before {
    content: none;
  }

  .film-vignette {
    display: none;
  }

  #film-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .audio-toggle,
  .film-viewport.has-entered-film .audio-toggle,
  .film-viewport.has-transport .audio-toggle {
    top: clamp(5rem, 10vh, 7rem);
    right: auto;
    bottom: auto;
    left: 50%;
    width: 2.75rem;
    min-width: 0;
    height: 2.75rem;
    min-height: 0;
    padding: 0;
    transform: translateX(-50%);
    border: 0;
    border-radius: 0;
    color: #ddeeff;
    background: transparent;
    box-shadow: none;
    backdrop-filter: none;
  }

  .audio-toggle span {
    display: none;
  }

  .audio-toggle svg {
    width: 2rem;
    height: 2rem;
  }

  @media (prefers-reduced-motion: reduce) {
    :host {
      min-height: min(100svh, 760px);
    }
  }
`;

const markup = `
  <main id="film-stage" class="film-stage">
    <section class="film-viewport" aria-label="The Factory Moves In as a real 3D film">
      <canvas id="film-canvas" aria-hidden="true"></canvas>
      <div class="film-vignette" aria-hidden="true"></div>
      <header class="film-header">
        <p class="film-kicker">raiOS architecture film · native Three.js</p>
        <h1 id="scene-title">The Factory Moves In</h1>
      </header>
      <div id="prompt" class="film-prompt" aria-live="polite"></div>
      <div class="film-transport">
        <button id="play-toggle" type="button" aria-pressed="false">PLAY</button>
        <output id="timecode">00:00.00</output>
      </div>
      <button id="audio-toggle" class="audio-toggle" type="button" aria-pressed="false"></button>
      <button
        id="orbit-toggle"
        class="orbit-toggle"
        type="button"
        aria-pressed="false"
        title="Explore the current film frame in 3D"
      >FREE ORBIT</button>
      <nav id="chapter-navigation" class="chapter-navigation" aria-label="Film chapters"></nav>
      <div class="film-progress" aria-hidden="true"><i id="progress-fill"></i></div>
    </section>
  </main>
`;

export function mountEmbeddedFilm(host, {
  initialAnimationTime,
  onRequestPlaybackTime,
} = {}) {
  if (!(host instanceof HTMLElement)) {
    throw new TypeError("mountEmbeddedFilm requires an HTMLElement host");
  }
  if (host.shadowRoot) {
    throw new Error("The embedded film host is already mounted");
  }

  const shadow = host.attachShadow({ mode: "open" });
  const baseStyles = document.createElement("link");
  baseStyles.rel = "stylesheet";
  baseStyles.href = new URL("./styles.css", import.meta.url).href;
  const embeddedStyles = document.createElement("style");
  embeddedStyles.textContent = embeddedStyleText;
  const shell = document.createElement("div");
  shell.className = "embedded-film-shell";
  shell.innerHTML = markup;
  shadow.append(baseStyles, embeddedStyles, shell);

  const app = createFilmApp({
    audioToggle: shadow.getElementById("audio-toggle"),
    canvas: shadow.getElementById("film-canvas"),
    chapterNavigation: shadow.getElementById("chapter-navigation"),
    orbitToggle: shadow.getElementById("orbit-toggle"),
    playToggle: shadow.getElementById("play-toggle"),
    progressFill: shadow.getElementById("progress-fill"),
    prompt: shadow.getElementById("prompt"),
    sceneTitle: shadow.getElementById("scene-title"),
    stage: shadow.getElementById("film-stage"),
    timecode: shadow.getElementById("timecode"),
    initialAnimationTime,
    externalPlayback: true,
    transparentBackground: true,
    onRequestPlaybackTime,
  });

  return {
    ...app,
    dispose() {
      app.dispose();
      shadow.replaceChildren();
    },
  };
}
