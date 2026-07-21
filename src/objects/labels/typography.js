const MONOSPACE_STACK = "ui-monospace, SFMono-Regular, Consolas, monospace";

export function monospaceFont(weight, size) {
  return `${weight} ${size}px ${MONOSPACE_STACK}`;
}
