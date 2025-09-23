import { describe, expect, it } from "vitest";

import { urlSchema } from "./url.schema";

describe("urlSchema", () => {
  describe("valid URLs", () => {
    it("should accept valid HTTPS URLs", () => {
      const validUrls = [
        "https://example.com",
        "https://www.example.com",
        "https://subdomain.example.com",
        "https://example.com/path",
        "https://example.com/path/to/page",
        "https://example.com/path?query=value",
        "https://example.com/path?query=value&another=param",
        "https://example.com/path#fragment",
        "https://example.com/path?query=value#fragment",
        "https://api.example.com/v1/users",
        "https://example.com:8080",
        "https://example.com:8080/path",
        "https://user:pass@example.com",
        "https://user:pass@example.com:8080/path",
        "https://example.com/very/long/path/with/many/segments",
        "https://example.com/path?very=long&query=string&with=many&parameters=here",
      ];

      validUrls.forEach((url) => {
        const result = urlSchema.safeParse(url);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(url);
        }
      });
    });

    it("should trim whitespace from valid URLs", () => {
      const urlsWithWhitespace = [
        "  https://example.com  ",
        "\thttps://example.com\t",
        "\nhttps://example.com\n",
        "  https://example.com/path  ",
        "\r\nhttps://example.com\r\n",
      ];

      urlsWithWhitespace.forEach((url) => {
        const result = urlSchema.safeParse(url);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(url.trim());
        }
      });
    });

    it("should accept URLs with special characters in path and query", () => {
      const urlsWithSpecialChars = [
        "https://example.com/path-with-dashes",
        "https://example.com/path_with_underscores",
        "https://example.com/path%20with%20encoded%20spaces",
        "https://example.com/path?param=value+with+plus",
        "https://example.com/path?param=value%20with%20encoded",
        "https://example.com/path?param=value&another=test",
        "https://example.com/path#fragment-with-dash",
        "https://example.com/path#fragment_with_underscore",
      ];

      urlsWithSpecialChars.forEach((url) => {
        const result = urlSchema.safeParse(url);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(url);
        }
      });
    });

    it("should accept URLs with international domain names", () => {
      const internationalUrls = [
        "https://münchen.de",
        "https://测试.com",
        "https://例え.jp",
        "https://тест.рф",
        "https://اختبار.كوم",
      ];

      internationalUrls.forEach((url) => {
        const result = urlSchema.safeParse(url);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(url);
        }
      });
    });
  });

  describe("URL length validation", () => {
    it("should accept URLs with maximum length", () => {
      const baseUrl = "https://example.com/";
      const maxLengthUrl = `${baseUrl}${"a".repeat(500 - baseUrl.length)}`;
      const result = urlSchema.safeParse(maxLengthUrl);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(maxLengthUrl);
      }
    });

    it("should reject URLs that are too long", () => {
      const baseUrl = "https://example.com/";
      const tooLongUrl = `${baseUrl}${"a".repeat(500 - baseUrl.length + 1)}`; // 1 char over the limit
      const result = urlSchema.safeParse(tooLongUrl);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.code).toBe("too_big");
      }
    });
  });

  describe("invalid URLs", () => {
    it("should reject HTTP URLs (only HTTPS allowed)", () => {
      const httpUrls = [
        "http://example.com",
        "http://www.example.com",
        "http://example.com/path",
        "http://example.com:8080",
      ];

      httpUrls.forEach((url) => {
        const result = urlSchema.safeParse(url);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe("Only https:// URLs allowed.");
        }
      });
    });

    it("should reject malformed URLs", () => {
      const malformedUrls = [
        "not-a-url",
        "example.com",
        "www.example.com",
        "ftp://example.com",
        "file:///path/to/file",
        "mailto:test@example.com",
        "tel:+1234567890",
        "javascript:alert('test')",
        "data:text/plain;base64,SGVsbG8gV29ybGQ=",
        "blob:https://example.com/12345678-1234-1234-1234-123456789012",
        "about:blank",
        "chrome://settings/",
        "moz-extension://12345678-1234-1234-1234-123456789012/",
      ];

      malformedUrls.forEach((url) => {
        const result = urlSchema.safeParse(url);
        expect(result.success).toBe(false);
      });
    });

    it("should reject empty strings", () => {
      const emptyInputs = ["", "   ", "\t", "\n", "\r\n"];

      emptyInputs.forEach((input) => {
        const result = urlSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });

    it("should reject non-string inputs", () => {
      const nonStringInputs = [null, undefined, 123, true, false, {}, [], () => {}];

      nonStringInputs.forEach((input) => {
        const result = urlSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.code).toBe("invalid_type");
        }
      });
    });

    it("should reject URLs with missing protocol", () => {
      const urlsWithoutProtocol = [
        "//example.com",
        "example.com",
        "www.example.com",
        "subdomain.example.com",
        "example.com/path",
        "example.com:8080",
      ];

      urlsWithoutProtocol.forEach((url) => {
        const result = urlSchema.safeParse(url);
        expect(result.success).toBe(false);
      });
    });

    it("should reject URLs with wrong protocol", () => {
      const wrongProtocolUrls = [
        "ftp://example.com",
        "file:///path/to/file",
        "mailto:test@example.com",
        "tel:+1234567890",
        "javascript:alert('test')",
        "data:text/plain;base64,SGVsbG8gV29ybGQ=",
        "blob:https://example.com/12345678-1234-1234-1234-123456789012",
        "about:blank",
        "chrome://settings/",
        "moz-extension://12345678-1234-1234-1234-123456789012/",
        "ws://example.com",
        "wss://example.com",
        "gopher://example.com",
        "news://example.com",
        "nntp://example.com",
        "prospero://example.com",
        "snews://example.com",
        "wais://example.com",
      ];

      wrongProtocolUrls.forEach((url) => {
        const result = urlSchema.safeParse(url);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle URLs with complex query parameters", () => {
      const complexQueryUrls = [
        "https://example.com/search?q=test+query&category=all&sort=relevance&page=1",
        "https://example.com/api/v1/users?filter[status]=active&include=profile,settings&limit=50&offset=0",
        "https://example.com/path?param1=value1&param2=value2&param3=value3&param4=value4&param5=value5",
        "https://example.com/path?empty=&null=null&undefined=undefined&boolean=true&number=123",
        "https://example.com/path?encoded=hello%20world&plus=hello+world&special=!@#$%^&*()",
      ];

      complexQueryUrls.forEach((url) => {
        const result = urlSchema.safeParse(url);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(url);
        }
      });
    });

    it("should handle URLs with fragments", () => {
      const fragmentUrls = [
        "https://example.com/page#section1",
        "https://example.com/page#section-with-dashes",
        "https://example.com/page#section_with_underscores",
        "https://example.com/page?query=value#fragment",
        "https://example.com/page#fragment?not=query",
        "https://example.com/page#fragment#nested",
      ];

      fragmentUrls.forEach((url) => {
        const result = urlSchema.safeParse(url);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(url);
        }
      });
    });

    it("should handle URLs with authentication", () => {
      const authUrls = [
        "https://user:pass@example.com",
        "https://user:pass@example.com:8080",
        "https://user:pass@example.com:8080/path",
        "https://user:pass@example.com/path?query=value",
        "https://user:pass@example.com/path?query=value#fragment",
        "https://user@example.com",
        "https://user@example.com:8080",
        "https://user@example.com:8080/path",
      ];

      authUrls.forEach((url) => {
        const result = urlSchema.safeParse(url);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(url);
        }
      });
    });

    it("should handle URLs with ports", () => {
      const portUrls = [
        "https://example.com:80",
        "https://example.com:443",
        "https://example.com:8080",
        "https://example.com:3000",
        "https://example.com:9000",
        "https://example.com:65535", // max port number
        "https://example.com:1", // min port number
        "https://example.com:8080/path",
        "https://example.com:8080/path?query=value",
        "https://example.com:8080/path?query=value#fragment",
      ];

      portUrls.forEach((url) => {
        const result = urlSchema.safeParse(url);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(url);
        }
      });
    });

    it("should handle URLs with subdomains", () => {
      const subdomainUrls = [
        "https://www.example.com",
        "https://api.example.com",
        "https://admin.example.com",
        "https://blog.example.com",
        "https://shop.example.com",
        "https://mail.example.com",
        "https://ftp.example.com",
        "https://subdomain.example.com",
        "https://sub.subdomain.example.com",
        "https://deep.nested.subdomain.example.com",
        "https://a.example.com", // single character subdomain
        "https://very-long-subdomain-name-that-is-still-valid.example.com",
      ];

      subdomainUrls.forEach((url) => {
        const result = urlSchema.safeParse(url);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(url);
        }
      });
    });
  });
});
