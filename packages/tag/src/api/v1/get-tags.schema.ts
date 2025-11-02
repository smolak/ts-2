import type { TagDto } from "../../dto/tag.dto";

// TODO: introduce common response schema, with items, error, pagination, etc. We need it for all orpc schemas.
export type GetTagsSuccessResponse = { tags: TagDto[] };
