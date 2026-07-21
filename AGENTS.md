# Anweisungen für Coding-Agenten

## Umfang

Dieses Repository enthält ausschließlich die öffentliche raiOS-Website mit eingebettetem UI Lab. Betriebssystem, Kernel und Hardware-Code liegen im separaten [`raios`-Repository](https://github.com/Sportinger/raios) und dürfen hier nicht ergänzt werden.

- `main`: produktive Website auf [raios.tech](https://raios.tech)
- [`three.js`](https://github.com/Sportinger/raios-website/tree/three.js): experimenteller Branch
- [Three.js-Scroll-Projekt](https://github.com/Sportinger/raios-website/tree/three.js/ui-lab/site/scroll-cube)

## Arbeiten

- Vor Änderungen `README.md`, `git status --short --branch` und die betroffenen Dateien prüfen.
- Bestehende statische Architektur und Komponenten verwenden; keine Frameworks oder ungenutzten Assets hinzufügen.
- Website, UI Lab, Modus-Schalter, responsive Darstellung und reduzierte Bewegung funktionsfähig halten.
- Filmzustände ausschließlich deterministisch über `ui-lab/site/film.js` steuern.
- Keine Secrets und keine generierten Dateien aus `pages-dist/` committen.
- Fremde Änderungen niemals verwerfen oder überschreiben.

## Prüfen und veröffentlichen

Passende JavaScript-Dateien mit `node --check` prüfen und immer den Produktions-Build ausführen:

```powershell
pwsh ./scripts/build-pages-site.ps1
```

Jeden abgeschlossenen Auftrag vollständig committen und auf den aktiven Branch pushen. Dabei nur die eigenen Änderungen stagen. Ein Push auf `main` deployt die produktive Website und ist nur nach erfolgreichem Build erlaubt.
