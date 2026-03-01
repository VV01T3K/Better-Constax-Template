import type { QueryClient } from "@tanstack/react-query";

import { staticCRPC } from "./crpc";

const AUTH_STATE_STALE_TIME_MS = 30_000;

export type AuthIdentity = {
	userId: string;
} | null;

const getBaseAuthIdentityQueryOptions = () => staticCRPC.func.session.me.staticQueryOptions({});

export const getAuthIdentityQueryOptions = () => ({
	...getBaseAuthIdentityQueryOptions(),
	staleTime: AUTH_STATE_STALE_TIME_MS,
});

export const getAuthIdentityQueryKey = () => getBaseAuthIdentityQueryOptions().queryKey;

export const getCachedAuthIdentity = (queryClient: QueryClient): AuthIdentity | undefined =>
	queryClient.getQueryData<AuthIdentity>(getAuthIdentityQueryKey());

export const isAuthenticatedFromIdentity = (
	identity: AuthIdentity | undefined,
): boolean | undefined => {
	if (identity === undefined) {
		return undefined;
	}

	return identity !== null;
};

export const ensureAuthIdentity = (queryClient: QueryClient): Promise<AuthIdentity> =>
	queryClient.ensureQueryData(getAuthIdentityQueryOptions());

export const warmAuthIdentity = (queryClient: QueryClient) => {
	void ensureAuthIdentity(queryClient).catch(() => undefined);
};

export const invalidateAuthIdentity = async (queryClient: QueryClient) => {
	const queryKey = getAuthIdentityQueryKey();
	await queryClient.cancelQueries({ queryKey });
	queryClient.removeQueries({ queryKey, exact: true });
};

export const setSignedOutAuthIdentity = async (queryClient: QueryClient) => {
	await queryClient.cancelQueries({ queryKey: getAuthIdentityQueryKey() });
	queryClient.setQueryData(getAuthIdentityQueryKey(), null);
};
