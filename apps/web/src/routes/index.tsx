import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{
				title: "Collector | Scrapers",
			},
		],
	}),
	component: HomeComponent,
});

const DEFAULT_LIMIT = "25";

const PLATFORM_OPTIONS = [
	{
		value: "facebook",
		label: "Facebook",
		hint: "Post or video object ID.",
		example: "112233445566778",
	},
	{
		value: "instagram",
		label: "Instagram",
		hint: "Instagram media ID.",
		example: "17925874424000000",
	},
	{
		value: "youtube",
		label: "YouTube",
		hint: "Video ID from the watch URL.",
		example: "dQw4w9WgXcQ",
	},
	{
		value: "tiktok",
		label: "TikTok",
		hint: "Numeric video ID only.",
		example: "7411223344556677889",
	},
] as const;

type Platform = (typeof PLATFORM_OPTIONS)[number]["value"];

type ScrapeComment = {
	id: string;
	text: string;
	authorName: string | null;
	authorId: string | null;
	createdAt: string | null;
	likeCount: number | null;
	replyCount: number | null;
	raw?: unknown;
};

type ActiveRequest = {
	platform: Platform;
	targetId: string;
	limit: number;
};

function clampLimit(rawValue: string): number {
	const parsed = Number.parseInt(rawValue, 10);

	if (!Number.isFinite(parsed)) {
		return Number.parseInt(DEFAULT_LIMIT, 10);
	}

	return Math.max(1, Math.min(parsed, 100));
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return "Request failed.";
}

function formatDate(value: string | null): string {
	if (!value) {
		return "Unknown time";
	}

	const parsed = new Date(value);

	if (Number.isNaN(parsed.getTime())) {
		return value;
	}

	return parsed.toLocaleString();
}

