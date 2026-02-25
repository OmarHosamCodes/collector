import { z } from "zod";

import { publicProcedure, router } from "../index";
import { PLATFORM_VALUES, scrapeComments } from "../services/comments";

const scrapeCommentsInputSchema = z.object({
	platform: z.enum(PLATFORM_VALUES),
	targetId: z.string().min(1),
	limit: z.number().int().min(1).max(100).optional(),
	cursor: z.string().min(1).optional(),
});

export const commentsRouter = router({
	scrapeComments: publicProcedure
		.input(scrapeCommentsInputSchema)
		.query(({ input }) => {
			return scrapeComments(input);
		}),
});
