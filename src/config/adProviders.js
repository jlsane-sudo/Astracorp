export const AD_PROVIDERS = {
  MEDIA_NET: "media-net",
  ADSTERRA: "adsterra",
  HOUSE: "house",
};

export const DEFAULT_AD_PROVIDER =
  import.meta.env.VITE_DEFAULT_AD_PROVIDER || AD_PROVIDERS.HOUSE;

export const AD_SLOTS = {
  adsViewPrimary: {
    id: "ads-view-primary",
    label: "Panel publicitario principal",
    providers: {
      [AD_PROVIDERS.MEDIA_NET]: {
        type: "script",
        scriptSrc: "https://contextual.media.net/dmedianet.js?cid=VITE_MEDIA_NET_CID",
        containerId: "media-net-ads-view-primary",
        siteIdEnv: "VITE_MEDIA_NET_CID",
        slotIdEnv: "VITE_MEDIA_NET_ADS_VIEW_SLOT",
      },
      [AD_PROVIDERS.ADSTERRA]: {
        type: "iframe",
        srcEnv: "VITE_ADSTERRA_ADS_VIEW_SRC",
      },
      [AD_PROVIDERS.HOUSE]: {
        type: "house",
      },
    },
  },
};

export function getSlotConfig(slotKey) {
  return AD_SLOTS[slotKey] || null;
}
