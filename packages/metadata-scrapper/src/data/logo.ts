import type { MetadataGetter, ToMaybeValue } from "../types";
import { jsonld, querySelector } from "../utils/selectors";
import { toFullUrl } from "../utils/url";

const selectors: Array<ToMaybeValue> = [
  querySelector('meta[property="og:logo"]', "content"),
  querySelector('meta[itemprop="logo"]', "content"),
  querySelector('img[itemprop="logo"]', "src"),
  jsonld("brand.logo"),
  jsonld("organization.logo"),
  jsonld("place.logo"),
  jsonld("product.logo"),
  jsonld("service.logo"),
  jsonld("publisher.logo.url"),
  jsonld("publisher.logo"),
  jsonld("logo.url"),
  jsonld("logo"),
];

export const getLogo: MetadataGetter = (document, url) => {
  for (const selector of selectors) {
    const maybeLogoUrl = selector(document);

    if (maybeLogoUrl) {
      try {
        return toFullUrl(maybeLogoUrl, url);
      } catch (_) {
        return undefined;
      }
    }
  }
};
