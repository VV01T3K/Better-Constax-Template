import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

import { FormInput } from "./FormInput";
import { FormSelect } from "./FormSelect";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

export const { useAppForm, useTypedAppFormContext, withFieldGroup, withForm } = createFormHook({
	fieldComponents: {
		FormInput,
		FormSelect,
	},
	fieldContext,
	formComponents: {},
	formContext,
});
