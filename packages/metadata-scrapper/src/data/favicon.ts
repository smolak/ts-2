import type { MetadataGetter, ToMaybeValue } from "../types";
import { querySelector } from "../utils/selectors";
import { toFullUrl } from "../utils/url";

const selectors: Array<ToMaybeValue> = [
  querySelector('link[rel*="icon"]', "href"),
  querySelector('link[rel*="apple-touch-icon"]', "href"),
  querySelector('link[rel*="fluid-icon"]', "href"),
  querySelector('link[rel*="shortcut icon"]', "href"),
  querySelector('link[rel*="mask-icon"]', "href"),
];

export const getFavicon: MetadataGetter = (document, url) => {
  for (const selector of selectors) {
    const maybeFaviconUrl = selector(document);

    if (maybeFaviconUrl) {
      try {
        return toFullUrl(maybeFaviconUrl, url);
      } catch (_) {
        return undefined;
      }
    }
  }
};
