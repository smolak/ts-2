import type { MetadataGetter, ToMaybeValue } from "../types";
import { condenseWhitespace } from "../utils/condense-whitespace";
import { filter, findFirstUsing, firstNonEmpty } from "../utils/filters";
import { jsonld, querySelector, querySelectorAll } from "../utils/selectors";

const REGEX_TITLE: RegExp = /^.*?[-|]\s+(.*)$/;

const getFromTitle = (text: string, regex: RegExp = REGEX_TITLE): string | undefined => {
  const matches = regex.exec(text);

  if (!matches) {
    return undefined;
  }

  let result: string | undefined = matches[1];

  if (!result) {
    return undefined;
  }

  let newMatches = regex.exec(result);
  while (newMatches) {
    const newResult = newMatches[1];

    if (!newResult) {
      return result;
    }

    result = newResult;
    newMatches = regex.exec(result);
  }

  return result;
};

const selectors: Array<ToMaybeValue> = [
  jsonld("publisher.name"),
  querySelector('meta[property="og:site_name"]', "content"),
  querySelector('meta[name*="application-name" i]', "content"),
  querySelector('meta[name*="app-title" i]', "content"),
  querySelector('meta[property*="app_name" i]', "content"),
  querySelector('meta[name="publisher" i]', "content"),
  querySelector('meta[name="twitter:app:name:iphone"]', "content"),
  querySelector('meta[property="twitter:app:name:iphone"]', "content"),
  querySelector('meta[name="twitter:app:name:ipad"]', "content"),
  querySelector('meta[property="twitter:app:name:ipad"]', "content"),
  querySelector('meta[name="twitter:app:name:googleplay"]', "content"),
  querySelector('meta[property="twitter:app:name:googleplay"]', "content"),
  filter(firstNonEmpty, querySelectorAll("#logo")),
  filter(firstNonEmpty, querySelectorAll(".logo")),
  filter(firstNonEmpty, querySelectorAll('a[class*="brand" i]')),
  querySelector('[class*="logo" i] a img[alt]', "alt"),
  querySelector('[class*="logo" i] img[alt]', "alt"),
  filter(findFirstUsing(getFromTitle), querySelectorAll(".title")),
];

export const getPublisher: MetadataGetter = (document) => {
  for (const selector of selectors) {
    const maybePublisher = selector(document);

    if (maybePublisher) {
      const publisher = toPublisher(maybePublisher);

      if (publisher) {
        return publisher;
      }
    }
  }
};

const toPublisher = (maybePublisher: unknown): string => condenseWhitespace(String(maybePublisher));
