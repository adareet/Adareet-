/* =========================================================
   ADAREET v2.6
   AI / GATEWAY
   ========================================================= */

import { route } from "./router.js";
import { createBudget } from "./budget.js";

export const GATEWAY_VERSION = "1.0.0";

function createRequestId() {
  return `ai_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function createUsageRecord({
  requestId,
  provider,
  model,
  startedAt,
  completedAt,
  status,
  usage = null,
  error = null,
} = {}) {
  return {
    requestId,
    provider,
    model,

    startedAt,
    completedAt,

    latencyMs:
      startedAt && completedAt
        ? new Date(completedAt).getTime() -
          new Date(startedAt).getTime()
        : null,

    status,

    usage,

    error,
  };
}

export async function generate({
  provider = null,
  model = null,
  messages = [],
  projectId = null,
  chatId = null,
  budget = {},
  options = {},
} = {}) {
  const requestId = createRequestId();
  const startedAt = new Date().toISOString();

  const resolvedBudget = createBudget(budget);

  try {
    const result = await route({
      provider,
      model,
      messages,
      options: {
        ...options,
        budget: resolvedBudget,
      },
    });

    const completedAt = new Date().toISOString();

    const usage = createUsageRecord({
      requestId,
      provider,
      model,
      startedAt,
      completedAt,
      status: "success",
      usage: result?.usage || null,
    });

    return {
      requestId,
      projectId,
      chatId,

      output: result?.output ?? result,

      usage,
    };
  } catch (error) {
    const completedAt = new Date().toISOString();

    const usage = createUsageRecord({
      requestId,
      provider,
      model,
      startedAt,
      completedAt,
      status: "error",
      error: {
        name: error?.name || "Error",
        message:
          error?.message || "Unknown AI error.",
      },
    });

    throw Object.assign(
      new Error(
        error?.message || "AI request failed."
      ),
      {
        requestId,
        projectId,
        chatId,
        usage,
      }
    );
  }
}

export function getGatewayVersion() {
  return GATEWAY_VERSION;
}
