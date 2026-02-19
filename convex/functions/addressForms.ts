import { NoOp } from "convex-helpers/server/customFunctions";
import { zCustomMutation, zCustomQuery } from "convex-helpers/server/zod4";
import { ConvexError } from "convex/values";
import { z } from "zod";

import { mutation, query } from "../_generated/server";
import { submitAddressFormSchema } from "../schemas";

const zQuery = zCustomQuery(query, NoOp);
const zMutation = zCustomMutation(mutation, NoOp);

export const listMine = zQuery({
	args: {
		limit: z.number().int().positive().max(100).optional(),
	},
	handler: async (ctx, { limit }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "You must be logged in to view address submissions",
			});
		}

		return await ctx.db
			.query("addressSubmissions")
			.withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
			.order("desc")
			.take(limit ?? 20);
	},
});

export const submit = zMutation({
	args: submitAddressFormSchema.shape,
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "You must be logged in to submit the address form",
			});
		}

		return await ctx.db.insert("addressSubmissions", {
			authUserId: identity.subject,
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
