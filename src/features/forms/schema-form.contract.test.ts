import {
	type SignInInput,
	signInSchema,
	type SignUpInput,
	signUpSchema,
} from "@convex/schemas/auth";
import { describe, expect, expectTypeOf, it } from "vitest";

import { createSchemaForm } from "./schema-form";

describe("createSchemaForm auth schema contract", () => {
	it("supports sign-in schema with inferred submit value type", () => {
		const signInForm = createSchemaForm({
			defaultValues: {
				email: "",
				password: "",
			},
			onSubmit: ({ value }) => {
				expectTypeOf(value).toEqualTypeOf<SignInInput>();
			},
			schema: signInSchema,
		});

		expect(signInForm.validators.onSubmit).toBe(signInSchema);
	});

	it("supports sign-up schema with inferred submit value type", () => {
		const signUpForm = createSchemaForm({
			defaultValues: {
				email: "",
				name: "",
				password: "",
			},
			onSubmit: ({ value }) => {
				expectTypeOf(value).toEqualTypeOf<SignUpInput>();
			},
			schema: signUpSchema,
		});

		expect(signUpForm.validators.onSubmit).toBe(signUpSchema);
	});
});
