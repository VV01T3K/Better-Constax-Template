import type { ChangeEvent, ReactNode } from "react";

type FormControlElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

type FieldLike<TValue> = {
	handleBlur: () => void;
	handleChange: (value: TValue | ((previousValue: TValue) => TValue)) => void;
	name: string;
	state: {
		meta: {
			errors: unknown[];
		};
		value: TValue;
	};
};

export type FieldControlRenderProps<TValue> = {
	"aria-invalid": boolean | undefined;
	name: string;
	onBlur: () => void;
	onChange: (event: ChangeEvent<FormControlElement>) => void;
	value: TValue;
};

type FieldControlProps<TValue> = {
	children: (props: FieldControlRenderProps<TValue>) => ReactNode;
	field: FieldLike<TValue>;
	parseValue?: (event: ChangeEvent<FormControlElement>) => TValue;
};

const toMessage = (value: unknown): string | null => {
	if (typeof value === "string") {
		return value;
	}

	if (value instanceof Error) {
		return value.message;
	}

	return null;
};

export const firstErrorMessage = (errors: unknown[] | undefined): string | null => {
	if (!errors || errors.length === 0) {
		return null;
	}

	for (const error of errors) {
		const message = toMessage(error);
		if (message && message.trim().length > 0) {
			return message;
		}
	}

	return null;
};

export function FieldControl<TValue>({
	children,
	field,
	parseValue,
}: FieldControlProps<TValue>): ReactNode {
	const mapValue =
		parseValue ??
		// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- fallback assumes string-compatible TValue when no parseValue is provided
		((event: ChangeEvent<FormControlElement>) => event.target.value as unknown as TValue);

	return children({
		"aria-invalid": field.state.meta.errors.length > 0 ? true : undefined,
		name: field.name,
		onBlur: field.handleBlur,
		onChange: (event) => field.handleChange(mapValue(event)),
		value: field.state.value,
	});
}

type FieldMessageProps = {
	className?: string;
	errors?: unknown[];
	id?: string;
};

export function FieldMessage({ className, errors, id }: FieldMessageProps): ReactNode {
	const message = firstErrorMessage(errors);
	if (!message) {
		return null;
	}

	return (
		<p className={className} id={id} role="alert">
			{message}
		</p>
	);
}

type SubmitStateProps = {
	className?: string;
	errorClassName?: string;
	errorMessage?: string | null;
	isSubmitting: boolean;
	pendingClassName?: string;
	pendingText?: string;
};

export function SubmitState({
	className,
	errorClassName,
	errorMessage,
	isSubmitting,
	pendingClassName,
	pendingText = "Submitting...",
}: SubmitStateProps): ReactNode {
	if (!isSubmitting && !errorMessage) {
		return null;
	}

	return (
		<div className={className}>
			{isSubmitting && (
				<p className={pendingClassName} role="status">
					{pendingText}
				</p>
			)}
			{errorMessage && (
				<p className={errorClassName} role="alert">
					{errorMessage}
				</p>
			)}
		</div>
	);
}
