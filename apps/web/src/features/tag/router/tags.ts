import { createTRPCRouter } from "@/server/api/trpc";
import { createTag } from "./procedures/create-tag";
import { deleteTag } from "./procedures/delete-tag";
import { getUserTags } from "./procedures/get-user-tags";
import { getUserUrlTags } from "./procedures/get-user-url-tags";
import { updateTag } from "./procedures/update-tag";

export const tagsRouter = createTRPCRouter({
  createTag,
  deleteTag,
  getUserTags,
  getUserUrlTags,
  updateTag,
});
