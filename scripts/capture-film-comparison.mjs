import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const DEFAULT_REFERENCE_ROOT = path.resolve(PROJECT_ROOT, "..", "raios-film-reference");
const DEFAULT_TIMES = [6.5, 10.8, 14.4, 17.3];
const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".woff2", "font/woff2"],
]);

function readArgument(name, fallback) {
  const prefix = `--${name}=`;
  const argument = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : fallback;
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);
  const chrome = candidates.find(existsSync);
  if (!chrome) throw new Error("Chrome wurde nicht gefunden. CHROME_PATH kann den Pfad vorgeben.");
  return chrome;
}

function startStaticServer(root, indexFile) {
  const resolvedRoot = path.resolve(root);
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "") || indexFile;
      const filePath = path.resolve(resolvedRoot, relativePath);
      if (filePath !== resolvedRoot && !filePath.startsWith(`${resolvedRoot}${path.sep}`)) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      const body = await readFile(filePath);
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": MIME_TYPES.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function capture(chrome, url, outputPath, viewport, profileRoot) {
  const profilePath = `${profileRoot}-${path.basename(outputPath, path.extname(outputPath))}`;
  await rm(profilePath, { recursive: true, force: true });
  await rm(outputPath, { force: true });
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--force-device-scale-factor=1",
    "--virtual-time-budget=1800",
    `--user-data-dir=${profilePath}`,
    `--screenshot=${outputPath}`,
    `--window-size=${viewport.width},${viewport.height}`,
    url,
  ];
  try {
    await new Promise((resolve, reject) => {
      const child = spawn(chrome, args, { stdio: ["ignore", "ignore", "pipe"] });
      let errors = "";
      child.stderr.on("data", (chunk) => { errors += chunk; });
      child.once("error", reject);
      child.once("exit", (code) => {
        if (code === 0 && existsSync(outputPath)) resolve();
        else reject(new Error(`Chrome-Aufnahme fehlgeschlagen (${code ?? "kein Exitcode"}).\n${errors}`));
      });
    });
  } finally {
    await rm(profilePath, { recursive: true, force: true });
  }
}

async function responds(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: PROJECT_ROOT, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} wurde mit Exitcode ${code ?? "unbekannt"} beendet.`));
    });
  });
}

function comparisonDocument(time, oldName, newName) {
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{margin:0;background:#020508;color:#fff;font:700 16px ui-monospace,Consolas,monospace}
main{display:grid;grid-template-columns:1fr 1fr;height:100vh;gap:2px;background:#4c84bb}
figure{position:relative;margin:0;overflow:hidden;background:#000}
img{width:100%;height:100%;object-fit:contain;display:block}
figcaption{position:absolute;top:14px;left:14px;padding:8px 12px;border:1px solid #66aef7;background:#02060de6;letter-spacing:.12em}
.time{position:fixed;z-index:2;left:50%;top:14px;transform:translateX(-50%);padding:8px 12px;background:#02060d;border:1px solid #a9ffd0}
</style></head><body><div class="time">t = ${time}s</div><main>
<figure><img src="${oldName}" alt="Originalfilm"><figcaption>ORIGINAL 2.5D</figcaption></figure>
<figure><img src="${newName}" alt="Three.js-Nachbau"><figcaption>THREE.JS 3D</figcaption></figure>
</main></body></html>`;
}

const referenceRoot = path.resolve(readArgument("reference-root", DEFAULT_REFERENCE_ROOT));
const requestedCandidateUrl = readArgument("candidate-url", "");
const times = readArgument("times", DEFAULT_TIMES.join(","))
  .split(",")
  .map(Number)
  .filter(Number.isFinite);
const viewport = {
  width: Number(readArgument("width", "1772")),
  height: Number(readArgument("height", "1180")),
};
const outputRoot = path.join(PROJECT_ROOT, ".visual-comparisons", "latest");
const profilePath = path.join(PROJECT_ROOT, ".visual-comparisons", "chrome-profile");
const chrome = findChrome();

if (!existsSync(path.join(referenceRoot, "raios-ui-lab.html"))) {
  throw new Error(`Referenzfilm nicht gefunden: ${referenceRoot}`);
}
if (times.length === 0) throw new Error("Mindestens eine gültige Filmsekunde ist erforderlich.");

await mkdir(outputRoot, { recursive: true });
let candidateServer = null;
let candidateUrl = requestedCandidateUrl;
if (!candidateUrl) {
  await run("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(SCRIPT_DIR, "build-pages-site.ps1")]);
  candidateServer = await startStaticServer(path.join(PROJECT_ROOT, "pages-dist"), "index.html");
  const candidateAddress = candidateServer.address();
  if (!candidateAddress || typeof candidateAddress === "string") {
    throw new Error("Der lokale Three.js-Server hat keinen TCP-Port bereitgestellt.");
  }
  candidateUrl = `http://127.0.0.1:${candidateAddress.port}/`;
}
const referenceServer = await startStaticServer(referenceRoot, "raios-ui-lab.html");
const referenceAddress = referenceServer.address();
if (!referenceAddress || typeof referenceAddress === "string") {
  throw new Error("Der lokale Referenzserver hat keinen TCP-Port bereitgestellt.");
}

try {
  for (const time of times) {
    const slug = time.toFixed(1).padStart(5, "0");
    const oldName = `old-${slug}.png`;
    const newName = `new-${slug}.png`;
    const compareName = `compare-${slug}.png`;
    const htmlName = `compare-${slug}.html`;
    const oldPath = path.join(outputRoot, oldName);
    const newPath = path.join(outputRoot, newName);
    const htmlPath = path.join(outputRoot, htmlName);
    const comparePath = path.join(outputRoot, compareName);
    const referenceUrl = `http://127.0.0.1:${referenceAddress.port}/raios-ui-lab.html?film=isolate&anim=0&animt=${time}`;
    const candidate = new URL(candidateUrl);
    candidate.searchParams.set("time", String(time));

    await capture(chrome, referenceUrl, oldPath, viewport, profilePath);
    if (!(await responds(candidate.href))) {
      throw new Error(`Der Three.js-Server ist vor der Aufnahme nicht mehr erreichbar: ${candidate.href}`);
    }
    await capture(chrome, candidate.href, newPath, viewport, profilePath);
    await writeFile(htmlPath, comparisonDocument(time, oldName, newName), "utf8");
    await capture(chrome, new URL(`file:///${htmlPath.replaceAll("\\", "/")}`).href, comparePath, viewport, profilePath);
    console.log(`${time}s -> ${path.relative(PROJECT_ROOT, comparePath)}`);
  }
} finally {
  referenceServer.close();
  candidateServer?.close();
}
