import type { MetadataGetter, ToMaybeValue } from "../types";
import { condenseWhitespace } from "../utils/condense-whitespace";
import { jsonld, querySelector } from "../utils/selectors";

const selectors: Array<ToMaybeValue> = [
  querySelector('meta[property="og:description"]', "content"),
  querySelector('meta[name="twitter:description"]', "content"),
  querySelector('meta[property="twitter:description"]', "content"),
  querySelector('meta[name="description"]', "content"),
  querySelector('meta[itemprop="description"]', "content"),
  jsonld("articleBody"),
  jsonld("description"),
];

export const getDescription: MetadataGetter = (document) => {
  for (const selector of selectors) {
    const maybeDescription = selector(document);

    if (maybeDescription) {
      const description = toDescription(maybeDescription);

      if (description) {
        return description;
      }
    }
  }
};

const toDescription = (maybeDescription: unknown): string => condenseWhitespace(String(maybeDescription));
