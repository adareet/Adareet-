/* =========================================================
   ADAREET v2.6
   CORE / EVENTS
   ========================================================= */

const listeners = new Map();

export function on(eventName, listener) {
  if (!listeners.has(eventName)) {
    listeners.set(eventName, new Set());
  }

  listeners.get(eventName).add(listener);

  return () => off(eventName, listener);
}

export function off(eventName, listener) {
  listeners.get(eventName)?.delete(listener);
}

export function emit(eventName, payload) {
  const eventListeners = listeners.get(eventName);

  if (!eventListeners) {
    return;
  }

  for (const listener of eventListeners) {
    listener(payload);
  }
}

export function clearEvents() {
  listeners.clear();
}
