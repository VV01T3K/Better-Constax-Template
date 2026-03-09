export const DEFAULT_REDIRECT_TARGET = "/";

export type RedirectTarget = string;

type LocationLike = {
	pathname?: string;
	searchStr?: string;
	search?: unknown;
	hash?: string;
};

type MatchLike = {
	routeId?: string;
	id?: string;
};

const ensurePrefixed = (value: string, prefix: "?" | "#") => {
	if (!value) {
		return "";
	}

	return value.startsWith(prefix) ? value : `${prefix}${value}`;
};

export const sanitizeRedirectTarget = (raw: unknown): RedirectTarget => {
	if (typeof raw !== "string") {
		return DEFAULT_REDIRECT_TARGET;
	}

	const value = raw.trim();

	if (!value.startsWith("/") || value.startsWith("//")) {
		return DEFAULT_REDIRECT_TARGET;
	}

	return value;
};

export const getRedirectTargetFromRouterLocation = (location: LocationLike): RedirectTarget => {
	const pathname =
		typeof location.pathname === "string" && location.pathname.length > 0
			? location.pathname
			: DEFAULT_REDIRECT_TARGET;
	const searchStr = typeof location.searchStr === "string" ? location.searchStr : "";
	const hash = typeof location.hash === "string" ? location.hash : "";

	return sanitizeRedirectTarget(
		`${pathname}${ensurePrefixed(searchStr, "?")}${ensurePrefixed(hash, "#")}`,
	);
};

export const getAuthRedirectSearch = (redirect: RedirectTarget) => ({
	redirect: sanitizeRedirectTarget(redirect),
});

export const isAuthPath = (pathname: string) => pathname.startsWith("/auth");

export const getAuthRouteNavigateOptions = (redirect: RedirectTarget) => ({
	to: "/auth/login" as const,
	search: getAuthRedirectSearch(redirect),
	replace: true,
});

export const isProtectedRouteMatch = (matches: readonly MatchLike[]) =>
	matches.some((match) => {
		const routeId = match.routeId ?? match.id;

		return (
			typeof routeId === "string" &&
			(routeId === "/_app/_authenticated" || routeId.startsWith("/_app/_authenticated/"))
		);
	});
