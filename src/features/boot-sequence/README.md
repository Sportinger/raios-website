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
Scrollabschnitte weich von `1` auf `2` gefahren. Die Schicht erreicht damit erst
im frühen USB-Abschnitt ihre endgültige Deckkraft `0.56`, ohne Kanten oder Titel
zusätzlich aufzuhellen.

Der Datenfluss besitzt eine feste Leserichtung von rechts nach links:

```text
USB-Stick → USB Boot Service → Boot Manager → Limine → Rust-Kernel
```

USB Boot Service sitzt rechts direkt über dem physischen Port und Boot Manager
in der Mitte. Aus `BOOTX64.EFI` wächst darüber die vollständige Limine-Schicht;
auf ihr läuft der Pfad von rechts nach links durch `CONFIG`, `KERNEL LOADER` und
`HANDOFF`. Der physische USB-Pfad verwendet dasselbe wiederverwendbare
`connections/cable` wie der Power-on-Link. Seine feature-spezifische Route steigt
zunächst gerade aus dem Port und läuft danach in einer weichen Kurve unter den
USB-Service. Ein kompaktes Plasmaleuchten an der Spitze legt das Kabel sichtbar
entlang der Route aus. Nach einer kurzen Haltephase wandert der Kabelanfang nach,
sodass die temporäre Verbindung von hinten wieder kürzer wird. Das allgemeine
Kabel unterstützt dafür unabhängig steuerbare Reveal- und Retract-Grenzen;
schmale Energieringe respektieren dasselbe sichtbare Fenster. Jeder Übergang besitzt
einen eigenen Zustand: Der physische USB-Pfad dimmt vor dem einzelnen
`BOOTX64.EFI`-Paket, dessen Pfad dimmt vor der
Limine-Entfaltung, und anschließend bleibt nur der aktuelle Kernel-Datenpfad
aktiv. Einen rückwärts laufenden Suchstrom oder kreuzende Leitungen gibt es nicht.

Beschriftungen liegen ausschließlich auf der zur Startkamera gerichteten
Seitenfläche. Sichtbar ist nur der große, fette weiße Hauptbegriff; graue
Erklärungszeilen werden nicht gerendert. Oberseiten bleiben für Lichtmuster,
Teilungslinien und einfache Symbole frei.

Sprechertexte, Sound und Untertitel gehören später in eine eigene Medien- bzw.
Narrationsebene und werden nicht in 3D-Features hinterlegt.
