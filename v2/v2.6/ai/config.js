/* =========================================================
   ADAREET v2.6
   AI / CONFIG
   ========================================================= */

export const AI_CONFIG = {
  defaultProvider: null,

  providers: {},

  routing: {
    strategy: "manual",
    fallbackEnabled: false,
  },

  limits: {
    maxInputTokens: null,
    maxOutputTokens: null,
  },

  features: {
    streaming: false,
    tools: false,
    memory: false,
  },
};
