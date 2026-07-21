# raiOS Three.js Scroll Layers

Dieser Branch enthält ausschließlich das experimentelle Three.js-Scroll-Projekt der raiOS-Website. Die produktive Website liegt auf dem Branch [`main`](https://github.com/Sportinger/raios-website/tree/main).

## Inhalt

Das Experiment liegt unter [`ui-lab/site/scroll-cube`](ui-lab/site/scroll-cube). Es besteht aus statischem HTML, CSS und JavaScript und lädt Three.js als ES-Modul über jsDelivr. Ein Paketmanager oder Build-Framework ist nicht nötig.

## Lokal starten

```powershell
pwsh ./scripts/start-threejs-codex.ps1
```

Alternativ kann ein beliebiger statischer Webserver im Repository gestartet werden:

```powershell
python -m http.server 8091
```

Danach ist das Experiment unter `http://localhost:8091/ui-lab/site/scroll-cube/` erreichbar.

## Produktions-Build

```powershell
pwsh ./scripts/build-pages-site.ps1
```

Der Build kopiert ausschließlich das Scroll-Cube-Projekt nach `pages-dist/` und prüft lokale Datei-Referenzen sowie die Cloudflare-Dateigrößenbegrenzung.

## Lizenz

Siehe [LICENSE](LICENSE).
