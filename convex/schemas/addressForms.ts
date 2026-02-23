import { z } from "zod";

import { authUserIdSchema } from "./ids";

export const addressSchema = z.object({
	street: z.string().min(1, "Street address is required"),
	city: z.string().min(1, "City is required"),
	state: z.string().min(1, "State is required"),
	zipCode: z
		.string()
		.min(1, "Zip code is required")
		.regex(/^\d{5}(-\d{4})?$/, "Invalid zip code format"),
	country: z.string().min(1, "Country is required"),
});

export const addressFormSubmissionSchema = z.object({
	authUserId: authUserIdSchema,
	fullName: z.string().min(1, "Full name is required"),
	email: z.email("Invalid email address"),
	address: addressSchema,
	phone: z
		.string()
		.min(1, "Phone number is required")
		.regex(/^(\+\d{1,3})?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, "Invalid phone number format"),
	submittedAt: z.number(),
});

export const submitAddressFormSchema = addressFormSubmissionSchema.pick({
	fullName: true,
	email: true,
	address: true,
	phone: true,
});
