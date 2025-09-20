import { describe, expect, it } from "vitest";

import { sha1, sha256 } from "./hash";

type Sample = { string: string; sha1: string; sha256: string };
type Samples = ReadonlyArray<Sample>;

// Generated using online generator
const data: Samples = [
  {
    string: "foo",
    sha1: "0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33",
    sha256: "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
  },
  {
    string: "Lorem Ipsum 1234567890-=+",
    sha1: "f29bd228b22814a5f1dd8b2be8a41ed7c53457fa",
    sha256: "30739f401bc4c4c1856ef82340449e41b3c0ee2eed4bdb5c360bd610f8a5ec44",
  },
  {
    string: "https://www.something.com",
    sha1: "5ebb16a1766f1106ea5f53702df4d023ac9d2d7b",
    sha256: "2e2eae2573eb684e3f7b95e0b97fe03676d0ecf8a507b37fedc28062a2aad971",
  },
];

describe("hashes", () => {
  describe("sha1", () => {
    it.each<Sample>(data)("should create correct hash signature", ({ string, sha1: hash }) => {
      expect(sha1(string)).toEqual(hash);
    });
  });

  describe("sha256", () => {
    it.each<Sample>(data)("should create correct hash signature", ({ string, sha256: hash }) => {
      expect(sha256(string)).toEqual(hash);
    });
  });
});
