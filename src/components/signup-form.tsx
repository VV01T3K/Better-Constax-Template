import { signUpSchema } from "@convex/schemas";
import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SignupForm({
	className,
	onSuccess,
	...props
}: React.ComponentProps<"div"> & {
	onSuccess: () => Promise<void>;
}) {
	const [serverError, setServerError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			setServerError(null);

			if (value.password !== value.confirmPassword) {
				setServerError("Passwords do not match");
				return;
			}

			const result = signUpSchema.safeParse({
				name: value.name,
				email: value.email,
				password: value.password,
			});
			if (!result.success) {
				setServerError(result.error.issues[0]?.message ?? "Invalid input");
				return;
			}

			const { authClient } = await import("@/lib/auth-client");
			await authClient.signUp.email(
				{ email: value.email, password: value.password, name: value.name },
				{
					onSuccess: async () => {
						await onSuccess();
					},
					onError: (ctx: { error: { message?: string } }) => {
						setServerError(ctx.error.message ?? "Sign up failed");
					},
				},
			);
		},
	});

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-xl">Create your account</CardTitle>
					<CardDescription>Enter your details below to create your account</CardDescription>
				</CardHeader>
				<CardContent>
					{serverError && (
						<div className="bg-destructive/15 text-destructive mb-4 rounded-lg border p-3 text-sm">
							{serverError}
						</div>
					)}
					<form
						action={() => {
							void form.handleSubmit();
						}}
					>
						<FieldGroup>
							<form.Field
								name="name"
								validators={{
									onBlur: ({ value }) => {
										if (!value || value.trim().length === 0) return "Name is required";
										return undefined;
									},
								}}
							>
								{(field) => {
									const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={invalid || undefined}>
											<FieldLabel htmlFor="name">Full Name</FieldLabel>
											<Input
												id="name"
												type="text"
												placeholder="John Doe"
												autoComplete="name"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												aria-invalid={invalid || undefined}
											/>
											{invalid && <FieldError>{field.state.meta.errors[0]}</FieldError>}
										</Field>
									);
								}}
							</form.Field>

							<form.Field
								name="email"
								validators={{
									onBlur: ({ value }) => {
										const res = signUpSchema.shape.email.safeParse(value);
										if (!res.success) return res.error.issues[0]?.message;
										return undefined;
									},
								}}
							>
								{(field) => {
									const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={invalid || undefined}>
											<FieldLabel htmlFor="email">Email</FieldLabel>
											<Input
												id="email"
												type="email"
												placeholder="m@example.com"
												autoComplete="email"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												aria-invalid={invalid || undefined}
											/>
											{invalid && <FieldError>{field.state.meta.errors[0]}</FieldError>}
										</Field>
									);
								}}
							</form.Field>

							<Field>
								<Field className="grid grid-cols-2 gap-4">
									<form.Field
										name="password"
										validators={{
											onBlur: ({ value }) => {
												const res = signUpSchema.shape.password.safeParse(value);
												if (!res.success) return res.error.issues[0]?.message;
												return undefined;
											},
										}}
									>
										{(field) => {
											const invalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={invalid || undefined}>
													<FieldLabel htmlFor="password">Password</FieldLabel>
													<Input
														id="password"
														type="password"
														autoComplete="new-password"
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
														onBlur={field.handleBlur}
														aria-invalid={invalid || undefined}
													/>
													{invalid && (
														<FieldError>{field.state.meta.errors[0]}</FieldError>
													)}
												</Field>
											);
										}}
									</form.Field>

									<form.Field
										name="confirmPassword"
										validators={{
											onBlur: ({ value, fieldApi }) => {
												const password = fieldApi.form.getFieldValue("password");
												if (value !== password) return "Passwords do not match";
												return undefined;
											},
										}}
									>
										{(field) => {
											const invalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={invalid || undefined}>
													<FieldLabel htmlFor="confirm-password">
														Confirm Password
													</FieldLabel>
													<Input
														id="confirm-password"
														type="password"
														autoComplete="new-password"
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
														onBlur={field.handleBlur}
														aria-invalid={invalid || undefined}
													/>
													{invalid && (
														<FieldError>{field.state.meta.errors[0]}</FieldError>
													)}
												</Field>
											);
										}}
									</form.Field>
								</Field>
								<FieldDescription>Must be at least 8 characters long.</FieldDescription>
							</Field>

							<Field>
								<Button type="submit" disabled={form.state.isSubmitting}>
									{form.state.isSubmitting ? "Creating account..." : "Create Account"}
								</Button>
								<FieldDescription className="text-center">
									Already have an account?{" "}
									<Link to="/auth/login" className="underline underline-offset-4 hover:text-primary">
										Sign in
									</Link>
								</FieldDescription>
							</Field>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
			<FieldDescription className="px-6 text-center">
				By clicking continue, you agree to our <a href="#">Terms of Service</a> and{" "}
				<a href="#">Privacy Policy</a>.
			</FieldDescription>
		</div>
	);
}
