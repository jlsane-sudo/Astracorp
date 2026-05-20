const scriptRegistry = new Map();

function resolveEnvToken(value) {
  if (typeof value !== "string") return value;

  return value.replace(/VITE_[A-Z0-9_]+/g, (token) => {
    const envValue = import.meta.env[token];
    return typeof envValue === "string" ? envValue : "";
  });
}

export function getEnvValue(key) {
  return key ? import.meta.env[key] || "" : "";
}

export async function ensureExternalScript(src) {
  const resolvedSrc = resolveEnvToken(src);
  if (!resolvedSrc) return false;

  if (scriptRegistry.has(resolvedSrc)) {
    return scriptRegistry.get(resolvedSrc);
  }

  const existing = document.querySelector(`script[src="${resolvedSrc}"]`);
  if (existing) {
    const loaded = Promise.resolve(true);
    scriptRegistry.set(resolvedSrc, loaded);
    return loaded;
  }

  const promise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = resolvedSrc;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  scriptRegistry.set(resolvedSrc, promise);
  return promise;
}

export function buildMediaNetMarkup(slotConfig) {
  const siteId = getEnvValue(slotConfig.siteIdEnv);
  const slotId = getEnvValue(slotConfig.slotIdEnv);

  if (!siteId || !slotId) return null;

  return {
    siteId,
    slotId,
    containerId: slotConfig.containerId,
  };
}

export function buildIframeSrc(slotConfig) {
  return resolveEnvToken(getEnvValue(slotConfig.srcEnv));
}
