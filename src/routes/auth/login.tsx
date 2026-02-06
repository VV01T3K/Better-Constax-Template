import { useState, useCallback } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { authClient } from "../../lib/auth-client";

export const Route = createFileRoute("/auth/login")({
	component: LoginPage,
});

function LoginPage() {
	const router = useRouter();
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSignIn = useCallback(async () => {
		setLoading(true);
		setError(null);
		const result = await authClient.signIn.email(
			{
				email,
				password,
			},
			{
				onSuccess: () => {
					router.navigate({ to: "/" });
				},
				onError: (ctx) => {
					setError(ctx.error.message ?? "Sign in failed");
				},
			},
		);
		setLoading(false);
	}, [email, password, router]);

	const handleSignUp = useCallback(async () => {
		setLoading(true);
		setError(null);
		await authClient.signUp.email(
			{
				email,
				password,
				name,
			},
			{
				onSuccess: () => {
					router.navigate({ to: "/" });
				},
				onError: (ctx) => {
					setError(ctx.error.message ?? "Sign up failed");
				},
			},
		);
		setLoading(false);
	}, [email, password, name, router]);

	const handleSubmit = isSignUp ? handleSignUp : handleSignIn;

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4">
			<div className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
				<h1 className="text-3xl font-bold text-white mb-6 text-center">
					{isSignUp ? "Create Account" : "Sign In"}
				</h1>

				{error && (
					<div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
						{error}
					</div>
				)}

				<div className="space-y-4">
					{isSignUp && (
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Full name"
							className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
						/>
					)}
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="Email address"
						className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
					/>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Password"
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSubmit();
						}}
						className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
					/>
					<button
						type="button"
						onClick={handleSubmit}
						disabled={loading || !email || !password}
						className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
					>
						{loading
							? "Loading..."
							: isSignUp
								? "Sign Up"
								: "Sign In"}
					</button>
				</div>

				<p className="mt-6 text-center text-slate-400 text-sm">
					{isSignUp
						? "Already have an account?"
						: "Don't have an account?"}{" "}
					<button
						type="button"
						onClick={() => {
							setIsSignUp(!isSignUp);
							setError(null);
						}}
						className="text-cyan-400 hover:text-cyan-300 font-medium"
					>
						{isSignUp ? "Sign In" : "Sign Up"}
					</button>
				</p>
			</div>
		</div>
	);
}
