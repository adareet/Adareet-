/*
============================================================
ADAREET v2.6
AI / ROUTER
============================================================
*/

export function createRouter({
  providers = {},
  config = {},
} = {}) {
  const registry = new Map(
    Object.entries(providers)
  );

  function registerProvider(name, provider) {
    if (!name || !provider) {
      throw new Error(
        "Provider name and provider are required."
      );
    }

    registry.set(name, provider);
  }

  function unregisterProvider(name) {
    registry.delete(name);
  }

  function getProvider(name) {
    return registry.get(name) || null;
  }

  function getProviders() {
    return [...registry.keys()];
  }

  async function route(request = {}) {
    const {
      provider: requestedProvider = null,
      model = null,
      messages = [],
      options = {},
    } = request;

    const providerName =
      requestedProvider ||
      config.defaultProvider ||
      null;

    if (!providerName) {
      throw new Error(
        "No AI provider selected."
      );
    }

    const provider =
      getProvider(providerName);

    if (!provider) {
      throw new Error(
        `AI provider "${providerName}" is not registered.`
      );
    }

    if (
      typeof provider.generate !==
      "function"
    ) {
      throw new Error(
        `AI provider "${providerName}" does not implement generate().`
      );
    }

    return provider.generate({
      model,
      messages,
      options,
    });
  }

  return {
    registerProvider,
    unregisterProvider,
    getProvider,
    getProviders,
    route,
  };
}
