/*
==================================================
ADAREET v2.6
AI / ENTRY POINT
==================================================
*/

import { createGateway } from "./gateway.js";
import { createRouter } from "./router.js";
import { createContextBuilder } from "./context.js";
import { createBudget } from "./budget.js";
import { createPromptBuilder } from "./prompt.js";
import { providers } from "./providers/index.js";

export function createAI(options = {}) {
  const budget = createBudget(options.budget);
  const context = createContextBuilder(options.context);
  const prompt = createPromptBuilder(options.prompt);

  const router = createRouter({
    providers,
    config: options.config,
  });

  const gateway = createGateway({
    router,
    budget,
    context,
    prompt,
  });

  return {
    gateway,
    router,
    context,
    prompt,
    budget,
  };
}
