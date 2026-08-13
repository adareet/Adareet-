/* =========================================================
   ADAREET v2.6
   CORE / CONFIG
   ========================================================= */

export const APP_CONFIG = Object.freeze({
  name: "Adareet",
  version: "2.6",

  storage: {
    namespace: "adareet",
    schemaVersion: 1,
  },

  ui: {
    defaultTheme: "dark",
    defaultFont: "system",
  },

  ai: {
    defaultProvider: null,
    defaultModel: null,
    maxContextTokens: 0,
    maxOutputTokens: 0,
  },
});
