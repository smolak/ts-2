import { createTRPCRouter } from "@/server/api/trpc";
import { addUrlToDeck } from "./procedures/add-url-to-deck";
import { createDeck } from "./procedures/create-deck";
import { scheduleDeckDeletion } from "./procedures/schedule-deck-deletion";
import { getDeckBySlug } from "./procedures/get-deck-by-slug";
import { getDeckUrls } from "./procedures/get-deck-urls";
import { getFollowedDecks } from "./procedures/get-followed-decks";
import { getPublicDecks } from "./procedures/get-public-decks";
import { getUserDecks } from "./procedures/get-user-decks";
import { removeUrlFromDeck } from "./procedures/remove-url-from-deck";
import { restoreDeck } from "./procedures/restore-deck";
import { toggleFollowDeck } from "./procedures/toggle-follow-deck";
import { updateDeck } from "./procedures/update-deck";

export const decksRouter = createTRPCRouter({
  createDeck,
  updateDeck,
  scheduleDeckDeletion,
  restoreDeck,
  getUserDecks,
  getDeckBySlug,
  getPublicDecks,
  addUrlToDeck,
  removeUrlFromDeck,
  getDeckUrls,
  toggleFollowDeck,
  getFollowedDecks,
});

