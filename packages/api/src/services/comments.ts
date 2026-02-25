import { env } from "@collector/env/server";
import { TRPCError } from "@trpc/server";

export const PLATFORM_VALUES = [
	"facebook",
	"instagram",
	"youtube",
	"tiktok",
] as const;

export type CommentPlatform = (typeof PLATFORM_VALUES)[number];

export type ScrapeCommentsInput = {
	platform: CommentPlatform;
	targetId: string;
	limit?: number;
	cursor?: string;
};

export type NormalizedComment = {
	id: string;
	text: string;
	authorName: string | null;
	authorId: string | null;
	createdAt: string | null;
	likeCount: number | null;
	replyCount: number | null;
	raw: unknown;
};

export type ScrapeCommentsResult = {
	platform: CommentPlatform;
	targetId: string;
	comments: NormalizedComment[];
	nextCursor: string | null;
};

type MetaCommentItem = {
	id?: string;
	message?: string;
	text?: string;
	created_time?: string;
	timestamp?: string;
	like_count?: number;
	comment_count?: number;
	replies_count?: number;
	from?: {
		id?: string;
		name?: string;
		username?: string;
	};
	username?: string;
};

type MetaCommentsResponse = {
	data?: MetaCommentItem[];
	paging?: {
		cursors?: {
			after?: string;
		};
	};
	error?: {
		message?: string;
	};
};

type YouTubeCommentThreadResponse = {
	nextPageToken?: string;
	items?: Array<{
		id?: string;
		snippet?: {
			totalReplyCount?: number;
			topLevelComment?: {
				id?: string;
				snippet?: {
					textOriginal?: string;
					textDisplay?: string;
					authorDisplayName?: string;
					authorChannelId?: {
						value?: string;
					};
					publishedAt?: string;
					likeCount?: number;
				};
			};
		};
		replies?: {
			comments?: Array<{
				id?: string;
				snippet?: {
					textOriginal?: string;
					textDisplay?: string;
					authorDisplayName?: string;
					authorChannelId?: {
						value?: string;
					};
					publishedAt?: string;
					likeCount?: number;
				};
			}>;
		};
	}>;
	error?: {
		message?: string;
	};
};

type TikTokClientTokenResponse = {
	access_token?: string;
	error?: string;
	error_description?: string;
};

type TikTokCommentItem = {
	id?: string;
	text?: string;
	like_count?: number;
	reply_count?: number;
	create_time?: number;
	parent_comment_id?: string;
};

type TikTokCommentsResponse = {
	data?: {
		comments?: TikTokCommentItem[];
		has_more?: boolean;
		cursor?: number;
	};
	error?: {
		code?: string;
		message?: string;
		log_id?: string;
	};
};

const META_GRAPH_BASE_URL = `https://graph.facebook.com/${env.FACEBOOK_GRAPH_API_VERSION}`;
const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";
const TIKTOK_BASE_URL = "https://open.tiktokapis.com";

