import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@repo/ui/components/field";
import { cn } from "@repo/ui/lib/utils";
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
	ComponentProps<"select">,
	"defaultValue" | "name" | "onBlur" | "onChange" | "value"
> & {
	label: string;
	description?: string;
	options: ReadonlyArray<SelectOption>;
	placeholder?: string;
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
				<select
					{...props}
					id={field.name}
					name={field.name}
					value={field.state.value ?? ""}
					onBlur={field.handleBlur}
					onChange={(event) => field.handleChange(event.target.value)}
					aria-invalid={isInvalid}
					className={cn(
						"border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 h-8 w-full min-w-0 rounded-none border bg-transparent px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-1 md:text-xs",
						className,
					)}
				>
					<option value="" disabled>
						{placeholder}
					</option>
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				{description ? <FieldDescription>{description}</FieldDescription> : null}
				<FieldError errors={errors} />
			</FieldContent>
		</Field>
	);
}
