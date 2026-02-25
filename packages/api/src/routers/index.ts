import { publicProcedure, router } from "../index";
import { commentsRouter } from "./comments";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	comments: commentsRouter,
});
export type AppRouter = typeof appRouter;
