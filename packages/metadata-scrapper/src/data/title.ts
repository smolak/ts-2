import type { MetadataGetter, ToMaybeValue } from "../types";
import { condenseWhitespace } from "../utils/condense-whitespace";
import { filter, firstNonEmpty } from "../utils/filters";
import { jsonld, querySelector, querySelectorAll } from "../utils/selectors";

const selectors: Array<ToMaybeValue> = [
  querySelector('meta[property="og:title"]', "content"),
  querySelector('meta[name="twitter:title"]', "content"),
  querySelector('meta[property="twitter:title"]', "content"),
  filter(firstNonEmpty, querySelectorAll("title")),
  jsonld("headline"),
  filter(firstNonEmpty, querySelectorAll(".post-title")),
  filter(firstNonEmpty, querySelectorAll(".entry-title")),
  filter(firstNonEmpty, querySelectorAll('h1[class*="title" i] a')),
  filter(firstNonEmpty, querySelectorAll('h1[class*="title" i]')),
];

export const getTitle: MetadataGetter = (document) => {
  for (const selector of selectors) {
    const maybeTitle = selector(document);

    if (maybeTitle) {
      const title = toTitle(maybeTitle);

      if (title) {
        return title;
      }
    }
  }
};

const toTitle = (maybeTitle: unknown): string => condenseWhitespace(String(maybeTitle));
