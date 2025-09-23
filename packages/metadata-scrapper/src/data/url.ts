import type { MetadataGetter, ToMaybeValue } from "../types";
import { querySelector } from "../utils/selectors";
import { toFullUrl } from "../utils/url";

const selectors: Array<ToMaybeValue> = [
  querySelector('meta[property="og:url"]', "content"),
  querySelector('meta[name="twitter:url"]', "content"),
  querySelector('meta[property="twitter:url"]', "content"),
  querySelector('link[rel="canonical"]', "href"),
  querySelector('link[rel="alternate"][hreflang="x-default"]', "href"),
];

export const getUrl: MetadataGetter = (document, url) => {
  for (const selector of selectors) {
    const maybeUrl = selector(document);

    if (maybeUrl) {
      try {
        return toFullUrl(maybeUrl, url);
      } catch (_) {
        return undefined;
      }
    }
  }
};
