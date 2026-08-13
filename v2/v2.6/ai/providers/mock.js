/* =========================================================
   ADAREET v2.6
   AI / PROVIDERS / MOCK
   ========================================================= */

export const MOCK_PROVIDER_NAME = "mock";
export const MOCK_PROVIDER_VERSION = "1.0.0";

export async function generate({
  model = "mock-model",
  messages = [],
  options = {},
} = {}) {
  const lastMessage =
    [...messages]
      .reverse()
      .find(message => message?.role === "user")
      ?.content || "";

  return {
    output: `[Mock AI] Received: ${lastMessage}`,

    provider: MOCK_PROVIDER_NAME,
    model,

    usage: {
      inputTokens: estimateTokens(messages),
      outputTokens: 20,
      totalTokens:
        estimateTokens(messages) + 20,
    },

    metadata: {
      providerVersion: MOCK_PROVIDER_VERSION,
      budget: options.budget || null,
    },
  };
}

function estimateTokens(messages) {
  const text = messages
    .map(message => message?.content || "")
    .join("\n");

  return Math.ceil(text.length / 4);
}
