import { get } from "lodash";

export const jsonld =
  (path: string) =>
  (document: Document): string | undefined => {
    const elements = document.querySelectorAll('script[type="application/ld+json"]');
    if (elements.length === 0) {
      return undefined;
    }

    try {
      for (const element of elements) {
        const object = JSON.parse(element.textContent || "");
        const result = get(object, path);

        if (result) {
          return String(result);
        }
      }
    } catch (_) {
      return undefined;
    }
  };

export const querySelector =
  (selector: string, attribute?: string) =>
  (document: Document): string | undefined => {
    const element = document.querySelector(selector);

    if (element) {
      if (attribute) {
        return element.getAttribute(attribute) ?? undefined;
      }

      return element.textContent ?? undefined;
    }
  };

export const querySelectorAll =
  (selector: string, attribute?: string) =>
  (document: Document): string[] => {
    const elements = document.querySelectorAll(selector);
    const result: string[] = [];

    for (const element of elements) {
      if (attribute) {
        const value = element.getAttribute(attribute);

        if (value) {
          result.push(value);
        }
      } else {
        if (element.textContent) {
          result.push(element.textContent);
        }
      }
    }

    return result;
  };
