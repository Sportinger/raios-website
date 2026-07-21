# Boot Sequence

Die Boot-Sequenz ist ein einziger langlebiger 3D-Objektgraph für die sichtbaren
Szenen 2 bis 9. Das Kapitel übersetzt seinen lokalen Scrollwert in `sceneIndex`
und `progress`; das Feature setzt daraus sämtliche vorherigen Phasen auf `1`,
die aktuelle Phase auf `progress` und alle späteren Phasen auf `0`.

Dieser Vertrag macht Direktansprünge, Rückwärtsscrollen, Reduced Motion und HMR
deterministisch. Die einzelnen Darsteller kennen weder Scrollpositionen noch
Kapitelnummern. Neue Phasen werden in `config.js` registriert und in
`create-boot-sequence.js` auf semantische Feature-Zustände abgebildet.

Die Kamera bleibt Kapitelverantwortung. `chapters/boot-sequence/` verwendet den
allgemeinen `createHomeboundPoseTrack()` des Camera-Rigs und fährt pro Szene eine
eigene Pose an. Der erste Trackpunkt ist die gemeinsame schräge Boot-Pose aus
Kapitel 1; erst der letzte Trackpunkt führt zur Home-Pose. Bare Metal, UEFI und
USB bleiben daher in den sichtbaren Kapiteln 2 bis 4 perspektivisch und wechseln
nicht in eine Draufsicht.

Die visuelle Hierarchie ist bindend: Bare Metal und Rust-Kernel sind vollständige
dauerhafte Schichten. UEFI ist eine temporäre vollständige Softwareschicht.
SPI-Flash, USB-Port, Boot Manager und USB Boot Service sind Objekte; Limine ist
nur ein kleines temporäres Deck. Der Stick dockt ausschließlich am physischen
Port an. UEFI und Limine ziehen sich erst nach dem Handoff zurück, während der
SPI-Flash als inaktive Hardware bestehen bleibt.

Sprechertexte, Sound und Untertitel gehören später in eine eigene Medien- bzw.
Narrationsebene und werden nicht in 3D-Features hinterlegt.
