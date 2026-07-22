import { createFilmApp } from "./src/film/create-film-app.js";

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
  const embeddedStyles = document.createElement("link");
  embeddedStyles.rel = "stylesheet";
  embeddedStyles.href = new URL("./embedded-film.css", import.meta.url).href;
  const shell = document.createElement("div");
  shell.className = "embedded-film-shell";
  shell.innerHTML = markup;
  shadow.append(baseStyles, embeddedStyles, shell);

  const app = createFilmApp({
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
