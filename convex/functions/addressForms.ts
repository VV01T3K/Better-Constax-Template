import { z } from "zod";

import {
	AddressListInputSchema,
	AddressSubmissionDocSchema,
	SubmitAddressFormInputSchema,
} from "../../src/lib/schemas";
import { authMutation, publicQuery } from "../lib/crpc";

export const list = publicQuery
	.input(AddressListInputSchema)
	.output(z.array(AddressSubmissionDocSchema))
	.query(async ({ ctx, input }) => {
		const limit = input.limit ?? 20;
		return await ctx.db.query("addressSubmissions").order("desc").take(limit);
	});

export const submit = authMutation
	.input(SubmitAddressFormInputSchema)
	.output(AddressSubmissionDocSchema)
	.mutation(async ({ ctx, input }) => {
		const id = await ctx.db.insert("addressSubmissions", {
			fullName: input.fullName.trim(),
			email: input.email.trim().toLowerCase(),
			address: {
				street: input.address.street.trim(),
				city: input.address.city.trim(),
				state: input.address.state.trim(),
				zipCode: input.address.zipCode.trim(),
				country: input.address.country.trim(),
			},
			phone: input.phone.trim(),
			submittedAt: Date.now(),
			ownerUserId: ctx.userId,
		});

		const created = await ctx.db.get(id);
		if (!created) {
			throw new Error("Created submission not found");
		}
		return created;
	});