export async function scrapeComments(
	input: ScrapeCommentsInput,
): Promise<ScrapeCommentsResult> {
	switch (input.platform) {
		case "facebook":
			return scrapeFacebookComments(input);
		case "instagram":
			return scrapeInstagramComments(input);
		case "youtube":
			return scrapeYouTubeComments(input);
		case "tiktok":
			return scrapeTikTokComments(input);
		default:
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Unsupported platform: ${input.platform}`,
			});
	}
}

function normalizeLimit(limit?: number, max = 100): number {
	if (!limit) {
		return 25;
	}

	return Math.max(1, Math.min(limit, max));
}

function requireConfig(value: string | undefined, envVar: string): string {
	if (!value) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: `Missing environment variable: ${envVar}`,
		});
	}

	return value;
}

function createURL(
	endpoint: string,
	params: Record<string, string | number | undefined>,
): URL {
	const url = new URL(endpoint);

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== "") {
			url.searchParams.set(key, String(value));
		}
	}

	return url;
}

function parseApiErrorMessage(payload: unknown): string | null {
	if (!payload || typeof payload !== "object") {
		return null;
	}

	const metaErrorMessage =
		"error" in payload &&
		payload.error &&
		typeof payload.error === "object" &&
		"message" in payload.error &&
		typeof payload.error.message === "string"
			? payload.error.message
			: null;

	if (metaErrorMessage) {
		return metaErrorMessage;
	}

	const errorMessage =
		"message" in payload && typeof payload.message === "string"
			? payload.message
			: null;

	if (errorMessage) {
		return errorMessage;
	}

	const rootError =
		"error" in payload && typeof payload.error === "string"
			? payload.error
			: null;

	return rootError;
}

async function fetchJson<T>(
	request: URL | string,
	init: RequestInit,
	platform: CommentPlatform,
): Promise<T> {
	const response = await fetch(request, init);
	const responseText = await response.text();

	let payload: unknown = null;

	if (responseText) {
		try {
			payload = JSON.parse(responseText);
		} catch {
			payload = responseText;
		}
	}

	if (!response.ok) {
		const apiMessage = parseApiErrorMessage(payload);

		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `${platform} API request failed (${response.status}): ${apiMessage ?? "Unknown API error"}`,
		});
	}

	return payload as T;
}

async function scrapeFacebookComments(
	input: ScrapeCommentsInput,
): Promise<ScrapeCommentsResult> {
	const accessToken = requireConfig(
		env.FACEBOOK_ACCESS_TOKEN,
		"FACEBOOK_ACCESS_TOKEN",
	);
	const limit = normalizeLimit(input.limit);

	const url = createURL(`${META_GRAPH_BASE_URL}/${input.targetId}/comments`, {
		fields: "id,message,from{id,name},created_time,like_count,comment_count",
		limit,
		after: input.cursor,
		access_token: accessToken,
	});

	const payload = await fetchJson<MetaCommentsResponse>(
		url,
		{ method: "GET" },
		"facebook",
	);

	const comments =
		payload.data?.map((item) => ({
			id: item.id ?? "",
			text: item.message ?? "",
			authorName: item.from?.name ?? null,
			authorId: item.from?.id ?? null,
			createdAt: item.created_time ?? null,
			likeCount: item.like_count ?? null,
			replyCount: item.comment_count ?? null,
			raw: item,
		})) ?? [];

	return {
		platform: "facebook",
		targetId: input.targetId,
		comments,
		nextCursor: payload.paging?.cursors?.after ?? null,
	};
}

async function scrapeInstagramComments(
	input: ScrapeCommentsInput,
): Promise<ScrapeCommentsResult> {
	const accessToken = requireConfig(
		env.INSTAGRAM_ACCESS_TOKEN,
		"INSTAGRAM_ACCESS_TOKEN",
	);
	const limit = normalizeLimit(input.limit);

	const url = createURL(`${META_GRAPH_BASE_URL}/${input.targetId}/comments`, {
		fields: "id,text,username,timestamp,like_count,replies_count",
		limit,
		after: input.cursor,
		access_token: accessToken,
	});

	const payload = await fetchJson<MetaCommentsResponse>(
		url,
		{ method: "GET" },
		"instagram",
	);

	const comments =
		payload.data?.map((item) => ({
			id: item.id ?? "",
			text: item.text ?? "",
			authorName:
				item.username ?? item.from?.username ?? item.from?.name ?? null,
			authorId: item.from?.id ?? null,
			createdAt: item.timestamp ?? null,
			likeCount: item.like_count ?? null,
			replyCount: item.replies_count ?? null,
			raw: item,
		})) ?? [];

	return {
		platform: "instagram",
		targetId: input.targetId,
		comments,
		nextCursor: payload.paging?.cursors?.after ?? null,
	};
}

async function scrapeYouTubeComments(
	input: ScrapeCommentsInput,
): Promise<ScrapeCommentsResult> {
	const apiKey = requireConfig(env.YOUTUBE_API_KEY, "YOUTUBE_API_KEY");
	const limit = normalizeLimit(input.limit, 100);

	const url = createURL(`${YOUTUBE_BASE_URL}/commentThreads`, {
		part: "snippet,replies",
		textFormat: "plainText",
		maxResults: limit,
		pageToken: input.cursor,
		videoId: input.targetId,
		key: apiKey,
	});

	const payload = await fetchJson<YouTubeCommentThreadResponse>(
		url,
		{ method: "GET" },
		"youtube",
	);

	const comments: NormalizedComment[] = [];

	for (const thread of payload.items ?? []) {
		const topLevelComment = thread.snippet?.topLevelComment;
		const topLevelSnippet = topLevelComment?.snippet;

		if (topLevelComment?.id) {
			comments.push({
				id: topLevelComment.id,
				text:
					topLevelSnippet?.textOriginal ?? topLevelSnippet?.textDisplay ?? "",
				authorName: topLevelSnippet?.authorDisplayName ?? null,
				authorId: topLevelSnippet?.authorChannelId?.value ?? null,
				createdAt: topLevelSnippet?.publishedAt ?? null,
				likeCount: topLevelSnippet?.likeCount ?? null,
				replyCount: thread.snippet?.totalReplyCount ?? null,
				raw: topLevelComment,
			});
		}

		for (const reply of thread.replies?.comments ?? []) {
			comments.push({
				id: reply.id ?? "",
				text: reply.snippet?.textOriginal ?? reply.snippet?.textDisplay ?? "",
				authorName: reply.snippet?.authorDisplayName ?? null,
				authorId: reply.snippet?.authorChannelId?.value ?? null,
				createdAt: reply.snippet?.publishedAt ?? null,
				likeCount: reply.snippet?.likeCount ?? null,
				replyCount: null,
				raw: reply,
			});
		}
	}

	return {
		platform: "youtube",
		targetId: input.targetId,
		comments,
		nextCursor: payload.nextPageToken ?? null,
	};
}

async function requestTikTokClientToken(): Promise<string> {
	const clientKey = requireConfig(env.TIKTOK_CLIENT_KEY, "TIKTOK_CLIENT_KEY");
	const clientSecret = requireConfig(
		env.TIKTOK_CLIENT_SECRET,
		"TIKTOK_CLIENT_SECRET",
	);

	const payload = await fetchJson<TikTokClientTokenResponse>(
		`${TIKTOK_BASE_URL}/v2/oauth/token/`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_key: clientKey,
				client_secret: clientSecret,
				grant_type: "client_credentials",
			}).toString(),
		},
		"tiktok",
	);

	if (!payload.access_token) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `tiktok token request failed: ${payload.error_description ?? payload.error ?? "Unknown error"}`,
		});
	}

	return payload.access_token;
}

async function scrapeTikTokComments(
	input: ScrapeCommentsInput,
): Promise<ScrapeCommentsResult> {
	const accessToken = await requestTikTokClientToken();
	const limit = normalizeLimit(input.limit, 100);

	if (!/^\d+$/.test(input.targetId)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "TikTok video IDs must be numeric.",
		});
	}

	if (input.cursor && !/^\d+$/.test(input.cursor)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "TikTok cursor must be numeric.",
		});
	}

	// Keep video_id numeric in JSON without precision loss by building the body string manually.
	const body = `{"video_id":${input.targetId},"max_count":${limit}${
		input.cursor ? `,"cursor":${input.cursor}` : ""
	}}`;

	const payload = await fetchJson<TikTokCommentsResponse>(
		`${TIKTOK_BASE_URL}/v2/research/video/comment/list/?fields=id,text,like_count,reply_count,parent_comment_id,create_time`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body,
		},
		"tiktok",
	);

	if (payload.error?.code && payload.error.code !== "ok") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `tiktok API error (${payload.error.code}): ${payload.error.message ?? "Unknown API error"}`,
		});
	}

	const comments =
		payload.data?.comments?.map((item) => ({
			id: item.id ?? "",
			text: item.text ?? "",
			authorName: null,
			authorId: null,
			createdAt: item.create_time
				? new Date(item.create_time * 1000).toISOString()
				: null,
			likeCount: item.like_count ?? null,
			replyCount: item.reply_count ?? null,
			raw: item,
		})) ?? [];

	return {
		platform: "tiktok",
		targetId: input.targetId,
		comments,
		nextCursor:
			payload.data?.has_more && payload.data.cursor !== undefined
				? String(payload.data.cursor)
				: null,
	};
}
