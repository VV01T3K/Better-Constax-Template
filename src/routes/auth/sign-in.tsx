import { type FormEvent, useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { isCRPCClientError } from "better-convex";

import { SignInInputSchema } from "@/lib/schemas";
import { useSignInMutationOptions } from "@/lib/auth/client";

export const Route = createFileRoute("/auth/sign-in")({
	component: SignInPage,
});

function SignInPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);

	const signIn = useMutation({
		...useSignInMutationOptions({
			onSuccess: () => {
				setError(null);
				navigate({ to: "/" });
			},
		}),
	});

	const onSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		const parsed = SignInInputSchema.safeParse({ email, password });
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? "Invalid credentials.");
			return;
		}

		signIn.mutate(parsed.data, {
			onError: (cause) => {
				if (isCRPCClientError(cause)) {
					setError(cause.data?.message ?? "Sign-in failed.");
					return;
				}
				setError(cause instanceof Error ? cause.message : "Sign-in failed.");
			},
		});
	};

	return (
		<section className="mx-auto max-w-md space-y-4 rounded-xl border border-border p-5">
			<h1 className="text-2xl font-semibold">Sign in</h1>
			<form onSubmit={onSubmit} className="space-y-3">
				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					className="w-full rounded-md border border-input bg-background px-3 py-2"
				/>
				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					className="w-full rounded-md border border-input bg-background px-3 py-2"
				/>
				<button
					type="submit"
					disabled={signIn.isPending}
					className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-70"
				>
					{signIn.isPending ? "Signing in..." : "Sign in"}
				</button>
			</form>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
		</section>
	);
}
