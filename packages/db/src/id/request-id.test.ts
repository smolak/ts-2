import { describe, expect, it } from "vitest";

import { generateRequestId } from "./request-id";

describe("generateRequestId", () => {
  it("should prefix id with user prefix", () => {
    const id = generateRequestId();

    expect(id).toMatch(/^req_[a-zA-Z0-9]{22}$/);
  });
});
