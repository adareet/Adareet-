/* =========================================================
   ADAREET v2.6
   CORE / STATE
   ========================================================= */

const initialState = {
  app: {
    ready: false,
  },

  ui: {
    theme: "dark",
    font: "system",
    activeView: "home",
  },

  project: {
    activeProjectId: null,
  },

  chat: {
    activeChatId: null,
  },

  ai: {
    status: "idle",
    provider: null,
    model: null,
  },
};

let state = structuredClone(initialState);

export function getState() {
  return state;
}

export function setState(updater) {
  const nextState =
    typeof updater === "function"
      ? updater(state)
      : updater;

  state = {
    ...state,
    ...nextState,
  };

  return state;
}

export function resetState() {
  state = structuredClone(initialState);
  return state;
}
