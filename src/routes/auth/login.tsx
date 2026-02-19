import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { signInSchema, signUpSchema } from "@convex/schemas";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/auth/login")({
	component: LoginPage,
});

const inputClass =
	"w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400";

function LoginPage() {
	const [isSignUp, setIsSignUp] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);
	const queryClient = useQueryClient();
	const router = useRouter();
	const search = router.state.location.search as { redirect?: unknown };
	const safeRedirect =
		typeof search.redirect === "string" && search.redirect.startsWith("/") ? search.redirect : "/";
	const currentUserQuery = convexQuery(api.auth.getCurrentUser, {});

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			setServerError(null);

			const schema = isSignUp ? signUpSchema : signInSchema;
			const data = isSignUp
				? { name: value.name, email: value.email, password: value.password }
				: { email: value.email, password: value.password };
			const result = schema.safeParse(data);
			if (!result.success) {
				setServerError(result.error.issues[0]?.message ?? "Invalid input");
				return;
			}

			const callbacks = {
				onSuccess: async () => {
					await queryClient.invalidateQueries({ queryKey: currentUserQuery.queryKey });
					await router.invalidate();
					router.history.push(safeRedirect);
				},
				onError: (ctx: { error: { message?: string } }) => {
					setServerError(ctx.error.message ?? `Sign ${isSignUp ? "up" : "in"} failed`);
				},
			};

			if (isSignUp) {
				await authClient.signUp.email(
					{ email: value.email, password: value.password, name: value.name },
					callbacks,
				);
			} else {
				await authClient.signIn.email({ email: value.email, password: value.password }, callbacks);
			}
		},
	});

	return (
		<div className="flex min-h-screen items-center justify-center bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 p-4">
			<div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-8">
				<h1 className="mb-6 text-center text-3xl font-bold text-white">
					{isSignUp ? "Create Account" : "Sign In"}
				</h1>

				{serverError && (
					<div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-300">
						{serverError}
					</div>
				)}

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4"
				>
					{isSignUp && (
						<form.Field
							name="name"
							validators={{
								onBlur: ({ value }) => {
									if (!value || value.trim().length === 0) return "Name is required";
									return undefined;
								},
							}}
						>
							{(field) => (
								<div>
									<input
										type="text"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										placeholder="Full name"
										className={inputClass}
									/>
									{field.state.meta.isTouched && field.state.meta.errors[0] && (
										<p className="mt-1 text-sm text-red-400">{field.state.meta.errors[0]}</p>
									)}
								</div>
							)}
						</form.Field>
					)}

					<form.Field
						name="email"
						validators={{
							onBlur: ({ value }) => {
								const result = signInSchema.shape.email.safeParse(value);
								if (!result.success) return result.error.issues[0]?.message;
								return undefined;
							},
						}}
					>
						{(field) => (
							<div>
								<input
									type="text"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									placeholder="Email address"
									autoComplete="email"
									className={inputClass}
								/>
								{field.state.meta.isTouched && field.state.meta.errors[0] && (
									<p className="mt-1 text-sm text-red-400">{field.state.meta.errors[0]}</p>
								)}
							</div>
						)}
					</form.Field>

					<form.Field
						name="password"
						validators={{
							onBlur: ({ value }) => {
								const schema = isSignUp ? signUpSchema.shape.password : signInSchema.shape.password;
								const result = schema.safeParse(value);
								if (!result.success) return result.error.issues[0]?.message;
								return undefined;
							},
						}}
					>
						{(field) => (
							<div>
								<input
									type="password"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									placeholder="Password"
									autoComplete={isSignUp ? "new-password" : "current-password"}
									className={inputClass}
								/>
								{field.state.meta.isTouched && field.state.meta.errors[0] && (
									<p className="mt-1 text-sm text-red-400">{field.state.meta.errors[0]}</p>
								)}
							</div>
						)}
					</form.Field>

					<button
						type="submit"
						disabled={form.state.isSubmitting}
						className="w-full rounded-lg bg-cyan-500 py-3 font-semibold text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
					>
						{form.state.isSubmitting ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
					</button>
				</form>

				<p className="mt-6 text-center text-sm text-slate-400">
					{isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
					<button
						type="button"
						onClick={() => {
							setIsSignUp(!isSignUp);
							setServerError(null);
							form.reset();
						}}
						className="font-medium text-cyan-400 hover:text-cyan-300"
					>
						{isSignUp ? "Sign In" : "Sign Up"}
					</button>
				</p>
			</div>
		</div>
	);
}
