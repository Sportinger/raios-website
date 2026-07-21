import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(repositoryRoot, "src");
const entryFile = path.join(sourceRoot, "main.js");
const importPattern = /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?["']([^"']+)["']/g;

function collectJavaScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectJavaScriptFiles(entryPath);
    return entry.isFile() && entry.name.endsWith(".js") ? [entryPath] : [];
  });
}

const files = collectJavaScriptFiles(sourceRoot);
const fileSet = new Set(files);
const dependencies = new Map();
const missingImports = [];

files.forEach((file) => {
  const source = fs.readFileSync(file, "utf8");
  const localDependencies = [...source.matchAll(importPattern)]
    .map((match) => match[1])
    .filter((specifier) => specifier.startsWith("."))
    .map((specifier) => path.resolve(path.dirname(file), specifier));
  dependencies.set(file, localDependencies);
  localDependencies.forEach((dependency) => {
    if (!fileSet.has(dependency)) {
      missingImports.push(`${path.relative(repositoryRoot, file)} -> ${specifierFor(dependency)}`);
    }
  });
});

function specifierFor(file) {
  return path.relative(repositoryRoot, file) || file;
}

const reachable = new Set();
function visit(file) {
  if (reachable.has(file) || !fileSet.has(file)) return;
  reachable.add(file);
  dependencies.get(file).forEach(visit);
}
visit(entryFile);

const unreachable = files
  .filter((file) => !reachable.has(file))
  .map(specifierFor)
  .sort();

if (missingImports.length || unreachable.length) {
  if (missingImports.length) {
    console.error("Missing local imports:\n" + missingImports.join("\n"));
  }
  if (unreachable.length) {
    console.error("Modules unreachable from src/main.js:\n" + unreachable.join("\n"));
  }
  process.exitCode = 1;
} else {
  console.log(`Module graph OK: ${reachable.size} reachable source modules`);
}
