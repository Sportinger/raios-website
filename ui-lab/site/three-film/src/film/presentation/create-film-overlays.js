import { filmStatusAt, voiceCaptionAt } from "./film-presentation-data.js";

const STYLE_TEXT = `
.film-original-overlays{position:absolute;z-index:6;inset:0;overflow:hidden;pointer-events:none;font-family:Consolas,"Courier New",monospace}
.film-original-voice{position:absolute;top:clamp(24px,4.5vh,52px);left:50%;width:calc(100% - 80px);margin:0;color:#f5f7fa;text-align:center;white-space:nowrap;transform:translateX(-50%);font-size:var(--film-caption-size,60px);font-weight:800;line-height:1.05;letter-spacing:.005em;text-shadow:0 2px 18px rgba(0,0,0,.92),0 1px 5px rgba(0,0,0,.98);opacity:0;will-change:opacity}
.film-original-status{position:absolute;right:4.25rem;bottom:2.75rem;margin:0;padding:.42rem .62rem;border:1px solid rgba(124,179,245,.3);border-radius:.18rem;color:#9dccff;background:rgba(5,8,12,.84);box-shadow:0 7px 16px rgba(0,0,0,.32);font-size:11px;font-weight:700;line-height:1;letter-spacing:.12em;opacity:0}
.film-original-status[data-tone="success"]{border-color:rgba(84,187,125,.5);color:#a9edc1}
.film-original-status[data-tone="error"]{border-color:rgba(255,100,96,.56);color:#ffaaa5}
@media(max-width:880px){.film-original-voice{width:calc(100% - 48px);max-width:calc(100% - 48px);white-space:normal;font-size:clamp(22px,6.4vw,34px);line-height:1.14}.film-original-status{right:3.25rem;bottom:3.2rem;font-size:9px}}
@media(prefers-reduced-motion:reduce){.film-original-voice,.film-original-status{transition:none}}
`;

export function createFilmOverlays({ host, showStatus = false } = {}) {
  if (!(host instanceof HTMLElement)) throw new TypeError("createFilmOverlays requires an HTMLElement host");
  const style = document.createElement("style");
  style.dataset.filmOriginalOverlayStyles = "";
  style.textContent = STYLE_TEXT;
  const root = document.createElement("div");
  root.className = "film-original-overlays";
  const voice = document.createElement("p");
  voice.className = "film-original-voice";
  voice.setAttribute("role", "status");
  voice.setAttribute("aria-live", "polite");
  const status = document.createElement("p");
  status.className = "film-original-status";
  status.setAttribute("aria-hidden", "true");
  status.hidden = !showStatus;
  root.append(voice, status);
  host.append(style, root);

  const setTime = (time) => {
    const caption = voiceCaptionAt(Number(time) || 0);
    if (voice.textContent !== caption.text) voice.textContent = caption.text;
    const availableWidth = Math.max(240, host.clientWidth - 80);
    const fittedSize = Math.min(60, Math.max(
      24,
      availableWidth / Math.max(1, caption.text.length * 0.62),
    ));
    voice.style.setProperty("--film-caption-size", `${fittedSize.toFixed(2)}px`);
    voice.style.opacity = caption.opacity.toFixed(4);
    voice.dataset.cue = caption.id;
    if (showStatus) {
      const nextStatus = filmStatusAt(Number(time) || 0);
      status.textContent = nextStatus?.text ?? "";
      status.dataset.tone = nextStatus?.tone ?? "";
      status.style.opacity = nextStatus ? "1" : "0";
    }
  };

  setTime(0);
  return {
    root,
    setTime,
    dispose() {
      root.remove();
      style.remove();
    },
  };
}
