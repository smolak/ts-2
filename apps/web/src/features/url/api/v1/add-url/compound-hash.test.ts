import { sha1, sha256 } from "@repo/crypto/hash";
import { describe, expect, it } from "vitest";
import { createCompoundHash, createUrlHash } from "./compound-hash";
import type { AddUrlRequestBody } from "./request-body.schema";

// Helper to create metadata with required contentType
const createMetadata = (
  overrides: Partial<AddUrlRequestBody["metadata"]> & { url: string },
): AddUrlRequestBody["metadata"] => ({
  contentType: "text/html",
  ...overrides,
});

describe("createCompoundHash", () => {
  it("should create a hash from url, title, imageUrl, and description", () => {
    const metadata = createMetadata({
      url: "https://example.com",
      title: "Example Title",
      imageUrl: "https://example.com/image.png",
      description: "Example description",
    });

    const result = createCompoundHash(metadata);

    const expectedData = `${metadata.url}${metadata.title}${metadata.imageUrl}${metadata.description}`.trim();
    const expectedHash = sha256(expectedData);
    expect(result).toBe(expectedHash);
  });

  it("should handle missing title", () => {
    const metadata = createMetadata({
      url: "https://example.com",
      imageUrl: "https://example.com/image.png",
      description: "Example description",
    });

    const result = createCompoundHash(metadata);

    const expectedData = `${metadata.url}${metadata.imageUrl}${metadata.description}`.trim();
    const expectedHash = sha256(expectedData);
    expect(result).toBe(expectedHash);
  });

  it("should handle missing imageUrl", () => {
    const metadata = createMetadata({
      url: "https://example.com",
      title: "Example Title",
      description: "Example description",
    });

    const result = createCompoundHash(metadata);

    const expectedData = `${metadata.url}${metadata.title}${metadata.description}`.trim();
    const expectedHash = sha256(expectedData);
    expect(result).toBe(expectedHash);
  });

  it("should handle missing description", () => {
    const metadata = createMetadata({
      url: "https://example.com",
      title: "Example Title",
      imageUrl: "https://example.com/image.png",
    });

    const result = createCompoundHash(metadata);

    const expectedData = `${metadata.url}${metadata.title}${metadata.imageUrl}`.trim();
    const expectedHash = sha256(expectedData);
    expect(result).toBe(expectedHash);
  });

  it("should handle only url provided", () => {
    const metadata = createMetadata({
      url: "https://example.com",
    });

    const result = createCompoundHash(metadata);

    const expectedHash = sha256(metadata.url);
    expect(result).toBe(expectedHash);
  });

  it("should produce different hashes for different metadata", () => {
    const metadata1 = createMetadata({
      url: "https://example.com",
      title: "Title 1",
    });
    const metadata2 = createMetadata({
      url: "https://example.com",
      title: "Title 2",
    });

    const result1 = createCompoundHash(metadata1);
    const result2 = createCompoundHash(metadata2);

    expect(result1).not.toBe(result2);
  });

  it("should produce same hash for same metadata", () => {
    const metadata = createMetadata({
      url: "https://example.com",
      title: "Same Title",
      imageUrl: "https://example.com/image.png",
      description: "Same description",
    });

    const result1 = createCompoundHash(metadata);
    const result2 = createCompoundHash(metadata);

    expect(result1).toBe(result2);
  });

  it("should handle null values as empty strings", () => {
    const metadata = {
      contentType: "text/html",
      url: "https://example.com",
      title: null,
      imageUrl: null,
      description: null,
    } as unknown as AddUrlRequestBody["metadata"];

    const result = createCompoundHash(metadata);

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });
});

describe("createUrlHash", () => {
  it("should create SHA1 hash of the URL", () => {
    const url = "https://example.com";

    const result = createUrlHash(url);

    expect(result).toBe(sha1(url));
  });

  it("should produce different hashes for different URLs", () => {
    const url1 = "https://example.com/page1";
    const url2 = "https://example.com/page2";

    const result1 = createUrlHash(url1);
    const result2 = createUrlHash(url2);

    expect(result1).not.toBe(result2);
  });

  it("should produce same hash for same URL", () => {
    const url = "https://example.com";

    const result1 = createUrlHash(url);
    const result2 = createUrlHash(url);

    expect(result1).toBe(result2);
  });

  it("should be the sha1 function", () => {
    expect(createUrlHash).toBe(sha1);
  });
});
