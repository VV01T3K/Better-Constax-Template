import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { LoginForm } from "../../components/login-form";
import { useSignInMutationOptions } from "../../integrations/convex/auth-client";
import {
	DEFAULT_REDIRECT_TARGET,
	type RedirectTarget,
	sanitizeRedirectTarget,
} from "../../integrations/convex/auth-redirect";
import { refreshAuthIdentityUntilAuthenticated } from "../../integrations/convex/auth-state";

type LoginSearch = {
	redirect: RedirectTarget;
};

export const Route = createFileRoute("/auth/login")({
	validateSearch: (search: Record<string, unknown>): LoginSearch => {
		return { redirect: sanitizeRedirectTarget(search.redirect) };
	},
	component: LoginPage,
});

function LoginPage() {
	const { redirect: redirectSearch } = Route.useSearch();
	const queryClient = useQueryClient();
	const router = useRouter();
	const redirectTarget = sanitizeRedirectTarget(redirectSearch ?? DEFAULT_REDIRECT_TARGET);

	const completeAuthAndNavigate = async (failureMessage: string) => {
		const authIdentity = await refreshAuthIdentityUntilAuthenticated(queryClient);
		if (!authIdentity) {
			throw new Error(failureMessage);
		}
		await router.navigate({ href: redirectTarget, replace: true });
	};

	const signInMutation = useMutation(
		useSignInMutationOptions({
			onSuccess: async () => {
				await completeAuthAndNavigate("We couldn't complete sign-in yet. Please try again.");
			},
		}),
	);

	return (
		<div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<LoginForm
					onSubmit={async (data) => {
						await signInMutation.mutateAsync(data);
					}}
					isPending={signInMutation.isPending}
					errorMessage={signInMutation.error?.message ?? null}
				/>
			</div>
		</div>
	);
}
