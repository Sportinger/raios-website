import { normalizeKeyframe, sortKeyframes } from "./camera-track.js";

const STORAGE_KEY = "raios.camera-director.v1";
const HISTORY_LIMIT = 100;

const cloneState = (state) => JSON.parse(JSON.stringify(state));

const readStoredState = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return {
      keyframes: sortKeyframes(Array.isArray(parsed?.keyframes) ? parsed.keyframes : []),
      version: 1,
    };
  } catch {
    return { keyframes: [], version: 1 };
  }
};

export function createCameraDirectorStore() {
  let state = readStoredState();
  let selectedId = state.keyframes[0]?.id ?? null;
  const past = [];
  const future = [];
  const listeners = new Set();

  const emit = () => listeners.forEach((listener) => listener(getSnapshot()));
  const persist = () => window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const getSnapshot = () => ({
    canRedo: future.length > 0,
    canUndo: past.length > 0,
    selectedId,
    state: cloneState(state),
  });
  const restore = (nextState) => {
    state = {
      keyframes: sortKeyframes(nextState.keyframes ?? []),
      version: 1,
    };
    if (!state.keyframes.some(({ id }) => id === selectedId)) {
      selectedId = state.keyframes[0]?.id ?? null;
    }
    persist();
    emit();
  };
  const commit = (mutator) => {
    past.push(cloneState(state));
    if (past.length > HISTORY_LIMIT) past.shift();
    future.length = 0;
    const draft = cloneState(state);
    mutator(draft);
    restore(draft);
  };

  return {
    addKeyframe(keyframe) {
      const next = normalizeKeyframe(keyframe);
      commit((draft) => draft.keyframes.push(next));
      selectedId = next.id;
      emit();
      return next.id;
    },

    deleteSelected() {
      if (!selectedId) return;
      const deletedId = selectedId;
      commit((draft) => {
        draft.keyframes = draft.keyframes.filter(({ id }) => id !== deletedId);
      });
    },

    exportState() {
      return cloneState(state);
    },

    getSnapshot,

    importState(nextState) {
      if (!nextState || !Array.isArray(nextState.keyframes)) {
        throw new Error("Die Datei enthält keine gültige Keyframe-Liste.");
      }
      commit((draft) => {
        draft.keyframes = nextState.keyframes.map(normalizeKeyframe);
        draft.version = 1;
      });
    },

    redo() {
      if (!future.length) return;
      past.push(cloneState(state));
      restore(future.pop());
    },

    select(id) {
      selectedId = state.keyframes.some((keyframe) => keyframe.id === id) ? id : null;
      emit();
    },

    subscribe(listener) {
      listeners.add(listener);
      listener(getSnapshot());
      return () => listeners.delete(listener);
    },

    undo() {
      if (!past.length) return;
      future.push(cloneState(state));
      restore(past.pop());
    },

    updateSelected(patch) {
      if (!selectedId) return;
      commit((draft) => {
        const index = draft.keyframes.findIndex(({ id }) => id === selectedId);
        if (index >= 0) {
          draft.keyframes[index] = normalizeKeyframe({
            ...draft.keyframes[index],
            ...patch,
            id: selectedId,
          });
        }
      });
    },
  };
}
