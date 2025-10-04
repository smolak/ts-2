import type { CategoryDto } from "../../dto/category.dto";

// TODO: introduce common response schema, with items, error, pagination, etc. We need it for all orpc schemas.
export type GetCategoriesSuccessResponse = { categories: CategoryDto[] };
