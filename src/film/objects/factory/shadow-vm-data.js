const freezeEntries = (entries) => Object.freeze(entries.map((entry) => Object.freeze(entry)));

export const SHADOW_VM_WINDOWS = Object.freeze({
  rehearsal: Object.freeze({ start: 57.8, end: 60.8 }),
  final: Object.freeze({ start: 71.2, end: 94 }),
  actOne: Object.freeze({ start: 71.2, end: 77 }),
  actTwo: Object.freeze({ start: 78, end: 84.5 }),
  actThree: Object.freeze({ start: 85.5, end: 93.2 }),
  receipt: Object.freeze({ start: 93.2, end: 94 }),
});

export const SHADOW_VM_BEATS = freezeEntries([
  {
    id: "a1_ghost_entry",
    start: 71.2,
    end: 73.2,
    act: 1,
    caption: "GHOST COPY · INERT",
    actions: ["door.pulse", "program.move"],
  },
  {
    id: "a1_mock_io",
    start: 73.2,
    end: 75.5,
    act: 1,
    caption: "MOCK I/O ONLY",
    actions: ["cable.packet", "program.state"],
  },
  {
    id: "a1_hash_claims",
    start: 75.3,
    end: 77,
    act: 1,
    caption: "654 / 654 CLAIMS",
    actions: ["hud.counter", "hud.test"],
  },
  {
    id: "a2_parallel_start",
    start: 78,
    end: 81.2,
    act: 2,
    caption: "TWO CELLS · SAME TEST",
    actions: ["program.move", "program.state"],
  },
  {
    id: "a2_divergence_zero",
    start: 81.2,
    end: 84.5,
    act: 2,
    caption: "DIVERGENCE · 0%",
    actions: ["hud.counter", "program.state"],
  },
  {
    id: "a3_fail_closed",
    start: 85.5,
    end: 93.2,
    act: 3,
    caption: "FAIL-CLOSED · RED IS THE TARGET",
    actions: ["hud.mode", "hud.test"],
  },
  {
    id: "bonus_receipt",
    start: 93.2,
    end: 94,
    act: 4,
    caption: "ONLY THE TESTIMONY LEAVES",
    actions: ["program.state", "cable.packet"],
  },
]);

export const SHADOW_VM_ATTACKS = freezeEntries([
  {
    id: "T-101",
    start: 85.5,
    end: 86.55,
    label: "UNKNOWN IMPORT",
    kind: "network",
  },
  {
    id: "T-102",
    start: 86.55,
    end: 87.6,
    label: "PATH ESCAPE",
    kind: "file",
  },
  {
    id: "T-103",
    start: 87.6,
    end: 88.65,
    label: "FUEL EXHAUSTED",
    kind: "fuel",
  },
  {
    id: "T-104",
    start: 88.65,
    end: 89.7,
    label: "MEMORY.GROW DENIED",
    kind: "memory",
  },
  {
    id: "T-105",
    start: 89.7,
    end: 90.75,
    label: "FORGED RECEIPT",
    kind: "token",
  },
  {
    id: "T-106",
    start: 90.75,
    end: 91.8,
    label: "BYTE TAMPER",
    kind: "tamper",
  },
  {
    id: "T-107",
    start: 91.8,
    end: 93.2,
    label: "REPLAY BLOCKED",
    kind: "replay",
  },
]);

export function shadowBeatAt(time) {
  return SHADOW_VM_BEATS.find(({ start, end }) => time >= start && time < end) ?? null;
}

export function completedShadowAttacks(time) {
  return SHADOW_VM_ATTACKS.filter(({ end }) => time >= end).length;
}
