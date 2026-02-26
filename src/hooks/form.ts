import { createFormHook } from "@tanstack/react-form";

import { SubmitButton, TextField } from "@/components/form-fields";

import { fieldContext, formContext } from "./form-context";

export const { useAppForm, withForm } = createFormHook({
	fieldComponents: {
		TextField,
	},
	formComponents: {
		SubmitButton,
	},
	fieldContext,
	formContext,
});
