import { z } from "zod";

import { authedMutation, authedQuery, getAuthUserId, withIdentity } from "../lib/functionHelpers";
import { submitAddressFormSchema } from "../schemas";

export const listMine = authedQuery({
	args: {
		limit: z.number().int().positive().max(100).optional(),
	},
	handler: withIdentity(async (ctx, { limit }, identity) => {
		const authUserId = getAuthUserId(identity);
		return await ctx.db
			.query("addressSubmissions")
			.withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
			.order("desc")
			.take(limit ?? 20);
	}),
});

export const submit = authedMutation({
	args: submitAddressFormSchema.shape,
	handler: withIdentity(async (ctx, args, identity) => {
		const authUserId = getAuthUserId(identity);
		return await ctx.db.insert("addressSubmissions", {
			authUserId,
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
	}),
});
