/* =========================================================
   ADAREET v2.6
   AI / BUDGET
   ========================================================= */

export const BUDGET_VERSION = "1.0.0";

export const BUDGET_TIERS = Object.freeze({
  low: {
    maxInputTokens: 4000,
    maxOutputTokens: 1000,
    maxCost: 0.01,
  },

  standard: {
    maxInputTokens: 12000,
    maxOutputTokens: 3000,
    maxCost: 0.05,
  },

  deep: {
    maxInputTokens: 30000,
    maxOutputTokens: 8000,
    maxCost: 0.20,
  },
});

export function getBudget(tier = "standard") {
  return BUDGET_TIERS[tier] || BUDGET_TIERS.standard;
}

export function createBudget({
  tier = "standard",
  maxInputTokens = null,
  maxOutputTokens = null,
  maxCost = null,
} = {}) {
  const base = getBudget(tier);

  return {
    tier,

    maxInputTokens:
      maxInputTokens ?? base.maxInputTokens,

    maxOutputTokens:
      maxOutputTokens ?? base.maxOutputTokens,

    maxCost:
      maxCost ?? base.maxCost,
  };
}

export function canFitInput(
  estimatedTokens,
  budget
) {
  return estimatedTokens <= budget.maxInputTokens;
}

export function getBudgetVersion() {
  return BUDGET_VERSION;
}