function HomeComponent() {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());
	const [platform, setPlatform] = useState<Platform>("youtube");
	const [targetId, setTargetId] = useState("");
	const [limit, setLimit] = useState(DEFAULT_LIMIT);
	const [cursor, setCursor] = useState("");
	const [comments, setComments] = useState<ScrapeComment[]>([]);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [hasAttempted, setHasAttempted] = useState(false);
	const [activeRequest, setActiveRequest] = useState<ActiveRequest | null>(
		null,
	);
	const [lastRunAt, setLastRunAt] = useState<string | null>(null);
	const [isPaging, setIsPaging] = useState(false);

	const scrapeMutation = useMutation({
		mutationFn: (input: {
			platform: Platform;
			targetId: string;
			limit?: number;
			cursor?: string;
		}) => trpcClient.comments.scrapeComments.query(input),
	});

	const currentPlatform = PLATFORM_OPTIONS.find(
		(entry) => entry.value === platform,
	);

	async function handleScrape(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const normalizedTargetId = targetId.trim();

		if (!normalizedTargetId) {
			toast.error("Target ID is required.");
			return;
		}

		const normalizedLimit = clampLimit(limit);
		const normalizedCursor = cursor.trim();

		setHasAttempted(true);

		try {
			const result = await scrapeMutation.mutateAsync({
				platform,
				targetId: normalizedTargetId,
				limit: normalizedLimit,
				cursor: normalizedCursor ? normalizedCursor : undefined,
			});

			setComments(result.comments);
			setNextCursor(result.nextCursor);
			setActiveRequest({
				platform,
				targetId: normalizedTargetId,
				limit: normalizedLimit,
			});
			setLastRunAt(new Date().toISOString());
			toast.success(`Loaded ${result.comments.length} comments.`);
		} catch (error) {
			toast.error(getErrorMessage(error));
		}
	}

	async function handleLoadMore() {
		if (!activeRequest || !nextCursor || scrapeMutation.isPending) {
			return;
		}

		setIsPaging(true);

		try {
			const result = await scrapeMutation.mutateAsync({
				...activeRequest,
				cursor: nextCursor,
			});

			setComments((current) => [...current, ...result.comments]);
			setNextCursor(result.nextCursor);
			setLastRunAt(new Date().toISOString());
			toast.success(`Loaded ${result.comments.length} more comments.`);
		} catch (error) {
			toast.error(getErrorMessage(error));
		} finally {
			setIsPaging(false);
		}
	}

	function resetView() {
		setTargetId("");
		setLimit(DEFAULT_LIMIT);
		setCursor("");
		setComments([]);
		setNextCursor(null);
		setHasAttempted(false);
		setActiveRequest(null);
		setLastRunAt(null);
	}

	return (
		<main className="relative min-h-full overflow-hidden bg-[radial-gradient(circle_at_8%_6%,rgba(251,191,36,0.22),transparent_34%),radial-gradient(circle_at_92%_16%,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.12),transparent_48%),#0a0c0f] px-4 py-6 sm:px-6 lg:px-10">
			<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:38px_38px] opacity-20" />
			<div className="relative mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
				<Card className="border-white/15 bg-black/55 backdrop-blur-xl">
					<CardHeader className="space-y-2 border-white/15 border-b">
						<CardTitle className="font-mono text-lg uppercase tracking-[0.22em]">
							Scraper Controls
						</CardTitle>
						<CardDescription className="text-zinc-300">
							Configure a platform target and query live comments from
							`comments.scrapeComments`.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form className="space-y-4" onSubmit={handleScrape}>
							<div className="space-y-2">
								<Label
									htmlFor="platform"
									className="text-zinc-300 uppercase tracking-[0.18em]"
								>
									Platform
								</Label>
								<select
									id="platform"
									value={platform}
									onChange={(event) => {
										setPlatform(event.target.value as Platform);
									}}
									className="h-9 w-full rounded-none border border-white/20 bg-black/50 px-2 text-xs text-zinc-100 uppercase tracking-[0.16em] outline-none transition focus:border-amber-300"
								>
									{PLATFORM_OPTIONS.map((entry) => (
										<option key={entry.value} value={entry.value}>
											{entry.label}
										</option>
									))}
								</select>
								<p className="text-[11px] text-zinc-400">
									{currentPlatform?.hint} Example:{" "}
									<span className="font-mono text-zinc-200">
										{currentPlatform?.example}
									</span>
								</p>
							</div>

							<div className="space-y-2">
								<Label
									htmlFor="target-id"
									className="text-zinc-300 uppercase tracking-[0.18em]"
								>
									Target ID
								</Label>
								<Input
									id="target-id"
									value={targetId}
									onChange={(event) => setTargetId(event.target.value)}
									placeholder="Enter post, media, video, or object ID"
									className="border-white/20 bg-black/45 text-zinc-100 placeholder:text-zinc-500"
								/>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label
										htmlFor="limit"
										className="text-zinc-300 uppercase tracking-[0.18em]"
									>
										Limit
									</Label>
									<Input
										id="limit"
										type="number"
										min={1}
										max={100}
										value={limit}
										onChange={(event) => setLimit(event.target.value)}
										className="border-white/20 bg-black/45 text-zinc-100"
									/>
								</div>

								<div className="space-y-2">
									<Label
										htmlFor="cursor"
										className="text-zinc-300 uppercase tracking-[0.18em]"
									>
										Cursor
									</Label>
									<Input
										id="cursor"
										value={cursor}
										onChange={(event) => setCursor(event.target.value)}
										placeholder="Optional"
										className="border-white/20 bg-black/45 text-zinc-100 placeholder:text-zinc-500"
									/>
								</div>
							</div>

							<div className="flex flex-wrap gap-2 pt-2">
								<Button
									type="submit"
									disabled={scrapeMutation.isPending}
									className="h-9 border border-amber-300/60 bg-amber-300/90 px-4 font-mono text-black uppercase tracking-[0.16em] hover:bg-amber-200"
								>
									{scrapeMutation.isPending ? "Running..." : "Run Scrape"}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={resetView}
									className="h-9 border-white/30 bg-black/35 px-4 font-mono text-zinc-100 uppercase tracking-[0.16em]"
								>
									Clear
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>

				<section className="grid gap-4">
					<Card className="border-white/15 bg-black/45 backdrop-blur-xl">
						<CardContent className="grid gap-3 pt-4 sm:grid-cols-3">
							<div className="border border-white/15 bg-black/35 p-3">
								<p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em]">
									API Status
								</p>
								<p className="mt-1 font-semibold text-sm text-zinc-100">
									{healthCheck.isLoading
										? "Checking..."
										: healthCheck.data
											? "Connected"
											: "Disconnected"}
								</p>
							</div>
							<div className="border border-white/15 bg-black/35 p-3">
								<p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em]">
									Comments
								</p>
								<p className="mt-1 font-semibold text-sm text-zinc-100">
									{comments.length}
								</p>
							</div>
							<div className="border border-white/15 bg-black/35 p-3">
								<p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em]">
									Next Cursor
								</p>
								<p className="mt-1 truncate font-mono text-xs text-zinc-200">
									{nextCursor ?? "none"}
								</p>
							</div>
						</CardContent>
					</Card>

					<Card className="border-white/15 bg-black/45 backdrop-blur-xl">
						<CardHeader className="border-white/15 border-b">
							<CardTitle className="font-mono text-lg uppercase tracking-[0.2em]">
								Scrape Output
							</CardTitle>
							<CardDescription className="text-zinc-300">
								{activeRequest
									? `${activeRequest.platform.toUpperCase()} · ${activeRequest.targetId} · limit ${activeRequest.limit}`
									: "No scrape executed yet."}
								{lastRunAt ? ` · updated ${formatDate(lastRunAt)}` : ""}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 pt-4">
							{!hasAttempted ? (
								<div className="border border-white/25 border-dashed bg-black/30 p-6 text-center text-sm text-zinc-300">
									Submit a scrape request to populate the comment stream.
								</div>
							) : comments.length === 0 ? (
								<div className="border border-white/25 border-dashed bg-black/30 p-6 text-center text-sm text-zinc-300">
									No comments returned for this request.
								</div>
							) : (
								<div className="max-h-[58vh] space-y-3 overflow-y-auto pr-1">
									{comments.map((comment, index) => (
										<article
											key={`${comment.id}-${index}`}
											className="space-y-2 border border-white/15 bg-black/30 p-3"
										>
											<div className="flex flex-wrap items-center justify-between gap-2">
												<p className="font-mono text-[11px] text-zinc-300">
													{comment.id || "unknown-id"}
												</p>
												<p className="text-[11px] text-zinc-400 uppercase tracking-[0.14em]">
													{formatDate(comment.createdAt)}
												</p>
											</div>
											<p className="text-sm text-zinc-100 leading-relaxed">
												{comment.text.trim() || "(empty comment)"}
											</p>
											<div className="flex flex-wrap gap-2 text-[10px] text-zinc-400 uppercase tracking-[0.14em]">
												<span>author: {comment.authorName ?? "unknown"}</span>
												<span>likes: {comment.likeCount ?? 0}</span>
												<span>replies: {comment.replyCount ?? 0}</span>
											</div>
										</article>
									))}
								</div>
							)}

							{nextCursor ? (
								<div className="flex justify-start">
									<Button
										type="button"
										variant="outline"
										onClick={handleLoadMore}
										disabled={scrapeMutation.isPending}
										className="h-9 border-emerald-300/55 bg-emerald-400/15 px-4 font-mono text-emerald-100 uppercase tracking-[0.16em] hover:bg-emerald-300/20"
									>
										{isPaging ? "Loading..." : "Load More"}
									</Button>
								</div>
							) : null}
						</CardContent>
					</Card>
				</section>
			</div>
		</main>
	);
}
