import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

import { getAuthor } from "./author";
import { buildJsonldAuthorNameHtml, buildJsonldMultiAuthorNameHtml } from "./author.fixtures";

const createDocument = (html: string): Document => new JSDOM(html).window.document;

describe("getAuthor", () => {
  it("should return author from jsonld", () => {
    const html = buildJsonldAuthorNameHtml("John Doe");
    const document = createDocument(html);

    expect(getAuthor(document, "https://example.com")).toBe("John Doe");
  });

  it("should return first author from jsonld, when more than one author is defined", () => {
    const html = buildJsonldMultiAuthorNameHtml(["John Doe", "John Smith"]);
    const document = createDocument(html);

    expect(getAuthor(document, "https://example.com")).toBe("John Doe");
  });

  it("should return author from meta[name='author']", () => {
    const html = `<meta name="author" content="Jane Doe ">`;
    const document = createDocument(html);

    expect(getAuthor(document, "https://example.com")).toBe("Jane Doe");
  });

  it("should return author from meta[property='article:author']", () => {
    const html = `<meta property="article:author" content="Jane Doe">`;
    const document = createDocument(html);

    expect(getAuthor(document, "https://example.com")).toBe("Jane Doe");
  });

  it("should return author from itemprop='author' [itemprop='name']", () => {
    const html = `<div itemprop="author"><span itemprop="name">Jane Doe</span></div>`;
    const document = createDocument(html);

    expect(getAuthor(document, "https://example.com")).toBe("Jane Doe");
  });

  it("should return author from itemprop='author'", () => {
    const html = `<div itemprop="author">Jane Doe</div>`;
    const document = createDocument(html);

    expect(getAuthor(document, "https://example.com")).toBe("Jane Doe");
  });

  it("should return author from rel='author'", () => {
    const html = `<a rel="author">Jane Doe</a>`;
    const document = createDocument(html);

    expect(getAuthor(document)).toBe("Jane Doe");
  });

  it("should return author from a[class*='author']", () => {
    const html = `<a class="author-link">Jane Doe</a>`;
    const document = createDocument(html);

    expect(getAuthor(document, "https://example.com")).toBe("Jane Doe");
  });

  it("should return author from [class*='author'] a", () => {
    const html = `<div class="author-container"><a>Jane Doe</a></div>`;
    const document = createDocument(html);

    expect(getAuthor(document, "https://example.com")).toBe("Jane Doe");
  });

  it("should return author from a[href*='/author/']", () => {
    const html = `<a href="/author/jane-doe">Jane Doe</a>`;
    const document = createDocument(html);

    expect(getAuthor(document, "https://example.com")).toBe("Jane Doe");
  });

  it("should return author from a[class*='screenname']", () => {
    const html = `<a class="screenname">Jane Doe</a>`;
    const document = createDocument(html);

    expect(getAuthor(document, "https://example.com")).toBe("Jane Doe");
  });

  it("should return author from [class*='author']", () => {
    const html = `<div class="author-name">Jane Doe</div>`;
    const document = createDocument(html);

    expect(getAuthor(document, "https://example.com")).toBe("Jane Doe");
  });
});
