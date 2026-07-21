# Anweisungen für Coding-Agenten

## Umfang

Dieser Branch enthält ausschließlich das eigenständige experimentelle Three.js-Scroll-Projekt. Die produktive raiOS-Website liegt auf `main`; Betriebssystem, Kernel und Hardware-Code liegen im separaten [`raios`-Repository](https://github.com/Sportinger/raios).

- `main`: produktive Website auf [raios.tech](https://raios.tech)
- `three.js`: eigenständiges Three.js-Scroll-Experiment

## Arbeiten

- Vor Änderungen `README.md`, `git status --short --branch` und die betroffenen Dateien prüfen.
- Die bestehende statische Architektur mit `index.html`, `styles.css` und den Modulen unter `src/` verwenden; keine Frameworks oder ungenutzten Assets hinzufügen.
- Scroll-Animation, responsive Darstellung und reduzierte Bewegung funktionsfähig halten.
- Keine Bestandteile der produktiven Website, des UI Labs oder des Betriebssystems in diesen Branch kopieren.
- Keine Secrets und keine generierten Dateien aus `pages-dist/` committen.
- Fremde Änderungen niemals verwerfen oder überschreiben.

## Prüfen und veröffentlichen

Alle JavaScript-Dateien des Experiments mit `node --check` prüfen und immer den Produktions-Build ausführen:

```powershell
pwsh ./scripts/build-pages-site.ps1
```

Jeden abgeschlossenen Auftrag vollständig committen und auf den aktiven Branch pushen. Dabei nur die eigenen Änderungen stagen.
