import { createTRPCRouter } from "@/server/api/trpc";
import { createTag } from "./procedures/create-tag";
import { deleteTag } from "./procedures/delete-tag";
import { getDeckTags } from "./procedures/get-user-tags";
import { getDeckUrlTags } from "./procedures/get-user-url-tags";
import { updateTag } from "./procedures/update-tag";

export const tagsRouter = createTRPCRouter({
  createTag,
  deleteTag,
  getDeckTags,
  getDeckUrlTags,
  updateTag,
});
