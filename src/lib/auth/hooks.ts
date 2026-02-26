import { authClient } from "./client";

export function useCurrentUser() {
	const session = authClient.useSession();
	return session.data?.user ?? null;
}

export function useSessionState() {
	return authClient.useSession();
}
