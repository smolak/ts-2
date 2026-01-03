import { get } from "lodash";

import { toFullUrl } from "../utils/url";

export type ImageData = {
  url?: string;
  alt?: string;
};

type ImageDataSelector = (document: Document) => ImageData | undefined;

const getMetaContent = (document: Document, selector: string): string | undefined => {
  const element = document.querySelector(selector);
  return element?.getAttribute("content") ?? undefined;
};

const findAltByImageUrl = (document: Document, imageUrl: string): string | undefined => {
  // Find an <img> element with matching src and get its alt
  const imgs = document.querySelectorAll("img[src]");

  for (const img of imgs) {
    const src = img.getAttribute("src");
    if (src === imageUrl) {
      return img.getAttribute("alt") ?? undefined;
    }
  }

  return undefined;
};

const getJsonLdImage = (document: Document): ImageData | undefined => {
  const elements = document.querySelectorAll('script[type="application/ld+json"]');
  if (elements.length === 0) {
    return undefined;
  }

  try {
    for (const element of elements) {
      const object = JSON.parse(element.textContent || "");

      // Try image.0.url (array format)
      const imageArrayUrl = get(object, "image.0.url");
      if (imageArrayUrl) {
        return {
          url: String(imageArrayUrl),
          alt: get(object, "image.0.caption") ? String(get(object, "image.0.caption")) : undefined,
        };
      }

      // Try image.url (object format)
      const imageObjUrl = get(object, "image.url");
      if (imageObjUrl) {
        return {
          url: String(imageObjUrl),
          alt: get(object, "image.caption") ? String(get(object, "image.caption")) : undefined,
        };
      }

      // Try image (string format)
      const imageString = get(object, "image");
      if (imageString && typeof imageString === "string") {
        return { url: imageString, alt: undefined };
      }
    }
  } catch (_) {
    return undefined;
  }
};

const getFirstImgFromSelector = (document: Document, containerSelector: string): ImageData | undefined => {
  const container = document.querySelector(containerSelector);
  if (!container) {
    return undefined;
  }

  const img = container.querySelector("img[src]");
  if (!img) {
    return undefined;
  }

  const src = img.getAttribute("src");
  if (!src) {
    return undefined;
  }

  return {
    url: src,
    alt: img.getAttribute("alt") ?? undefined,
  };
};

const getImgWithAuthorAlt = (document: Document): ImageData | undefined => {
  const img = document.querySelector('img[alt*="author" i]');
  if (!img) {
    return undefined;
  }

  const src = img.getAttribute("src");
  if (!src) {
    return undefined;
  }

  return {
    url: src,
    alt: img.getAttribute("alt") ?? undefined,
  };
};

const getFirstVisibleImg = (document: Document): ImageData | undefined => {
  const img = document.querySelector('img[src]:not([aria-hidden="true"])');
  if (!img) {
    return undefined;
  }

  const src = img.getAttribute("src");
  if (!src) {
    return undefined;
  }

  return {
    url: src,
    alt: img.getAttribute("alt") ?? undefined,
  };
};

// Selectors in priority order - each returns both URL and alt from the same source
const selectors: Array<ImageDataSelector> = [
  // OpenGraph image sources
  (document) => {
    const url =
      getMetaContent(document, 'meta[property="og:image:secure_url"]') ||
      getMetaContent(document, 'meta[property="og:image:url"]') ||
      getMetaContent(document, 'meta[property="og:image"]');

    if (url) {
      // Try og:image:alt first, then fall back to finding matching <img> element
      const alt = getMetaContent(document, 'meta[property="og:image:alt"]') || findAltByImageUrl(document, url);
      return { url, alt };
    }
  },

  // Twitter image sources
  (document) => {
    const url =
      getMetaContent(document, 'meta[name="twitter:image:src"]') ||
      getMetaContent(document, 'meta[property="twitter:image:src"]') ||
      getMetaContent(document, 'meta[name="twitter:image"]') ||
      getMetaContent(document, 'meta[property="twitter:image"]');

    if (url) {
      // Try twitter:image:alt first, then fall back to finding matching <img> element
      const alt =
        getMetaContent(document, 'meta[name="twitter:image:alt"]') ||
        getMetaContent(document, 'meta[property="twitter:image:alt"]') ||
        findAltByImageUrl(document, url);
      return { url, alt };
    }
  },

  // Schema.org itemprop image
  (document) => {
    const url = getMetaContent(document, 'meta[itemprop="image"]');
    if (url) {
      return { url, alt: undefined };
    }
  },

  // JSON-LD structured data
  getJsonLdImage,

  // Article container images
  (document) => getFirstImgFromSelector(document, "article"),

  // Content container images
  (document) => getFirstImgFromSelector(document, "#content"),

  // Images with author in alt text
  getImgWithAuthorAlt,

  // First visible image as fallback
  getFirstVisibleImg,
];

export const getImageData = (document: Document, url: string): ImageData => {
  for (const selector of selectors) {
    const result = selector(document);

    if (result?.url) {
      try {
        return {
          url: toFullUrl(result.url, url),
          alt: result.alt,
        };
      } catch (_) {
        // If URL conversion fails, continue to next selector
      }
    }
  }

  return {};
};
