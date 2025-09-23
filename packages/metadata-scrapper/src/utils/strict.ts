import type { StrictToMaybeValue, ToMaybeValue } from "../types";

export const strict = (toMaybeValue: ToMaybeValue): StrictToMaybeValue => [toMaybeValue, "strict"];

export const isStrict = (value: unknown): value is StrictToMaybeValue => {
  return Array.isArray(value) && value[1] === "strict";
};
