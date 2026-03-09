import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { SignupForm } from "../../components/signup-form";
import { useSignUpMutationOptions } from "../../integrations/convex/auth-client";
import {
	DEFAULT_REDIRECT_TARGET,
	type RedirectTarget,
	sanitizeRedirectTarget,
} from "../../integrations/convex/auth-redirect";
import {
	markAuthenticatedAuthIdentity,
	refreshAuthIdentityUntilAuthenticated,
} from "../../integrations/convex/auth-state";

type AuthResponseUser = {
	id?: string | null;
	name?: string | null;
	email?: string | null;
};

const getAuthResponseUser = (result: unknown): AuthResponseUser | null => {
	if (typeof result !== "object" || result === null || !("data" in result)) {
		return null;
	}

	const data = result.data;
	if (typeof data !== "object" || data === null || !("user" in data)) {
		return null;
	}

	const user = data.user;
	return typeof user === "object" && user !== null ? (user as AuthResponseUser) : null;
};

type SignupSearch = {
	redirect: RedirectTarget;
};

export const Route = createFileRoute("/auth/signup")({
	validateSearch: (search: Record<string, unknown>): SignupSearch => {
		return { redirect: sanitizeRedirectTarget(search.redirect) };
	},
	component: SignupPage,
});

function SignupPage() {
	const { redirect: redirectSearch } = Route.useSearch();
	const queryClient = useQueryClient();
	const router = useRouter();
	const redirectTarget = sanitizeRedirectTarget(redirectSearch ?? DEFAULT_REDIRECT_TARGET);

	const completeAuthAndNavigate = async (result: unknown) => {
		const user = getAuthResponseUser(result);

		if (typeof user?.id === "string" && user.id.length > 0) {
			await markAuthenticatedAuthIdentity(queryClient, {
				userId: user.id,
				name: user.name?.trim() || user.email?.trim() || "User",
			});
			void refreshAuthIdentityUntilAuthenticated(queryClient).catch(() => undefined);
		}

		await router.invalidate();
		await router.navigate({ href: redirectTarget, replace: true });
	};

	const signUpMutation = useMutation(
		useSignUpMutationOptions({
			onSuccess: async (result) => {
				await completeAuthAndNavigate(result);
			},
		}),
	);

	return (
		<div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<SignupForm
					onSubmit={async (data) => {
						await signUpMutation.mutateAsync(data);
					}}
					isPending={signUpMutation.isPending}
					errorMessage={signUpMutation.error?.message ?? null}
				/>
			</div>
		</div>
	);
}
