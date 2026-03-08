import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { LogIn, UserPlus } from "lucide-react";
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
		<div className="bg-background flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardContent className="flex flex-col gap-6">
					<div>
						<h1 className="text-card-foreground mb-2 text-3xl font-bold">Welcome Back</h1>
						<p className="text-muted-foreground text-sm">
							Authenticate to access your protected todos.
						</p>
					</div>

					<Tabs
						value={mode}
						onValueChange={(v) => {
							if (v === "sign-in" || v === "sign-up") {
								setMode(v);
							}
						}}
					>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="sign-in">Sign In</TabsTrigger>
							<TabsTrigger value="sign-up">Sign Up</TabsTrigger>
						</TabsList>
					</Tabs>

					<form
						className="flex flex-col gap-4"
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
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									required
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Name"
								/>
							</div>
						)}
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								required
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Email"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								required
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Password"
							/>
						</div>

						<Button type="submit" disabled={isPending} className="w-full" size="lg">
							{mode === "sign-in" ? <LogIn size={18} /> : <UserPlus size={18} />}
							{isPending ? "Please wait..." : mode === "sign-in" ? "Sign In" : "Create Account"}
						</Button>
					</form>

					{errorMessage && (
						<div
							role="alert"
							className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
						>
							{errorMessage}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
