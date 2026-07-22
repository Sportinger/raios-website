# raiOS Website & UI Lab

[raios.tech](https://raios.tech) ist die öffentliche Website von raiOS. Dieses Repository enthält außerdem das interaktive UI Lab, in dem die Oberfläche und ihre animierten Abläufe direkt im Browser erlebbar sind.

Dieses eigenständige Repository enthält bewusst nur die Website. Kernel-Quellcode, bootfähiges Betriebssystem und QEMU-Umgebung liegen weiterhin im separaten [`raios`](https://github.com/Sportinger/raios)-Repository. Der Branch [`three.js`](https://github.com/Sportinger/raios-website/tree/three.js) bewahrt das experimentelle [Three.js-Scroll-Projekt](https://github.com/Sportinger/raios-website/tree/three.js/ui-lab/site/scroll-cube); `main` ist die produktive Website.

## Inhalt

- **Website-Modus:** öffentliche Landingpage mit Projektgeschichte und Downloads/Links.
- **UI-Lab-Modus:** interaktive Vorschau der raiOS-Oberflächen.
- **Genesis-Film:** deterministisch gesteuerte Animation des Build- und Freigabeprozesses.
- **Surface-Demos:** Dream, Genesis, Setup, WLAN, Recovery, Vault und Personal Surface.
- **Cloudflare-Pages-Build:** schlanker Produktions-Build ohne Framework oder Paketmanager.

Zwischen Website und UI Lab kann direkt auf der Seite über den Modus-Schalter gewechselt werden.

### Genesis-Film in echtem 3D

Der Website-Modus verwendet den modularen Three.js-Film aus
`ui-lab/site/three-film/`. Er wird in einem Shadow DOM montiert, damit seine
Styles und DOM-IDs nicht mit Website oder UI Lab kollidieren. Die bestehende
2,5D-SVG-Fassung bleibt vollständig in `raios-ui-lab.html`, `story.css` und
`film.js` erhalten, ist über `data-film-engine="three"` jedoch abgeklemmt.

`ui-lab/site/film.js` bleibt der zentrale Website-Controller: Er übersetzt die
natürliche Scrollposition in die Playback-Zeit des 3D-Films und nimmt Sprünge
aus dessen Kapitelsteuerung wieder als Seitenscroll entgegen. Der eingebettete
Renderer ist transparent und deaktiviert seinen internen GridHelper, sodass das
durchlaufende Website-Raster hinter der Szene sichtbar bleibt und mit der Seite
scrollt. Der eigenständige Three.js-Film behält weiterhin sein eigenes Raster.
Foundation und Factory hängen im eingebetteten Film gemeinsam an einem stabilen
Transform-Träger im Mittelpunkt des Rust-Kernel-Layers, sodass spätere
Layer-Rotationen den vollständigen Objektverbund geschlossen mitnehmen. Zwischen
Playback `00:28.29` und `00:40.72` dreht sich dieser Verbund weich um `90°` im
Uhrzeigersinn. Zwischen `00:58.00` und `01:06.00` folgen weitere `45°` in
derselben Richtung; danach bleibt der Verbund bei insgesamt `135°` stehen.

## Lokal starten

Es müssen keine Abhängigkeiten installiert werden. Starte im Repository einen beliebigen statischen Webserver, zum Beispiel:

```powershell
python -m http.server 8080
```

Öffne anschließend:

```text
http://localhost:8080/raios-ui-lab.html
```

Das direkte Öffnen der HTML-Datei kann je nach Browser Einschränkungen bei Modulen oder Assets verursachen. Ein lokaler HTTP-Server ist daher vorzuziehen.

## Produktions-Build

```powershell
pwsh ./scripts/build-pages-site.ps1
```

Das Skript erzeugt `pages-dist/` und führt dabei grundlegende Prüfungen für referenzierte Dateien und die Cloudflare-Dateigrößenbegrenzung aus. Die Quelldatei `raios-ui-lab.html` wird im Build als `index.html` veröffentlicht.

Der Build hängt eine Versionskennung an lokale CSS-, JavaScript- und Medien-URLs. Im Deployment wird dafür der Git-Commit verwendet; lokale Builds erzeugen automatisch einen Inhalts-Hash. Der Pages-Worker liefert HTML und `version.json` mit `Cache-Control: no-store` aus. Bereits geöffnete Produktions-Tabs prüfen diese kleine Versionsdatei regelmäßig und laden bei einem neuen Deployment automatisch den aktuellen Einstiegspunkt; lokale Quellansichten bleiben davon unberührt.

## Deployment

Änderungen an den Website-Dateien auf `main` werden über [GitHub Actions](.github/workflows/deploy-raios-pages.yml) in den Cloudflare-Pages-Branch `main` des Projekts `raios-site` deployt. Die produktive Domain ist [raios.tech](https://raios.tech).

Reine Dokumentationsänderungen lösen aufgrund der Pfadfilter im Workflow kein Deployment aus.

## Struktur

| Pfad | Zweck |
| --- | --- |
| `raios-ui-lab.html` | Gemeinsamer Einstiegspunkt für Website und UI Lab |
| `ui-lab/site/` | Website-Modus, Story, Boot-Sequenz und Genesis-Film |
| `ui-lab/site/three-film/` | Isolierter Three.js-Film mit Audio und Embed-Laufzeit |
| `ui-lab/lab/` | UI-Lab-Steuerung, Szenarien und Diagnose |
| `ui-lab/core/` | Gemeinsames Modell, Fonts und Zeichenprimitiven |
| `ui-lab/surfaces/` | Einzelne raiOS-Oberflächen und Abläufe |
| `ui-lab/assets/` | Audio-, Bild- und Oberflächen-Assets |
| `scripts/build-pages-site.ps1` | Reproduzierbarer Cloudflare-Pages-Build |
| `cloudflare/pages-worker.mjs` | Worker für die veröffentlichte Seite |

## Arbeiten am Projekt

- Markup und grundlegende Seitenstruktur liegen in `raios-ui-lab.html`.
- Website-Texte und Inszenierung liegen überwiegend in `ui-lab/site/`.
- Wiederverwendbare UI-Bausteine gehören nach `ui-lab/core/` oder `ui-lab/surfaces/`.
- Der Filmablauf wird zentral und deterministisch über `ui-lab/site/film.js` gesteuert.
- Neue Frameworks, Bundler oder Laufzeitabhängigkeiten sind für die aktuelle Architektur nicht vorgesehen.

Weitere verbindliche Hinweise für Coding-Agenten stehen in [AGENTS.md](AGENTS.md).

## Lizenz

Siehe [LICENSE](LICENSE).
