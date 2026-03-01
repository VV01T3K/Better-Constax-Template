export type FormSubmitState = {
	fieldErrors?: Record<string, string[]>;
	formMessage: string | null;
	isSubmitting: boolean;
};
