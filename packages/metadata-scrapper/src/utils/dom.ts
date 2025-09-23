const dom = new DOMParser();

export const parseHtml = (html: string): Document => {
  return dom.parseFromString(html, "text/html");
};
