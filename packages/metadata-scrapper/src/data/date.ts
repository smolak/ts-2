import type { MetadataGetter, ToMaybeValue } from "../types";
import { filter, firstNonEmpty } from "../utils/filters";
import { jsonld, querySelector, querySelectorAll } from "../utils/selectors";

const selectors: Array<ToMaybeValue> = [
  jsonld("dateModified"),
  querySelector('meta[property*="modified_time" i]', "content"),
  querySelector('[itemprop*="datemodified" i]', "content"),
  jsonld("datePublished"),
  jsonld("dateCreated"),
  querySelector('meta[property*="published_time" i]', "content"),
  querySelector('[itemprop="datepublished" i]', "content"),
  querySelector('[itemprop="datepublished" i]', "title"),
  filter(firstNonEmpty, querySelectorAll('[class*="publish" i]')),
  querySelector('meta[name="date" i]', "content"),
  querySelector('[itemprop*="date" i]', "content"),
  querySelector('[itemprop*="date" i]', "title"),
  querySelector('time[itemprop*="date" i]', "datetime"),
  querySelector("time[datetime]", "datetime"),
  filter(firstNonEmpty, querySelectorAll('[class*="byline" i]')),
  filter(firstNonEmpty, querySelectorAll('[id*="date" i]')),
  filter(firstNonEmpty, querySelectorAll('[class*="date" i]')),
  filter(firstNonEmpty, querySelectorAll('[class*="time" i]')),
];

export const getDate: MetadataGetter = (document) => {
  for (const selector of selectors) {
    const date = selector(document);

    if (date) {
      return toDate(date);
    }
  }
};

const toDate = (value: string): string | undefined => {
  try {
    return new Date(value).toISOString();
  } catch (_) {
    const extractedDateTime = extractDateTime(value);

    if (extractedDateTime) {
      const { date, time } = extractedDateTime;

      if (time) {
        const datetime = `${date}T${time}`;

        try {
          return new Date(datetime).toISOString();
        } catch (_) {
          return undefined;
        }
      }

      try {
        return new Date(date).toISOString();
      } catch (_) {
        return undefined;
      }
    }
  }
};

const extractDateTime = (maybeDateTimeString: string): { date: string; time?: string } | undefined => {
  const regex = /(\d{4}-\d{2}-\d{2})(?:\D*?(\d{2}:\d{2}:\d{2}))?/;
  const match = maybeDateTimeString.match(regex);

  if (match) {
    const date = match[1];
    const time = match[2];

    if (date) {
      return { date, time };
    }
  }
};
