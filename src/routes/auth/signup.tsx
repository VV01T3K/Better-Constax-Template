import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { z } from "zod";

import { SignupForm } from "@/components/signup-form";

const signupSearchSchema = z.object({
	redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/signup")({
	validateSearch: signupSearchSchema,
	component: SignupPage,
});

function SignupPage() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const search = Route.useSearch();
	const safeRedirect = search.redirect?.startsWith("/") ? search.redirect : "/";
	const currentUserQuery = convexQuery(api.auth.getCurrentUser, {});

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<SignupForm
				className="w-full max-w-md"
				onSuccess={async () => {
					await queryClient.invalidateQueries({ queryKey: currentUserQuery.queryKey });
					await router.invalidate();
					router.history.push(safeRedirect);
				}}
			/>
		</div>
	);
}
