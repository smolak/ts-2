import { createTRPCRouter } from "@/server/api/trpc";
import { createTag } from "./procedures/create-tag";
import { deleteTag } from "./procedures/delete-tag";
import { getDeckUrlTags } from "./procedures/get-deck-url-tags";
import { getMyDeckTags } from "./procedures/get-my-deck-tags";
import { getPublicDeckTags } from "./procedures/get-public-deck-tags";
import { updateTag } from "./procedures/update-tag";

export const tagsRouter = createTRPCRouter({
  createTag,
  deleteTag,
  getDeckUrlTags,
  getMyDeckTags,
  getPublicDeckTags,
  updateTag,
});
