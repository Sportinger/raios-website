# Anweisungen für Coding-Agenten

## Umfang

Dieser Branch enthält ausschließlich den eigenständigen nativen Three.js-
Nachbau des Films „The Factory Moves In“.

- `main`: produktive Website und 2,5D-Referenzfilm
- `three.js`: separates Three.js-Chip-/Boot-Experiment
- `three-film-3d`: echter räumlicher Filmnachbau

## Arbeiten

- Vor Änderungen `README.md`, `git status --short --branch` und betroffene
  Dateien prüfen.
- Die statische Architektur mit `index.html`, `styles.css` und ES-Modulen unter
  `src/` beibehalten; keine Frameworks oder ungenutzten Assets ergänzen.
- Der Referenzfilm auf `main` darf analysiert, aber UI-Lab-SVG, CSS und
  Produktionskomponenten dürfen nicht kopiert werden.
- Alle Filmzustände müssen ausschließlich von `setTime(time)` abhängen, damit
  Scrollen, Rückwärtslauf und direkte Kapitelansprünge deterministisch bleiben.
- Responsive Darstellung und `prefers-reduced-motion` funktionsfähig halten.
- Keine Secrets und keine generierten Dateien aus `pages-dist/` committen.
- Fremde Änderungen niemals verwerfen oder überschreiben.

## Prüfen und veröffentlichen

Alle JavaScript-Dateien mit `node --check` prüfen und den Produktions-Build
ausführen:

```powershell
npm run check
```

Jeden abgeschlossenen Auftrag vollständig committen und auf den aktiven Branch
pushen. Dabei nur eigene Änderungen stagen.
