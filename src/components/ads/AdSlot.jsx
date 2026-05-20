import { useEffect, useMemo, useState } from "react";
import {
  AD_PROVIDERS,
  DEFAULT_AD_PROVIDER,
  getSlotConfig,
} from "../../config/adProviders";
import {
  buildIframeSrc,
  buildMediaNetMarkup,
  ensureExternalScript,
} from "../../services/adProviderRuntime";

const CARD_STYLE = {
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.025)",
  overflow: "hidden",
};

export default function AdSlot({
  slotKey,
  provider = DEFAULT_AD_PROVIDER,
  fallbackProvider = AD_PROVIDERS.HOUSE,
  minHeight = 140,
}) {
  const slot = getSlotConfig(slotKey);
  const [activeProvider, setActiveProvider] = useState(provider);
  const [mediaNetReady, setMediaNetReady] = useState(false);

  const providerConfig = slot?.providers?.[activeProvider] || null;

  useEffect(() => {
    let cancelled = false;

    async function initMediaNet() {
      if (!providerConfig || activeProvider !== AD_PROVIDERS.MEDIA_NET) return;

      const markup = buildMediaNetMarkup(providerConfig);
      if (!markup) {
        if (!cancelled) setActiveProvider(fallbackProvider);
        return;
      }

      const loaded = await ensureExternalScript(providerConfig.scriptSrc);
      if (cancelled) return;

      if (loaded) {
        setMediaNetReady(true);
      } else {
        setActiveProvider(fallbackProvider);
      }
    }

    initMediaNet();

    return () => {
      cancelled = true;
    };
  }, [activeProvider, fallbackProvider, providerConfig]);

  const content = useMemo(() => {
    if (!slot || !providerConfig) {
      return <HouseAdFallback minHeight={minHeight} />;
    }

    if (activeProvider === AD_PROVIDERS.MEDIA_NET) {
      const markup = buildMediaNetMarkup(providerConfig);
      if (!markup || !mediaNetReady) {
        return <AdLoadingCard label="Cargando Media.net..." minHeight={minHeight} />;
      }

      return (
        <div style={{ ...CARD_STYLE, minHeight, padding: 12 }}>
          <div style={styles.labelRow}>
            <span style={styles.providerTag}>Media.net</span>
            <span style={styles.smallText}>Slot contextual</span>
          </div>
          <div id={markup.containerId} style={{ minHeight: minHeight - 40 }} />
          <div style={styles.helperText}>
            Inventario display activo. La medicion real se confirma en el panel del proveedor.
          </div>
        </div>
      );
    }

    if (activeProvider === AD_PROVIDERS.ADSTERRA) {
      const src = buildIframeSrc(providerConfig);
      if (!src) {
        return <HouseAdFallback minHeight={minHeight} />;
      }

      return (
        <div style={{ ...CARD_STYLE, minHeight }}>
          <div style={styles.adHeader}>
            <span style={styles.providerTag}>Adsterra fallback</span>
            <span style={styles.smallText}>Respaldo</span>
          </div>
          <iframe
            title={slot.label}
            src={src}
            loading="lazy"
            style={styles.iframe}
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }

    return <HouseAdFallback minHeight={minHeight} />;
  }, [activeProvider, mediaNetReady, minHeight, providerConfig, slot]);

  return content;
}

function AdLoadingCard({ label, minHeight }) {
  return (
    <div
      style={{
        ...CARD_STYLE,
        minHeight,
        display: "grid",
        placeItems: "center",
        color: "#94a3b8",
        fontSize: 12,
      }}
    >
      {label}
    </div>
  );
}

function HouseAdFallback({ minHeight }) {
  return (
    <div
      style={{
        ...CARD_STYLE,
        minHeight,
        padding: 14,
        display: "grid",
        gap: 8,
        alignContent: "center",
      }}
    >
      <div style={styles.providerTag}>House slot</div>
      <div style={styles.fallbackTitle}>Inventario patrocinado preparado</div>
      <div style={styles.helperText}>
        El juego mantiene acciones patrocinadas estimadas aunque el proveedor externo no sirva display en este momento.
      </div>
    </div>
  );
}

const styles = {
  adHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
    padding: "10px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  providerTag: {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    color: "#67e8f9",
    background: "rgba(34,211,238,0.08)",
    border: "1px solid rgba(34,211,238,0.18)",
  },
  smallText: {
    fontSize: 11,
    color: "#94a3b8",
  },
  helperText: {
    fontSize: 12,
    lineHeight: 1.55,
    color: "#94a3b8",
  },
  fallbackTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#e2e8f0",
  },
  iframe: {
    width: "100%",
    minHeight: 160,
    height: 160,
    border: "none",
    display: "block",
    background: "transparent",
  },
};
