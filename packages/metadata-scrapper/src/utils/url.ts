export const toFullUrl = (url: string, sourceUrl: string): string => {
  if (url.startsWith("//")) {
    const { protocol } = new URL(url);

    return new URL(`${protocol}${url}`).href;
  }

  if (url.startsWith("http")) {
    return new URL(url).href;
  }

  return new URL(url, sourceUrl).href;
};
