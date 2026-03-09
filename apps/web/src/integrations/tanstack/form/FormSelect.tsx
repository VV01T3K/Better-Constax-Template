import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@repo/ui/components/field";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import type { ComponentProps } from "react";

import { useFieldContext } from "./hooks";

type FieldErrorLike = {
	message?: string;
};

type SelectOption = {
	label: string;
	value: string;
};

export type FormSelectProps = Omit<
	ComponentProps<"button">,
	"children" | "defaultValue" | "name" | "onBlur" | "onChange" | "type" | "value"
> & {
	autoComplete?: string;
	disabled?: boolean;
	label: string;
	description?: string;
	options: ReadonlyArray<SelectOption>;
	placeholder?: string;
	required?: boolean;
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

export function FormSelect({
	className,
	description,
	label,
	options,
	placeholder = "Select an option",
	...props
}: FormSelectProps) {
	const field = useFieldContext<string | null | undefined>();
	const errors = toFieldErrors(field.state.meta.errors);
	const isInvalid = field.state.meta.isTouched && errors.length > 0;

	return (
		<Field data-invalid={isInvalid}>
			<FieldLabel htmlFor={field.name}>{label}</FieldLabel>
			<FieldContent>
				<Select<string>
					{...props}
					id={field.name}
					name={field.name}
					value={field.state.value === "" ? null : (field.state.value ?? null)}
					onOpenChange={(open) => {
						if (!open) {
							field.handleBlur();
						}
					}}
					onValueChange={(value) => field.handleChange(value)}
				>
					<SelectTrigger className={className} aria-invalid={isInvalid}>
						<SelectValue placeholder={placeholder} />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{options.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				{description ? <FieldDescription>{description}</FieldDescription> : null}
				<FieldError errors={errors} />
			</FieldContent>
		</Field>
	);
}
