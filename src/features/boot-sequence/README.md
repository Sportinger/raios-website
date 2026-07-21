# Boot Sequence

Die Boot-Sequenz ist ein einziger langlebiger 3D-Objektgraph für die sichtbaren
Szenen 2 bis 8. Das Kapitel übersetzt seinen lokalen Scrollwert in `sceneIndex`
und `progress`; das Feature setzt daraus sämtliche vorherigen Phasen auf `1`,
die aktuelle Phase auf `progress` und alle späteren Phasen auf `0`.

Dieser Vertrag macht Direktansprünge, Rückwärtsscrollen, Reduced Motion und HMR
deterministisch. Die einzelnen Darsteller kennen weder Scrollpositionen noch
Kapitelnummern. Neue Phasen werden in `config.js` registriert und in
`create-boot-sequence.js` auf semantische Feature-Zustände abgebildet.

Das frühere reine Bare-Metal-Unterkapitel existiert nicht mehr. Kapitel 1 stellt
die physische Plattform bereits fertig her; die erste Boot-Phase beginnt deshalb
direkt mit UEFI und wird in der Navigation als Kapitel 2 veröffentlicht.

Die Kamera bleibt Kapitelverantwortung. `chapters/boot-sequence/` verwendet den
allgemeinen `createHomeboundPath()` des Camera-Rigs und fährt unabhängig von den
Navigationsankern eine einzige kontinuierliche Spline. Der erste Pfadpunkt ist
die gemeinsame schräge Boot-Pose aus Kapitel 1; erst der letzte Pfadpunkt führt
zur Home-Pose. UEFI und USB bleiben daher in den sichtbaren Kapiteln 2 und 3
perspektivisch und wechseln nicht in eine Draufsicht.

Die visuelle Hierarchie ist bindend: Bare Metal und Rust-Kernel sind vollständige
dauerhafte Schichten. UEFI und Limine sind temporäre vollständige
Softwareschichten. Alle vier Vollschichten beziehen Breite, Tiefe und Dicke aus
dem gemeinsamen `SYSTEM_LAYER_SIZE`-Preset, liegen exakt auf derselben X/Z-Achse
und unterscheiden sich im Stapel nur durch ihre Höhe. SPI-Flash, USB-Port, Boot
Manager und USB Boot Service sind Objekte. Der Stick dockt ausschließlich am
physischen Port an. UEFI und Limine ziehen sich erst nach dem Handoff gemeinsam
zurück, während der SPI-Flash als inaktive Hardware bestehen bleibt.

Die UEFI-Fläche startet nach ihrer Entfaltung mit `0.28` Materialdeckkraft. Ab
dem Ende der Expansion wird die allgemeine `surfaceOpacityScale` über mehrere
Scrollabschnitte weich von `1` auf rund `3.21` gefahren. Die Schicht erreicht damit erst
im frühen USB-Abschnitt ihre endgültige Deckkraft `0.9` und verdeckt den
darunterliegenden SPI-Flash fast vollständig, ohne Kanten oder Titel zusätzlich
aufzuhellen.

UEFI und Limine schreiben trotz ihrer transparenten Materialien Tiefe. Ihre
Flächen werden nach den Kabeloberflächen gerendert: Ein Kabelabschnitt hinter
beziehungsweise innerhalb einer Softwareschicht wird dadurch von deren Farbe
und Dichte beeinflusst, während ein geometrisch davorliegender Abschnitt klar
bleibt. Der Kernel startet mit `0.76` Deckkraft und verdichtet sich beim Running
nur bis `0.90`; auch er bleibt damit als eigene räumliche Ebene lesbar.

Der Datenfluss besitzt eine feste Leserichtung von rechts nach links:

```text
USB-Stick → USB Boot Service → Boot Manager → Limine → Rust-Kernel
```

