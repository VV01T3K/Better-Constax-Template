import { authClient } from "@/lib/auth-client";

const SESSION_RETRY_ATTEMPTS = 6;
const SESSION_RETRY_DELAY_MS = 120;

function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

export async function waitForImpersonationState(options: {
	expectedImpersonating: boolean;
	refetchSession: (params?: {
		query?: {
			disableCookieCache?: boolean;
		};
	}) => Promise<void>;
}) {
	for (let attempt = 0; attempt < SESSION_RETRY_ATTEMPTS; attempt++) {
		await options.refetchSession({
			query: {
				disableCookieCache: true,
			},
		});

		const latestSession = await authClient.getSession({
			query: {
				disableCookieCache: true,
			},
		});
		const isImpersonatingNow = Boolean(latestSession.data?.session?.impersonatedBy);
		if (isImpersonatingNow === options.expectedImpersonating) {
			return true;
		}

		await sleep(SESSION_RETRY_DELAY_MS);
	}

	return false;
}
