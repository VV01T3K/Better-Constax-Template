import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { LogIn, UserPlus } from "lucide-react";
import { useState } from "react";

import {
	useSignInMutationOptions,
	useSignUpMutationOptions,
} from "../integrations/convex/auth-client";
import {
	ensureAuthIdentity,
	refreshAuthIdentity,
} from "../integrations/convex/auth-state";

type AuthSearch = {
	redirect?: string;
};

const DEFAULT_REDIRECT = "/demo/convex";

export const Route = createFileRoute("/auth")({
	validateSearch: (search: Record<string, unknown>): AuthSearch => ({
		redirect: typeof search.redirect === "string" ? search.redirect : DEFAULT_REDIRECT,
	}),
	beforeLoad: async ({ context, search }) => {
		const redirectTo =
			typeof search.redirect === "string" && search.redirect.startsWith("/")
				? search.redirect
				: DEFAULT_REDIRECT;

		const authIdentity = await ensureAuthIdentity(context.queryClient);

		if (authIdentity) {
			throw redirect({ to: redirectTo });
		}
	},
	component: AuthPage,
});

function AuthPage() {
	const { redirect: redirectSearch } = Route.useSearch();
	const queryClient = useQueryClient();
	const router = useRouter();
	const redirectTo =
		typeof redirectSearch === "string" && redirectSearch.startsWith("/")
			? redirectSearch
			: DEFAULT_REDIRECT;

	const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const signInMutation = useMutation(
		useSignInMutationOptions({
			onSuccess: async () => {
				await refreshAuthIdentity(queryClient);
				await router.invalidate();
				await router.navigate({ to: redirectTo });
			},
		}),
	);

	const signUpMutation = useMutation(
		useSignUpMutationOptions({
			onSuccess: async () => {
				await refreshAuthIdentity(queryClient);
				await router.invalidate();
				await router.navigate({ to: redirectTo });
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
							name: name.trim() || email.split("@")[0] || "User",
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
						{mode === "sign-in" ? <LogIn size={18} /> : <UserPlus size={18} />}
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
