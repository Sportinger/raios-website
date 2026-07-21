export const KERNEL_SECTIONS = Object.freeze([
  Object.freeze({
    title: "BOOT",
    description: "übernimmt die Maschine von UEFI/Limine",
  }),
  Object.freeze({
    title: "MEMORY",
    description: "ordnet und schützt den Speicher",
  }),
  Object.freeze({
    title: "SCHEDULER",
    description: "verteilt Rechenzeit",
  }),
  Object.freeze({
    title: "IRQ / FAULTS",
    description: "empfängt Interrupts und Fehler",
  }),
  Object.freeze({
    title: "MMU / IOMMU",
    description: "isoliert Domains und Gerätezugriffe",
  }),
  Object.freeze({
    title: "WATCHDOG / RECLOG",
    description: "erkennt Ausfälle und erhält die Recovery-Spur",
  }),
]);

export const KERNEL_NARRATION = [
  "Zuerst übernimmt ein kleiner Rust-Kernel die rohe Maschine.",
  "Er ordnet den Speicher, verteilt Rechenzeit, kontrolliert Interrupts und zieht Schutzgrenzen um CPU und Geräte.",
  "Er kennt noch keine Apps, keine Treiber und keinen Agenten.",
  "Er sorgt nur dafür, dass die Maschine kontrollierbar bleibt – selbst wenn später alles darüber scheitert.",
].join(" ");
