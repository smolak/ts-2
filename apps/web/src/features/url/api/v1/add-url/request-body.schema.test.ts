import { describe, expect, it } from "vitest";

import { addUrlRequestBodySchema } from "./request-body.schema";

const VALID_DECK_ID = "deck_abcdefghijklmnopqrstuv";
const VALID_TAG_ID = "tag_abcdefghijklmnopqrstuv";

// Helper to create valid metadata with required contentType
const createMetadata = (overrides: {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  faviconUrl?: string;
}) => ({
  contentType: "text/html",
  ...overrides,
});

describe("addUrlRequestBodySchema", () => {
  it("should validate a valid request body with required fields", () => {
    const data = {
      metadata: createMetadata({
        url: "https://example.com",
        title: "Example Title",
      }),
      deckId: VALID_DECK_ID,
    };

    const result = addUrlRequestBodySchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should set empty array as default for tagIds when not provided", () => {
    const data = {
      metadata: createMetadata({
        url: "https://example.com",
        title: "Example Title",
      }),
      deckId: VALID_DECK_ID,
    };

    const result = addUrlRequestBodySchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tagIds).toEqual([]);
    }
  });

  it("should validate with tagIds array", () => {
    const data = {
      metadata: createMetadata({
        url: "https://example.com",
        title: "Example Title",
      }),
      deckId: VALID_DECK_ID,
      tagIds: [VALID_TAG_ID],
    };

    const result = addUrlRequestBodySchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tagIds).toEqual([VALID_TAG_ID]);
    }
  });

  it("should validate with multiple tagIds", () => {
    const secondTagId = "tag_bcdefghijklmnopqrstuvw";
    const data = {
      metadata: createMetadata({
        url: "https://example.com",
        title: "Example Title",
      }),
      deckId: VALID_DECK_ID,
      tagIds: [VALID_TAG_ID, secondTagId],
    };

    const result = addUrlRequestBodySchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tagIds).toHaveLength(2);
    }
  });

  it("should fail when metadata is missing", () => {
    const data = {
      deckId: VALID_DECK_ID,
    };

    const result = addUrlRequestBodySchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when deckId is missing", () => {
    const data = {
      metadata: {
        url: "https://example.com",
        title: "Example Title",
      },
    };

    const result = addUrlRequestBodySchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when deckId has wrong prefix", () => {
    const data = {
      metadata: {
        url: "https://example.com",
        title: "Example Title",
      },
      deckId: "tag_abcdefghijklmnopqrstuv",
    };

    const result = addUrlRequestBodySchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when tagId in array has wrong prefix", () => {
    const data = {
      metadata: {
        url: "https://example.com",
        title: "Example Title",
      },
      deckId: VALID_DECK_ID,
      tagIds: ["deck_abcdefghijklmnopqrstuv"],
    };

    const result = addUrlRequestBodySchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when tagId in array has wrong length", () => {
    const data = {
      metadata: {
        url: "https://example.com",
        title: "Example Title",
      },
      deckId: VALID_DECK_ID,
      tagIds: ["tag_short"],
    };

    const result = addUrlRequestBodySchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when metadata.url is invalid", () => {
    const data = {
      metadata: {
        url: "not-a-url",
        title: "Example Title",
      },
      deckId: VALID_DECK_ID,
    };

    const result = addUrlRequestBodySchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should validate with full metadata", () => {
    const data = {
      metadata: createMetadata({
        url: "https://example.com/page",
        title: "Full Example",
        description: "A description",
        imageUrl: "https://example.com/image.png",
        faviconUrl: "https://example.com/favicon.ico",
      }),
      deckId: VALID_DECK_ID,
      tagIds: [],
    };

    const result = addUrlRequestBodySchema.safeParse(data);

    expect(result.success).toBe(true);
  });
});
