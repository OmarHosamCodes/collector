import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		CORS_ORIGIN: z.url(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		FACEBOOK_GRAPH_API_VERSION: z.string().min(1).default("v23.0"),
		FACEBOOK_ACCESS_TOKEN: z.string().min(1).optional(),
		INSTAGRAM_ACCESS_TOKEN: z.string().min(1).optional(),
		YOUTUBE_API_KEY: z.string().min(1).optional(),
		TIKTOK_CLIENT_KEY: z.string().min(1).optional(),
		TIKTOK_CLIENT_SECRET: z.string().min(1).optional(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
