import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { submitAddressFormSchema } from "@convex/schemas";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppForm } from "@/hooks/demo.form";

const submissionsQuery = convexQuery(api.functions.addressForms.listMine, { limit: 10 });

export const Route = createFileRoute("/demo/form/address")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(submissionsQuery);
	},
	component: AddressForm,
});

function AddressForm() {
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
			fullName: "",
			email: "",
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
		<div className="p-6">
			<div className="mx-auto w-full max-w-4xl space-y-6">
				{submitError ? (
					<Alert variant="destructive">
						<AlertDescription>{submitError}</AlertDescription>
					</Alert>
				) : null}

				<Card>
					<CardHeader>
						<CardTitle>Address Form</CardTitle>
						<CardDescription>
							{submissions.length} submission{submissions.length === 1 ? "" : "s"} stored in Convex
						</CardDescription>
					</CardHeader>
					<CardContent>
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

							<div className="flex items-center justify-end">
								<form.AppForm>
									<form.SubscribeButton
										label={submitAddressForm.isPending ? "Submitting..." : "Submit"}
									/>
								</form.AppForm>
							</div>
						</form>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Recent Submissions</CardTitle>
						<CardDescription>
							Last {submissions.length} submitted entr{submissions.length === 1 ? "y" : "ies"}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{submissions.length === 0 ? (
							<p className="text-muted-foreground text-sm">No submissions yet.</p>
						) : (
							<div className="space-y-2">
								{submissions.map((submission) => (
									<div key={submission._id} className="rounded-md border p-3">
										<p className="text-foreground text-sm font-medium">
											{submission.fullName} ({submission.email})
										</p>
										<p className="text-muted-foreground text-xs">
											{submission.address.street}, {submission.address.city},{" "}
											{submission.address.state} {submission.address.zipCode},{" "}
											{submission.address.country}
										</p>
										<p className="text-muted-foreground text-xs">
											{new Date(submission.submittedAt).toISOString()}
										</p>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
