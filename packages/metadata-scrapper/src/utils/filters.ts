import { condenseWhitespace } from "./condense-whitespace";

export const filter = (
  filterFn: (values: string[]) => string | undefined,
  selectorFn: (document: Document) => string[],
) => {
  return (document: Document) => filterFn(selectorFn(document));
};

export const findFirstUsing =
  (fn: (val: string) => string | undefined) =>
  (values: string[]): string | undefined => {
    let result: string | undefined;

    for (const value of values) {
      result = fn(value);

      if (result !== undefined) {
        result = condenseWhitespace(result);

        if (result !== "") {
          return result;
        }
      }
    }

    return undefined;
  };

export const firstNonEmpty = (values: string[]): string | undefined => {
  let result: string | undefined;

  for (const value of values) {
    result = condenseWhitespace(value);

    if (result !== "") {
      return result;
    }
  }

  return undefined;
};
