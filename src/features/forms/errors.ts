import { ZodError } from "zod";

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const asStringArray = (value: unknown): string[] => {
	if (typeof value === "string") {
		return value.trim().length > 0 ? [value] : [];
	}

	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((item) => (typeof item === "string" ? item : null))
		.filter((item): item is string => Boolean(item && item.trim().length > 0));
};

const asFieldErrorMap = (value: unknown): Record<string, string[]> | undefined => {
	if (!isRecord(value)) {
		return undefined;
	}

	const entries = Object.entries(value).flatMap(([key, rawMessages]) => {
		const messages = asStringArray(rawMessages);
		return messages.length > 0 ? [[key, messages] as const] : [];
	});

	if (entries.length === 0) {
		return undefined;
	}

	return Object.fromEntries(entries);
};

const getNested = (record: Record<string, unknown>, key: string): unknown => {
	if (!(key in record)) {
		return undefined;
	}

	return record[key];
};

const getPrimaryMessage = (error: unknown): string | null => {
	if (error instanceof Error && error.message.trim().length > 0) {
		return error.message;
	}

	if (!isRecord(error)) {
		return null;
	}

	const directMessage = getNested(error, "message");
	if (typeof directMessage === "string" && directMessage.trim().length > 0) {
		return directMessage;
	}

	const data = getNested(error, "data");
	if (isRecord(data)) {
		const nestedMessage = getNested(data, "message");
		if (typeof nestedMessage === "string" && nestedMessage.trim().length > 0) {
			return nestedMessage;
		}
	}

	return null;
};

const getFieldErrors = (error: unknown): Record<string, string[]> | undefined => {
	if (error instanceof ZodError) {
		const fieldErrors = error.issues.reduce<Record<string, string[]>>((acc, issue) => {
			const fieldPath = issue.path.join(".") || "form";
			const existing = acc[fieldPath] ?? [];
			return {
				...acc,
				[fieldPath]: [...existing, issue.message],
			};
		}, {});
		return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
	}

	if (!isRecord(error)) {
		return undefined;
	}

	const direct = asFieldErrorMap(getNested(error, "fieldErrors"));
	if (direct) {
		return direct;
	}

	const errors = asFieldErrorMap(getNested(error, "errors"));
	if (errors) {
		return errors;
	}

	const data = getNested(error, "data");
	if (isRecord(data)) {
		const nested = asFieldErrorMap(getNested(data, "fieldErrors"));
		if (nested) {
			return nested;
		}
	}

	return undefined;
};

export type NormalizedFormError = {
	fieldErrors?: Record<string, string[]>;
	formMessage: string | null;
};

export const normalizeFormError = (
	error: unknown,
	fallbackMessage = DEFAULT_ERROR_MESSAGE,
): NormalizedFormError => {
	const fieldErrors = getFieldErrors(error);
	const fieldMessage =
		fieldErrors && Object.keys(fieldErrors).length > 0 ? Object.values(fieldErrors)[0]?.[0] : null;
	const primaryMessage = getPrimaryMessage(error);

	return {
		fieldErrors,
		formMessage: primaryMessage ?? fieldMessage ?? fallbackMessage,
	};
};
