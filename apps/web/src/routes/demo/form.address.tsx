import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { submitAddressFormSchema } from "@repo/backend/convex/schemas";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { useAppForm } from "@/hooks/demo.form";
import { protectedRouteLoader } from "@/lib/route-guard-kit";

const currentUserQuery = convexQuery(api.auth.getCurrentUser, {});
const submissionsQuery = convexQuery(api.functions.addressForms.listMine, { limit: 10 });

export const Route = createFileRoute("/demo/form/address")({
	loader: async ({ context, location }) => {
		await protectedRouteLoader({
			queryClient: context.queryClient,
			permission: "demo.address-form.access",
			redirectHref: location.href,
			prefetch: () => context.queryClient.ensureQueryData(submissionsQuery),
		});
	},
	component: AddressForm,
});

function AddressForm() {
	const { data: currentUser } = useSuspenseQuery(currentUserQuery);
	const { data: submissions } = useSuspenseQuery(submissionsQuery);
	const queryClient = useQueryClient();
	const [submitError, setSubmitError] = useState<string | null>(null);

	const submitAddressForm = useMutation({
		mutationFn: useConvexMutation(api.functions.addressForms.submit),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: submissionsQuery.queryKey });
		},
	});

	const form = useAppForm({
		defaultValues: {
			fullName: currentUser?.name ?? "",
			email: currentUser?.email ?? "",
			address: {
				street: "",
				city: "",
				state: "",
				zipCode: "",
				country: "US",
			},
			phone: "",
		},
		validators: {
			onBlur: ({ value }) => {
				const errors = {
					fields: {},
				} as {
					fields: Record<string, string>;
				};
				if (value.fullName.trim().length === 0) {
					errors.fields.fullName = "Full name is required";
				}
				return errors;
			},
		},
		onSubmit: async ({ value }) => {
			setSubmitError(null);

			const parsed = submitAddressFormSchema.safeParse(value);
			if (!parsed.success) {
				setSubmitError(parsed.error.issues[0]?.message ?? "Invalid form data");
				return;
			}

			await submitAddressForm.mutateAsync(parsed.data).catch((error: unknown) => {
				setSubmitError(error instanceof Error ? error.message : "Failed to submit form");
			});
		},
	});

	return (
		<div
			className="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-100 to-blue-100 p-4 text-white"
			style={{
				backgroundImage:
					"radial-gradient(50% 50% at 5% 40%, #f4a460 0%, #8b4513 70%, #1a0f0a 100%)",
			}}
		>
			<div className="w-full max-w-3xl rounded-xl border-8 border-black/10 bg-black/80 p-8 shadow-xl">
				<div className="mb-6 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
					Submitting to Convex as {currentUser?.email ?? currentUser?.subject}
				</div>

				{submitError && (
					<div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
						{submitError}
					</div>
				)}

				<form
					action={() => {
						void form.handleSubmit();
					}}
					className="space-y-6"
				>
					<form.AppField name="fullName">
						{(field) => <field.TextField label="Full Name" />}
					</form.AppField>

					<form.AppField
						name="email"
						validators={{
							onBlur: ({ value }) => {
								if (!value || value.trim().length === 0) {
									return "Email is required";
								}
								if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
									return "Invalid email address";
								}
								return undefined;
							},
						}}
					>
						{(field) => <field.TextField label="Email" />}
					</form.AppField>

					<form.AppField
						name="address.street"
						validators={{
							onBlur: ({ value }) => {
								if (!value || value.trim().length === 0) {
									return "Street address is required";
								}
								return undefined;
							},
						}}
					>
						{(field) => <field.TextField label="Street Address" />}
					</form.AppField>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<form.AppField
							name="address.city"
							validators={{
								onBlur: ({ value }) => {
									if (!value || value.trim().length === 0) {
										return "City is required";
									}
									return undefined;
								},
							}}
						>
							{(field) => <field.TextField label="City" />}
						</form.AppField>
						<form.AppField
							name="address.state"
							validators={{
								onBlur: ({ value }) => {
									if (!value || value.trim().length === 0) {
										return "State is required";
									}
									return undefined;
								},
							}}
						>
							{(field) => <field.TextField label="State" />}
						</form.AppField>
						<form.AppField
							name="address.zipCode"
							validators={{
								onBlur: ({ value }) => {
									if (!value || value.trim().length === 0) {
										return "Zip code is required";
									}
									if (!/^\d{5}(-\d{4})?$/.test(value)) {
										return "Invalid zip code format";
									}
									return undefined;
								},
							}}
						>
							{(field) => <field.TextField label="Zip Code" />}
						</form.AppField>
					</div>

					<form.AppField
						name="address.country"
						validators={{
							onBlur: ({ value }) => {
								if (!value || value.trim().length === 0) {
									return "Country is required";
								}
								return undefined;
							},
						}}
					>
						{(field) => (
							<field.Select
								label="Country"
								values={[
									{ label: "United States", value: "US" },
									{ label: "Canada", value: "CA" },
									{ label: "United Kingdom", value: "UK" },
									{ label: "Australia", value: "AU" },
									{ label: "Germany", value: "DE" },
									{ label: "France", value: "FR" },
									{ label: "Japan", value: "JP" },
								]}
							/>
						)}
					</form.AppField>

					<form.AppField
						name="phone"
						validators={{
							onBlur: ({ value }) => {
								if (!value || value.trim().length === 0) {
									return "Phone number is required";
								}
								if (!/^(\+\d{1,3})?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(value)) {
									return "Invalid phone number format";
								}
								return undefined;
							},
						}}
					>
						{(field) => <field.TextField label="Phone" placeholder="123-456-7890" />}
					</form.AppField>

					<div className="flex items-center justify-between">
						<div className="text-sm text-cyan-100">
							{submissions.length} submission{submissions.length === 1 ? "" : "s"} stored in Convex
						</div>
						<form.AppForm>
							<form.SubscribeButton
								label={submitAddressForm.isPending ? "Submitting..." : "Submit"}
							/>
						</form.AppForm>
					</div>
				</form>

				<div className="mt-6 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4">
					<p className="mb-3 text-sm font-semibold text-cyan-100">Recent submissions</p>
					{submissions.length === 0 ? (
						<p className="text-sm text-cyan-200/80">No submissions yet.</p>
					) : (
						<div className="space-y-2">
							{submissions.map((submission) => (
								<div
									key={submission._id}
									className="rounded-md border border-cyan-400/20 bg-black/20 p-3"
								>
									<p className="text-sm font-medium text-cyan-100">
										{submission.fullName} ({submission.email})
									</p>
									<p className="text-xs text-cyan-200/80">
										{submission.address.street}, {submission.address.city},{" "}
										{submission.address.state} {submission.address.zipCode},{" "}
										{submission.address.country}
									</p>
									<p className="text-xs text-cyan-200/80">
										{new Date(submission.submittedAt).toISOString()}
									</p>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
