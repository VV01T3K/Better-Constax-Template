import { useStore } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFieldContext, useFormContext } from "@/hooks/demo.form-context";

export function SubscribeButton({ label }: { label: string }) {
	const form = useFormContext();
	return (
		<Button type="submit" disabled={form.state.isSubmitting}>
			{label}
		</Button>
	);
}

function ErrorMessages({ errors }: { errors: Array<string | { message: string }> }) {
	return (
		<>
			{errors.map((error) => (
				<p
					key={typeof error === "string" ? error : error.message}
					className="mt-1 text-sm font-medium text-destructive"
				>
					{typeof error === "string" ? error : error.message}
				</p>
			))}
		</>
	);
}

export function TextField({ label, placeholder }: { label: string; placeholder?: string }) {
	const field = useFieldContext<string>();
	const errors = useStore(field.store, (state) => state.meta.errors);

	return (
		<div className="space-y-2">
			<Label htmlFor={label}>{label}</Label>
			<Input
				id={label}
				value={field.state.value}
				placeholder={placeholder}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
			/>
			{field.state.meta.isTouched && <ErrorMessages errors={errors} />}
		</div>
	);
}

export function TextArea({ label, rows = 3 }: { label: string; rows?: number }) {
	const field = useFieldContext<string>();
	const errors = useStore(field.store, (state) => state.meta.errors);

	return (
		<div className="space-y-2">
			<Label htmlFor={label}>{label}</Label>
			<Textarea
				id={label}
				value={field.state.value}
				onBlur={field.handleBlur}
				rows={rows}
				onChange={(e) => field.handleChange(e.target.value)}
			/>
			{field.state.meta.isTouched && <ErrorMessages errors={errors} />}
		</div>
	);
}

export function Select({
	label,
	values,
}: {
	label: string;
	values: Array<{ label: string; value: string }>;
	placeholder?: string;
}) {
	const field = useFieldContext<string>();
	const errors = useStore(field.store, (state) => state.meta.errors);

	return (
		<div className="space-y-2">
			<Label htmlFor={label}>{label}</Label>
			<select
				id={label}
				name={field.name}
				value={field.state.value}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
			>
				{values.map((value) => (
					<option key={value.value} value={value.value}>
						{value.label}
					</option>
				))}
			</select>
			{field.state.meta.isTouched && <ErrorMessages errors={errors} />}
		</div>
	);
}
