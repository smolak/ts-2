const buildHtml = ({ head = "", body = "" }: { head?: string; body?: string }): string =>
  `<html lang="en"><head><title>Whatever</title>${head}</head><body>${body}</body></html>`;

const buildJsonld = (jsonld: string): string => `<script type="application/ld+json">${jsonld}</script>`;

export const buildJsonldAuthorNameHtml = (name: string): string => {
  return buildHtml({
    body: buildJsonld(`{
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "Title of a News Article",
      "author": {
        "@type": "Person",
        "name": "${name}",
        "url": "https://example.com/profile/janedoe123"
      }
    }`),
  });
};

export const buildJsonldMultiAuthorNameHtml = (names: string[]): string => {
  return buildHtml({
    body: buildJsonld(`{
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "Title of a News Article",
      "author": [${names
        .map((name) => {
          return `{
          "@type": "Person",
          "name": "${name}",
          "url": "https://example.com/profile/janedoe123"
        }`;
        })
        .join(",")}]
    }`),
  });
};
