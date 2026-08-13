/* =========================================================
   ADAREET v2.6
   DATA / STORAGE
   ========================================================= */

const STORAGE_PREFIX = "adareet";

function getKey(key) {
  return `${STORAGE_PREFIX}:${key}`;
}

export function save(key, value) {
  try {
    localStorage.setItem(
      getKey(key),
      JSON.stringify(value)
    );

    return true;
  } catch (error) {
    console.error("[Storage] Save failed:", error);
    return false;
  }
}

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(getKey(key));

    if (raw === null) {
      return fallback;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error("[Storage] Load failed:", error);
    return fallback;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(getKey(key));
    return true;
  } catch (error) {
    console.error("[Storage] Remove failed:", error);
    return false;
  }
}

export function clearAll() {
  try {
    const prefix = `${STORAGE_PREFIX}:`;

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);

      if (key?.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    }

    return true;
  } catch (error) {
    console.error("[Storage] Clear failed:", error);
    return false;
  }
}
