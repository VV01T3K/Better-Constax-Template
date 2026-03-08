import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import type { ComponentProps } from "react";

import { useFieldContext } from "./hooks";

type FieldErrorLike = {
	message?: string;
};

export type FormInputProps = Omit<
	ComponentProps<typeof Input>,
	"defaultValue" | "name" | "onBlur" | "onChange" | "value"
> & {
	label: string;
	description?: string;
};

const toFieldErrors = (errors: unknown[]) =>
	errors.flatMap((error) => {
		if (typeof error === "string") {
			return [{ message: error }] satisfies FieldErrorLike[];
		}

		if (
			typeof error === "object" &&
			error !== null &&
			"message" in error &&
			typeof error.message === "string"
		) {
			return [{ message: error.message }] satisfies FieldErrorLike[];
		}

		return [];
	});

export function FormInput({ description, label, type = "text", ...props }: FormInputProps) {
	const field = useFieldContext<string | null | undefined>();
	const errors = toFieldErrors(field.state.meta.errors);
	const isInvalid = field.state.meta.isTouched && errors.length > 0;

	return (
		<Field data-invalid={isInvalid}>
			<FieldLabel htmlFor={field.name}>{label}</FieldLabel>
			<FieldContent>
				<Input
					{...props}
					id={field.name}
					name={field.name}
					type={type}
					value={field.state.value ?? ""}
					onBlur={field.handleBlur}
					onChange={(event) => field.handleChange(event.target.value)}
					aria-invalid={isInvalid}
				/>
				{description ? <FieldDescription>{description}</FieldDescription> : null}
				<FieldError errors={errors} />
			</FieldContent>
		</Field>
	);
}
