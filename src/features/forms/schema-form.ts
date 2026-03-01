import type { z } from "zod";

export type SchemaSubmitContext<TSchema extends z.ZodType> = {
	formApi: { reset: () => void };
	value: z.output<TSchema>;
};

export type SchemaFormConfig<TSchema extends z.ZodType, TValues extends z.input<TSchema>> = {
	defaultValues: TValues;
	onSubmit: (context: SchemaSubmitContext<TSchema>) => Promise<void> | void;
	schema: TSchema;
};

type InternalSubmitContext<TValues> = {
	formApi: { reset: () => void };
	value: TValues;
};

export const createSchemaForm = <TSchema extends z.ZodType, TValues extends z.input<TSchema>>({
	defaultValues,
	onSubmit,
	schema,
}: SchemaFormConfig<TSchema, TValues>) => ({
	defaultValues,
	onSubmit: async ({ formApi, value }: InternalSubmitContext<TValues>) => {
		const parsedValue = schema.parse(value);
		await onSubmit({
			formApi,
			value: parsedValue,
		});
	},
	validators: {
		onChange: schema,
		onMount: schema,
		onSubmit: schema,
	},
});
