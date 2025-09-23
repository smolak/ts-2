import { z } from "zod";

import type { MetadataGetter, StrictToMaybeValue, ToMaybeValue } from "../types";
import { filter, firstNonEmpty } from "../utils/filters";
import { jsonld, querySelector, querySelectorAll } from "../utils/selectors";
import { isStrict, strict } from "../utils/strict";

const AUTHOR_MAX_LENGTH = 128;
const TWO_WORDS_SEPARATED_BY_WHITESPACE = /^\S+\s+\S+/;

const selectors: Array<ToMaybeValue | StrictToMaybeValue> = [
  jsonld("author.name"),
  jsonld("author[0].name"),
  jsonld("brand.name"),
  querySelector('meta[name="author"]', "content"),
  querySelector('meta[property="article:author"]', "content"),
  filter(firstNonEmpty, querySelectorAll('[itemprop*="author" i] [itemprop="name"]')),
  filter(firstNonEmpty, querySelectorAll('[itemprop*="author" i]')),
  filter(firstNonEmpty, querySelectorAll('[rel="author"]')),
  strict(filter(firstNonEmpty, querySelectorAll('a[class*="author" i]'))),
  strict(filter(firstNonEmpty, querySelectorAll('[class*="author" i] a'))),
  strict(filter(firstNonEmpty, querySelectorAll('a[href*="/author/" i]'))),
  filter(firstNonEmpty, querySelectorAll('a[class*="screenname" i]')),
  strict(filter(firstNonEmpty, querySelectorAll('[class*="author" i]'))),
];

export const getAuthor: MetadataGetter = (document) => {
  for (const selector of selectors) {
    if (isStrict(selector)) {
      const [fn] = selector;
      const author = fn(document);

      if (author && isAuthorStrict(author)) {
        return author;
      }
    } else {
      const author = selector(document);

      if (author && isAuthor(author)) {
        return author.trim();
      }
    }
  }
};

const authorSchema = z.string().trim().min(1).max(AUTHOR_MAX_LENGTH);
const urlSchema = z.string().url();

const isAuthor = (maybeAuthor: string) => {
  const result = authorSchema.safeParse(maybeAuthor);

  return result.success && !urlSchema.safeParse(maybeAuthor).success;
};

const isAuthorStrict = (maybeAuthor: string) => {
  const result = authorSchema.regex(TWO_WORDS_SEPARATED_BY_WHITESPACE).safeParse(maybeAuthor);

  return result.success && !urlSchema.safeParse(maybeAuthor).success;
};
