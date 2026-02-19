import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePaginatedQuery } from "convex/react";
import { Archive, ArchiveRestore, Loader2, RefreshCw, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/events")({
	component: EventsRoute,
});

type FeedMode = "convex" | "tanstack";

type EventDoc = {
	_id: Id<"events">;
	title: string;
	level: "info" | "warning" | "error";
	source: "system" | "workflow" | "integration" | "manual";
	starred: boolean;
	archived: boolean;
	createdAt: number;
	updatedAt: number;
};

function EventsRoute() {
	const listRef = useRef<HTMLDivElement>(null);
	const queryClient = useQueryClient();
	const { convexQueryClient, isAuthenticated, currentUser } = useRouteContext({ from: "__root__" });

	const [mode, setMode] = useState<FeedMode>("convex");
	const [showArchived, setShowArchived] = useState(false);
	const [seedCount, setSeedCount] = useState(1200);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [seedMessage, setSeedMessage] = useState<string | null>(null);

	const paginated = usePaginatedQuery(
		api.events.listPaginated,
		{
			archived: showArchived,
		},
		{
			initialNumItems: 80,
		},
	);

	const infiniteQuery = useInfiniteQuery({
		queryKey: ["events", "infinite", showArchived],
		initialPageParam: null as string | null,
		queryFn: async ({ pageParam }) => {
			return await convexQueryClient.convexClient.query(api.events.listPaginated, {
				archived: showArchived,
				paginationOpts: {
					numItems: 80,
					cursor: pageParam,
				},
			});
		},
		getNextPageParam: (lastPage) => {
			if (lastPage.isDone) {
				return undefined;
			}
			return lastPage.continueCursor;
		},
		enabled: isAuthenticated,
	});

	const flattenedInfiniteEvents = useMemo(() => {
		return (infiniteQuery.data?.pages.flatMap((page) => page.page) ?? []) as EventDoc[];
	}, [infiniteQuery.data?.pages]);

	const feedEvents = mode === "convex" ? paginated.results : flattenedInfiniteEvents;
	const paginatedStatus = paginated.status;
	const loadMorePaginated = paginated.loadMore;
	const hasNextInfinitePage = infiniteQuery.hasNextPage;
	const isFetchingInfiniteNextPage = infiniteQuery.isFetchingNextPage;
	const fetchNextInfinitePage = infiniteQuery.fetchNextPage;

	const setStarred = useMutation({
		mutationFn: useConvexMutation(api.events.setStarred),
		onMutate: () => {
			setErrorMessage(null);
		},
		onError: (error) => {
			setErrorMessage(getErrorMessage(error));
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["events"] });
		},
	});

	const setArchived = useMutation({
		mutationFn: useConvexMutation(api.events.setArchived),
		onMutate: () => {
			setErrorMessage(null);
		},
		onError: (error) => {
			setErrorMessage(getErrorMessage(error));
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["events"] });
		},
	});

	const seed = useMutation({
		mutationFn: useConvexMutation(api.events.seed),
		onMutate: () => {
			setErrorMessage(null);
			setSeedMessage(null);
		},
		onError: (error) => {
			setErrorMessage(getErrorMessage(error));
		},
		onSuccess: async (data: { created: number }) => {
			setSeedMessage(`Created ${data.created.toLocaleString()} events.`);
			await queryClient.invalidateQueries({ queryKey: ["events"] });
		},
	});

	const rowVirtualizer = useVirtualizer({
		count: feedEvents.length,
		getScrollElement: () => listRef.current,
		estimateSize: () => 92,
		overscan: 8,
	});

	const virtualRows = rowVirtualizer.getVirtualItems();

	useEffect(() => {
		const lastRow = virtualRows.at(-1);
		if (!lastRow) {
			return;
		}
		if (lastRow.index < feedEvents.length - 12) {
			return;
		}

		if (mode === "convex") {
			if (paginatedStatus === "CanLoadMore") {
				loadMorePaginated(80);
			}
			return;
		}

		if (hasNextInfinitePage && !isFetchingInfiniteNextPage) {
			void fetchNextInfinitePage();
		}
	}, [
		virtualRows,
		feedEvents.length,
		mode,
		paginatedStatus,
		loadMorePaginated,
		hasNextInfinitePage,
		isFetchingInfiniteNextPage,
		fetchNextInfinitePage,
	]);

	if (!isAuthenticated || !currentUser) {
		return (
			<div className="mx-auto w-full max-w-4xl px-6 py-16">
				<div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
					<h1 className="mb-3 text-2xl font-semibold text-white">Events Stream</h1>
					<p className="text-slate-300">
						Sign in first to test paginated queries, infinite loading, and virtualized rendering.
					</p>
					<div className="mt-4 flex gap-3">
						<Link
							to="/app"
							className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-white hover:bg-cyan-600"
						>
							Open /app
						</Link>
						<Link
							to="/"
							className="rounded-md bg-slate-700 px-4 py-2 font-medium text-slate-100 hover:bg-slate-600"
						>
							Back Home
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-10">
			<section className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
				<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-2xl font-semibold text-white">Events Stream</h1>
						<p className="text-slate-300">
							Infinite queries with two modes: Convex paginated and TanStack useInfiniteQuery.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setMode("convex")}
							className={
								mode === "convex"
									? "rounded-md bg-cyan-600 px-3 py-2 text-sm font-medium text-white"
									: "rounded-md bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
							}
						>
							Convex
						</button>
						<button
							type="button"
							onClick={() => setMode("tanstack")}
							className={
								mode === "tanstack"
									? "rounded-md bg-cyan-600 px-3 py-2 text-sm font-medium text-white"
									: "rounded-md bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
							}
						>
							TanStack
						</button>
					</div>
				</div>

				<div className="mb-4 flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={() => setShowArchived(false)}
						className={
							showArchived
								? "rounded-md bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
								: "rounded-md bg-cyan-600 px-3 py-2 text-sm font-medium text-white"
						}
					>
						Active
					</button>
					<button
						type="button"
						onClick={() => setShowArchived(true)}
						className={
							showArchived
								? "rounded-md bg-cyan-600 px-3 py-2 text-sm font-medium text-white"
								: "rounded-md bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
						}
					>
						Archived
					</button>

					<label className="ml-2 flex items-center gap-2 text-sm text-slate-200">
						<span>Seed count</span>
						<input
							type="number"
							min={100}
							max={5000}
							step={100}
							value={seedCount}
							onChange={(event) => {
								const parsed = Number(event.target.value);
								if (!Number.isFinite(parsed)) return;
								setSeedCount(Math.max(100, Math.min(5000, Math.floor(parsed))));
							}}
							className="w-24 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-right text-sm text-white"
						/>
					</label>

					<button
						type="button"
						disabled={seed.isPending}
						onClick={() => {
							seed.mutate({ count: seedCount });
						}}
						className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
					>
						{seed.isPending ? "Seeding..." : "Seed Events"}
					</button>

					<button
						type="button"
						onClick={() => {
							setErrorMessage(null);
							setSeedMessage(null);
							void queryClient.invalidateQueries({ queryKey: ["events"] });
						}}
						className="inline-flex items-center gap-2 rounded-md bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
					>
						<RefreshCw size={16} />
						Refresh
					</button>
				</div>

				{seedMessage ? (
					<p className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
						{seedMessage}
					</p>
				) : null}
				{errorMessage ? (
					<p className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
						{errorMessage}
					</p>
				) : null}

				<div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
					<span>Mode: {mode}</span>
					<span>Loaded: {feedEvents.length.toLocaleString()}</span>
					{mode === "convex" ? (
						<span>Status: {paginated.status}</span>
					) : (
						<span>
							Status: {infiniteQuery.status} / pages {infiniteQuery.data?.pages.length ?? 0}
						</span>
					)}
				</div>

				{feedEvents.length === 0 ? (
					<div className="rounded-md border border-slate-700 bg-slate-950/60 px-4 py-6 text-center text-slate-400">
						No events in this view yet. Seed data to test infinite scrolling.
					</div>
				) : (
					<div
						ref={listRef}
						className="h-[68vh] overflow-auto rounded-lg border border-slate-700 bg-slate-950/60"
					>
						<div
							className="relative w-full"
							style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
						>
							{virtualRows.map((virtualRow) => {
								const event = feedEvents[virtualRow.index];
								if (!event) return null;

								const starBusy = setStarred.isPending && setStarred.variables?.id === event._id;
								const archiveBusy =
									setArchived.isPending && setArchived.variables?.id === event._id;
								const rowBusy = starBusy || archiveBusy;

								return (
									<div
										key={String(event._id)}
										ref={rowVirtualizer.measureElement}
										data-index={virtualRow.index}
										className="absolute top-0 left-0 w-full border-b border-slate-800 px-4 py-3"
										style={{ transform: `translateY(${virtualRow.start}px)` }}
									>
										<div className="flex items-center justify-between gap-3">
											<div className="min-w-0">
												<p className="truncate text-sm font-medium text-slate-100">{event.title}</p>
												<div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
													<span className="rounded bg-slate-800 px-2 py-0.5">{event.level}</span>
													<span className="rounded bg-slate-800 px-2 py-0.5">{event.source}</span>
													<span>{formatTimestamp(event.createdAt)}</span>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<button
													type="button"
													disabled={rowBusy}
													onClick={() => {
														setStarred.mutate({
															id: event._id,
															starred: !event.starred,
														});
													}}
													className={
														event.starred
															? "inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-1 text-amber-200 hover:bg-amber-500/30 disabled:opacity-60"
															: "inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-slate-300 hover:bg-slate-700 disabled:opacity-60"
													}
												>
													<Star size={14} />
													{event.starred ? "Starred" : "Star"}
												</button>

												<button
													type="button"
													disabled={rowBusy}
													onClick={() => {
														setArchived.mutate({
															id: event._id,
															archived: !event.archived,
														});
													}}
													className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-slate-300 hover:bg-slate-700 disabled:opacity-60"
												>
													{event.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
													{event.archived ? "Restore" : "Archive"}
												</button>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}

				<div className="mt-3 flex items-center justify-between">
					<p className="text-xs text-slate-400">
						Scroll near bottom to auto-load next page, or use the button.
					</p>
					<button
						type="button"
						disabled={
							mode === "convex"
								? paginated.status !== "CanLoadMore"
								: !infiniteQuery.hasNextPage || infiniteQuery.isFetchingNextPage
						}
						onClick={() => {
							if (mode === "convex") {
								paginated.loadMore(80);
								return;
							}
							void infiniteQuery.fetchNextPage();
						}}
						className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600 disabled:opacity-50"
					>
						{mode === "convex" ? (
							paginated.status === "LoadingMore" ? (
								<span className="inline-flex items-center gap-2">
									<Loader2 size={14} className="animate-spin" /> Loading...
								</span>
							) : (
								"Load More"
							)
						) : infiniteQuery.isFetchingNextPage ? (
							<span className="inline-flex items-center gap-2">
								<Loader2 size={14} className="animate-spin" /> Loading...
							</span>
						) : (
							"Load More"
						)}
					</button>
				</div>
			</section>
		</div>
	);
}

function formatTimestamp(timestamp: number) {
	return new Intl.DateTimeFormat("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		month: "short",
		day: "numeric",
	}).format(timestamp);
}

function getErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}
	return "Event operation failed.";
}
