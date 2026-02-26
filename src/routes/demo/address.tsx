import { type FormEvent, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { isCRPCClientError } from "better-convex";

import { SubmitAddressFormInputSchema } from "@/lib/schemas";
import { useCRPC } from "@/lib/convex/crpc";

export const Route = createFileRoute("/demo/address")({
	component: AddressPage,
});

function AddressPage() {
	const crpc = useCRPC();
	const queryClient = useQueryClient();

	const [error, setError] = useState<string | null>(null);
	const [form, setForm] = useState({
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
	});

	const listQueryOptions = crpc.functions.addressForms.list.queryOptions({ limit: 20 });
	const { data: submissions = [] } = useQuery(listQueryOptions);

	const submitMutation = useMutation({
		...crpc.functions.addressForms.submit.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: listQueryOptions.queryKey });
		},
	});

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);

		const parsed = SubmitAddressFormInputSchema.safeParse(form);
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? "Invalid address form input.");
			return;
		}

		await submitMutation.mutateAsync(parsed.data).catch((cause: unknown) => {
			if (isCRPCClientError(cause)) {
				setError(cause.data?.message ?? "Failed to submit form.");
				return;
			}
			setError(cause instanceof Error ? cause.message : "Failed to submit form.");
		});
	};

	return (
		<section className="space-y-4">
			<h1 className="text-2xl font-semibold">Address Form</h1>
			<p className="text-sm text-muted-foreground">
				Public list, authenticated owner-only submission writes.
			</p>

			<form onSubmit={onSubmit} className="space-y-2 rounded-md border border-border p-4">
				<input
					placeholder="Full Name"
					value={form.fullName}
					onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
					className="w-full rounded-md border border-input bg-background px-3 py-2"
				/>
				<input
					type="email"
					placeholder="Email"
					value={form.email}
					onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
					className="w-full rounded-md border border-input bg-background px-3 py-2"
				/>
				<input
					placeholder="Street"
					value={form.address.street}
					onChange={(event) =>
						setForm((prev) => ({ ...prev, address: { ...prev.address, street: event.target.value } }))
					}
					className="w-full rounded-md border border-input bg-background px-3 py-2"
				/>
				<div className="grid grid-cols-1 gap-2 md:grid-cols-3">
					<input
						placeholder="City"
						value={form.address.city}
						onChange={(event) =>
							setForm((prev) => ({ ...prev, address: { ...prev.address, city: event.target.value } }))
						}
						className="rounded-md border border-input bg-background px-3 py-2"
					/>
					<input
						placeholder="State"
						value={form.address.state}
						onChange={(event) =>
							setForm((prev) => ({ ...prev, address: { ...prev.address, state: event.target.value } }))
						}
						className="rounded-md border border-input bg-background px-3 py-2"
					/>
					<input
						placeholder="Zip"
						value={form.address.zipCode}
						onChange={(event) =>
							setForm((prev) => ({ ...prev, address: { ...prev.address, zipCode: event.target.value } }))
						}
						className="rounded-md border border-input bg-background px-3 py-2"
					/>
				</div>
				<input
					placeholder="Country"
					value={form.address.country}
					onChange={(event) =>
						setForm((prev) => ({ ...prev, address: { ...prev.address, country: event.target.value } }))
					}
					className="w-full rounded-md border border-input bg-background px-3 py-2"
				/>
				<input
					placeholder="Phone"
					value={form.phone}
					onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
					className="w-full rounded-md border border-input bg-background px-3 py-2"
				/>

				<button
					type="submit"
					disabled={submitMutation.isPending}
					className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
				>
					{submitMutation.isPending ? "Submitting..." : "Submit"}
				</button>
			</form>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}

			<ul className="space-y-2">
				{submissions.map((submission) => (
					<li key={submission._id} className="rounded-md border border-border p-3 text-sm">
						<p className="font-medium">
							{submission.fullName} ({submission.email})
						</p>
						<p className="text-muted-foreground">
							{submission.address.street}, {submission.address.city}, {submission.address.state}{" "}
							{submission.address.zipCode}, {submission.address.country}
						</p>
					</li>
				))}
			</ul>
		</section>
	);
}
