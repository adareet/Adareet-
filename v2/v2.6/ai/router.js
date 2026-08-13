/* =========================================================
   ADAREET v2.6
   AI / ROUTER
   ========================================================= */

const providers = new Map();

export function registerProvider(name, provider) {
  if (!name || !provider) {
    throw new Error("Provider name and provider are required.");
  }

  providers.set(name, provider);
}

export function unregisterProvider(name) {
  providers.delete(name);
}

export function getProvider(name) {
  return providers.get(name) || null;
}

export function getProviders() {
  return [...providers.keys()];
}

export function hasProvider(name) {
  return providers.has(name);
}

export async function route(request = {}) {
  const {
    provider: requestedProvider = null,
    model = null,
    messages = [],
    options = {},
  } = request;

  if (!requestedProvider) {
    throw new Error("No AI provider selected.");
  }

  const provider = getProvider(requestedProvider);

  if (!provider) {
    throw new Error(
      `AI provider "${requestedProvider}" is not registered.`
    );
  }

  if (typeof provider.generate !== "function") {
    throw new Error(
      `AI provider "${requestedProvider}" does not implement generate().`
    );
  }

  return provider.generate({
    model,
    messages,
    options,
  });
}
