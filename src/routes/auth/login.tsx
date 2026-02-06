import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "../../lib/auth-client";

export const Route = createFileRoute("/auth/login")({
	component: LoginPage,
});

function LoginPage() {
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const callbacks = {
			onSuccess: () => {
				window.location.href = "/";
			},
			onError: (ctx: { error: { message?: string } }) => {
				setError(ctx.error.message ?? `Sign ${isSignUp ? "up" : "in"} failed`);
				setLoading(false);
			},
		};

		if (isSignUp) {
			await authClient.signUp.email({ email, password, name }, callbacks);
		} else {
			await authClient.signIn.email({ email, password }, callbacks);
		}
	};

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

				<form onSubmit={handleSubmit} className="space-y-4">
					{isSignUp && (
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Full name"
							required={isSignUp}
							className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
						/>
					)}
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="Email address"
						required
						autoComplete="email"
						className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
					/>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Password"
						required
						autoComplete={isSignUp ? "new-password" : "current-password"}
						className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
					/>
					<button
						type="submit"
						disabled={loading}
						className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
					>
						{loading
							? "Loading..."
							: isSignUp
								? "Sign Up"
								: "Sign In"}
					</button>
				</form>

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
