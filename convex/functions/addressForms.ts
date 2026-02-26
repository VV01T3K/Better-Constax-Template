import { z } from "zod";

import { requirePermission, zMutation, zQuery } from "../lib/functionHelpers";
import { submitAddressFormSchema } from "../schemas";

export const listMine = zQuery({
	args: {
		limit: z.number().int().positive().max(100).optional(),
	},
	handler: async (ctx, { limit }) => {
		await requirePermission("demo.address-form.access");
		return await ctx.db
			.query("addressSubmissions")
			.order("desc")
			.take(limit ?? 20);
	},
});

export const submit = zMutation({
	args: submitAddressFormSchema.shape,
	handler: async (ctx, args) => {
		await requirePermission("demo.address-form.mutate");
		return await ctx.db.insert("addressSubmissions", {
			fullName: args.fullName.trim(),
			email: args.email.trim().toLowerCase(),
			address: {
				street: args.address.street.trim(),
				city: args.address.city.trim(),
				state: args.address.state.trim(),
				zipCode: args.address.zipCode.trim(),
				country: args.address.country.trim(),
			},
			phone: args.phone.trim(),
			submittedAt: Date.now(),
		});
	},
});
