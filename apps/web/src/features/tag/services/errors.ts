export class DeckNotFoundError extends Error {
  constructor() {
    super("Deck not found.");
    this.name = "DeckNotFoundError";
  }
}

export class TagAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`Tag "${name}" already exists in this deck.`);
    this.name = "TagAlreadyExistsError";
  }
}

export class TagCreationError extends Error {
  constructor() {
    super("Tag could not be created.");
    this.name = "TagCreationError";
  }
}
