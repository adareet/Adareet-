/*
==================================================
ADAREET v2.6
AI / ENTRY POINT
==================================================
*/

import {
  createAIGateway,
} from "./gateway.js";

import {
  createRouter,
} from "./router.js";

import * as budget from "./budget.js";
import * as context from "./context.js";
import * as prompt from "./prompt.js";
import * as config from "./config.js";

import {
  PROVIDERS,
} from "./providers/index.js";

export function createAI(options = {}) {
  const router =
    createRouter({
      providers: PROVIDERS,
      config: {
        ...config.AI_CONFIG,
        ...options.config,
      },
    });

  const gateway =
    createAIGateway({
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

export {
  config,
  PROVIDERS,
};
