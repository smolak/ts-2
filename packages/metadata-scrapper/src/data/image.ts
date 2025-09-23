import type { MetadataGetter, ToMaybeValue } from "../types";
import { filter, firstNonEmpty } from "../utils/filters";
import { jsonld, querySelector, querySelectorAll } from "../utils/selectors";
import { toFullUrl } from "../utils/url";

const selectors: Array<ToMaybeValue> = [
  querySelector('meta[property="og:image:secure_url"]', "content"),
  querySelector('meta[property="og:image:url"]', "content"),
  querySelector('meta[property="og:image"]', "content"),
  querySelector('meta[name="twitter:image:src"]', "content"),
  querySelector('meta[property="twitter:image:src"]', "content"),
  querySelector('meta[name="twitter:image"]', "content"),
  querySelector('meta[property="twitter:image"]', "content"),
  querySelector('meta[itemprop="image"]', "content"),
  jsonld("image.0.url"),
  jsonld("image.url"),
  jsonld("image"),
  filter(firstNonEmpty, querySelectorAll("article img[src]", "src")),
  filter(firstNonEmpty, querySelectorAll("#content img[src]", "src")),
  querySelector('img[alt*="author" i]', "src"),
  querySelector('img[src]:not([aria-hidden="true"])', "src"),
];

export const getImage: MetadataGetter = (document, url) => {
  for (const selector of selectors) {
    const maybeImageUrl = selector(document);

    if (maybeImageUrl) {
      try {
        return toFullUrl(maybeImageUrl, url);
      } catch (_) {
        return undefined;
      }
    }
  }
};
