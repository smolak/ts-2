import { z } from "zod";

export const TodoSchema = z.object({
  id: z.int().min(1),
  name: z.string(),
});
