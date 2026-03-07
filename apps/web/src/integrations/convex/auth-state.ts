import type { QueryClient } from "@tanstack/react-query";

import { staticCRPC } from "./crpc";

const AUTH_STATE_STALE_TIME_MS = 30_000;
const AUTH_REFRESH_RETRY_ATTEMPTS = 4;
const AUTH_REFRESH_RETRY_DELAY_MS = 75;

export type AuthIdentity = {
	userId: string;
	name: string;
} | null;

export type SignedOutSessionSnapshot = {
	authIdentity: AuthIdentity | undefined;
};

const isSignedOutSessionSnapshot = (value: unknown): value is SignedOutSessionSnapshot =>
	typeof value === "object" && value !== null && "authIdentity" in value;

const getBaseAuthIdentityQueryOptions = () => staticCRPC.func.session.me.staticQueryOptions({});

export const getAuthIdentityQueryOptions = () => ({
	...getBaseAuthIdentityQueryOptions(),
	staleTime: AUTH_STATE_STALE_TIME_MS,
});

const getAuthIdentityQueryKey = () => getBaseAuthIdentityQueryOptions().queryKey;

export const ensureAuthIdentity = (queryClient: QueryClient): Promise<AuthIdentity> =>
	queryClient.ensureQueryData({
		...getAuthIdentityQueryOptions(),
		revalidateIfStale: true,
	});

export const warmAuthIdentity = (queryClient: QueryClient) => {
	void ensureAuthIdentity(queryClient).catch(() => undefined);
};

const refreshAuthIdentity = async (queryClient: QueryClient) => {
	await invalidateAuthIdentity(queryClient);
	return ensureAuthIdentity(queryClient);
};

type RefreshUntilAuthenticatedOptions = {
	maxAttempts?: number;
	retryDelayMs?: number;
};

const sleep = async (ms: number) => {
	await new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
};

export const refreshAuthIdentityUntilAuthenticated = async (
	queryClient: QueryClient,
	options?: RefreshUntilAuthenticatedOptions,
): Promise<AuthIdentity> => {
	const maxAttempts = options?.maxAttempts ?? AUTH_REFRESH_RETRY_ATTEMPTS;
	const retryDelayMs = options?.retryDelayMs ?? AUTH_REFRESH_RETRY_DELAY_MS;

	let authIdentity: AuthIdentity = null;

	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		authIdentity = await refreshAuthIdentity(queryClient);

		if (authIdentity) {
			return authIdentity;
		}

		if (attempt < maxAttempts - 1) {
			await sleep(retryDelayMs);
		}
	}

	return authIdentity;
};

const invalidateAuthIdentity = async (queryClient: QueryClient) => {
	const queryKey = getAuthIdentityQueryKey();
	await queryClient.cancelQueries({ queryKey });
	queryClient.removeQueries({ queryKey, exact: true });
};

export const markSignedOutAuthIdentity = async (queryClient: QueryClient) => {
	const queryKey = getAuthIdentityQueryKey();
	await queryClient.cancelQueries({ queryKey });
	queryClient.setQueryData(queryKey, null);
};

export const prepareSignedOutSession = async (
	queryClient: QueryClient,
): Promise<SignedOutSessionSnapshot> => {
	const queryKey = getAuthIdentityQueryKey();
	const snapshot = {
		authIdentity: queryClient.getQueryData<AuthIdentity>(queryKey),
	};

	await queryClient.cancelQueries();
	queryClient.removeQueries();
	queryClient.setQueryData(queryKey, null);

	return snapshot;
};

export const restoreSignedOutSession = (
	queryClient: QueryClient,
	snapshot: unknown,
) => {
	const queryKey = getAuthIdentityQueryKey();
	const authIdentity = isSignedOutSessionSnapshot(snapshot) ? snapshot.authIdentity : undefined;

	if (authIdentity === undefined) {
		queryClient.removeQueries({ queryKey, exact: true });
		return;
	}

	queryClient.setQueryData(queryKey, authIdentity);
};
