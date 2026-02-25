import { useStore } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useFieldContext, useFormContext } from "@/hooks/form-context";

export function TextField({
	label,
	placeholder,
	type = "text",
	autoComplete,
}: {
	label: string;
	placeholder?: string;
	type?: string;
	autoComplete?: string;
}) {
	const field = useFieldContext<string>();
	const errors = useStore(field.store, (state) => state.meta.errors);
	const invalid = field.state.meta.isTouched && errors.length > 0;

	return (
		<Field data-invalid={invalid || undefined}>
			<FieldLabel>{label}</FieldLabel>
			<Input
				type={type}
				placeholder={placeholder}
				autoComplete={autoComplete}
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
				onBlur={field.handleBlur}
				aria-invalid={invalid || undefined}
			/>
			{invalid && <FieldError>{errors[0]}</FieldError>}
		</Field>
	);
}

export function SubmitButton({
	label,
	loadingLabel,
}: {
	label: string;
	loadingLabel?: string;
}) {
	const form = useFormContext();
	return (
		<form.Subscribe selector={(state) => state.isSubmitting}>
			{(isSubmitting) => (
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? (loadingLabel ?? "Submitting...") : label}
				</Button>
			)}
		</form.Subscribe>
	);
}
