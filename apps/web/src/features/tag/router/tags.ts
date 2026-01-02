import { createTRPCRouter } from "@/server/api/trpc";
import { createTag } from "./procedures/create-tag";
import { deleteTag } from "./procedures/delete-tag";
import { getDeckTags } from "./procedures/get-deck-tags";
import { getDeckUrlTags } from "./procedures/get-deck-url-tags";
import { updateTag } from "./procedures/update-tag";

export const tagsRouter = createTRPCRouter({
  createTag,
  deleteTag,
  getDeckTags,
  getDeckUrlTags,
  updateTag,
});