USB Boot Service und Boot Manager sitzen mit großem Abstand symmetrisch rechts
und links der Schichtmitte. Aus dem Footprint des Boot Managers steigt die
vollständige Limine-Schicht kompakt auf und expandiert erst auf Zielhöhe;
auf ihr läuft der Pfad von rechts nach links durch `CONFIG`, `KERNEL LOADER` und
`HANDOFF`. Der physische USB-Pfad verwendet dasselbe wiederverwendbare
`connections/cable` wie der Power-on-Link. Die wiederverwendbare Komposition
`transient-signal-cable` verbindet Kabel, Energieringe und Lichtkopf. Die erste
feature-spezifische Route beginnt innerhalb des eingesteckten Sticks, läuft kurz
horizontal durch Bare Metal, steigt mit engen abgerundeten Ecken nach oben und
dockt seitlich an USB Boot an. Eine zweite Instanz verbindet USB Boot mit dem
Boot Manager. Die Lichtköpfe laufen nacheinander durch beide Verbindungen; danach bleiben die
vollständig verlegten blauen Kabel bestehen. Jeder Übergang besitzt
einen eigenen Zustand: Der physische USB-Pfad dimmt vor dem einzelnen
`BOOTX64.EFI`-Paket, dessen Pfad dimmt vor der
Limine-Entfaltung, und anschließend bleibt nur der aktuelle Kernel-Datenpfad
aktiv. Einen rückwärts laufenden Suchstrom oder kreuzende Leitungen gibt es nicht.

Nach dem Verlegen ist die Energiephase nicht an den Scrollwert gekoppelt. Der
globale Render-Tick liefert eine fortlaufende Zeitphase an beide Kabel, sodass
die schmalen Energieringe auch bei ruhendem Scrollen dauerhaft vom Stick zum USB
Boot Service und weiter zum Boot Manager fließen. Bei reduzierter Bewegung wird
diese Phase auf null fixiert.

Beim Limine-Aufbau steigt der kompakte Footprint zunächst senkrecht über dem Boot
Manager auf, ohne seitlich zu wandern. Danach expandiert er über einen einmalig
aus Quellposition, Quellgröße und Zielgröße berechneten Skalier-Pivot. Dadurch
liegt die fertige Vollschicht bei Skalierung `1` automatisch exakt auf der
gemeinsamen X/Z-Achse des Systemstapels; eine nachträgliche Positionsanimation
ist nicht erforderlich. Kanten und Flächen besitzen getrennte Reveal-Werte:
Limine steigt zunächst als reiner Wireframe auf und beginnt seine Expansion
ebenfalls ohne Fläche. Erst im späteren Teil der Expansion wird das Material
langsam bis zur endgültigen Deckkraft eingeblendet.

Schichttitel liegen ausschließlich auf der zur Startkamera gerichteten
Seitenfläche. Dort ist nur der große, fette weiße Hauptbegriff sichtbar;
graue Erklärungszeilen werden nicht gerendert. Funktionale Karten dürfen eine
kleinere fachliche Unterzeile besitzen. Label-Canvas und Label-Geometrie teilen
immer dasselbe Seitenverhältnis; Text wird durch Font-Fitting statt durch
`fillText(..., maxWidth)` eingepasst. Expandierende Schichten kompensieren ihre
nicht-uniforme Elternskalierung für alle registrierten Labels, sodass Glyphen
weder während des Aufbaus noch im Endzustand gestaucht werden.

Die Limine-Schicht besitzt exakt drei Funktionsobjekte: `CONFIG · SELECT BOOT
ENTRY`, `KERNEL LOADER · LOAD ELF IMAGE` und `HANDOFF · BOOT INFO · ENTRY`.
`limine.conf` und `kernel.elf` verwenden das allgemeine beschriftete
`objects/effects/labeled-data-packet`; die ausgewählten Konfigurationswerte und
die sechs Boot-Info-Karten bleiben in eigenen Limine-Untermodulen. Beim Handoff
dimmen CONFIG und Loader, während nur HANDOFF, die einmalige Tür und der letzte
Kontrollimpuls aktiv bleiben.

Sprechertexte, Sound und Untertitel gehören später in eine eigene Medien- bzw.
Narrationsebene und werden nicht in 3D-Features hinterlegt.
