import { Login01Icon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import {
	useSignInMutationOptions,
	useSignUpMutationOptions,
} from "../integrations/convex/auth-client";
import {
	DEFAULT_REDIRECT_TARGET,
	type RedirectTarget,
	sanitizeRedirectTarget,
} from "../integrations/convex/auth-redirect";
import {
	ensureAuthIdentity,
	refreshAuthIdentityUntilAuthenticated,
} from "../integrations/convex/auth-state";

type AuthSearch = {
	redirect: RedirectTarget;
};

export const Route = createFileRoute("/auth")({
	validateSearch: (search: Record<string, unknown>): AuthSearch => {
		return { redirect: sanitizeRedirectTarget(search.redirect) };
	},
	beforeLoad: async ({ context, search }) => {
		const redirectTo = sanitizeRedirectTarget(search.redirect);

		const authIdentity = await ensureAuthIdentity(context.queryClient);

		if (authIdentity) {
			throw redirect({ href: redirectTo });
		}
	},
	component: AuthPage,
});

function AuthPage() {
	const { redirect: redirectSearch } = Route.useSearch();
	const queryClient = useQueryClient();
	const router = useRouter();
	const redirectTarget = sanitizeRedirectTarget(redirectSearch ?? DEFAULT_REDIRECT_TARGET);

	const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

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

	const signUpMutation = useMutation(
		useSignUpMutationOptions({
			onSuccess: async () => {
				await completeAuthAndNavigate("We couldn't complete sign-up yet. Please try again.");
			},
		}),
	);

	const isPending = signInMutation.isPending || signUpMutation.isPending;
	const errorMessage = signInMutation.error?.message ?? signUpMutation.error?.message ?? null;

	return (
		<div
			className="flex min-h-screen items-center justify-center p-4"
			style={{
				background: "linear-gradient(140deg, #0f172a 0%, #1e293b 40%, #334155 100%)",
			}}
		>
			<div className="w-full max-w-md rounded-2xl border border-slate-600/60 bg-slate-900/85 p-8 shadow-2xl backdrop-blur">
				<h1 className="mb-2 text-3xl font-bold text-white">Welcome Back</h1>
				<p className="mb-8 text-sm text-slate-300">Authenticate to access your protected todos.</p>

				<div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-800 p-1">
					<button
						type="button"
						onClick={() => setMode("sign-in")}
						className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
							mode === "sign-in" ? "bg-cyan-500 text-white" : "text-slate-300 hover:text-white"
						}`}
					>
						Sign In
					</button>
					<button
						type="button"
						onClick={() => setMode("sign-up")}
						className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
							mode === "sign-up" ? "bg-cyan-500 text-white" : "text-slate-300 hover:text-white"
						}`}
					>
						Sign Up
					</button>
				</div>

				<form
					className="space-y-4"
					onSubmit={async (e) => {
						e.preventDefault();
						if (mode === "sign-in") {
							await signInMutation.mutateAsync({ email, password });
							return;
						}

						await signUpMutation.mutateAsync({
							email,
							password,
							name: name.trim(),
						});
					}}
				>
					{mode === "sign-up" && (
						<input
							required
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Name"
							className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
						/>
					)}
					<input
						required
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="Email"
						className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
					/>
					<input
						required
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Password"
						className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
					/>

					<button
						type="submit"
						disabled={isPending}
						className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-slate-600"
					>
						{mode === "sign-in" ? (
							<HugeiconsIcon icon={Login01Icon} size={18} strokeWidth={2} />
						) : (
							<HugeiconsIcon icon={UserAdd01Icon} size={18} strokeWidth={2} />
						)}
						{isPending ? "Please wait..." : mode === "sign-in" ? "Sign In" : "Create Account"}
					</button>
				</form>

				{errorMessage && (
					<p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
						{errorMessage}
					</p>
				)}
			</div>
		</div>
	);
}
