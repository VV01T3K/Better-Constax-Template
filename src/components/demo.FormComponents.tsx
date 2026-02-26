import { useStore } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select as UiSelect,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
					className="text-destructive mt-1 text-sm font-medium"
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
			<UiSelect
				name={field.name}
				items={values}
				value={field.state.value || null}
				onValueChange={(value) => field.handleChange(value ?? "")}
			>
				<SelectTrigger id={label} onBlur={field.handleBlur}>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{values.map((value) => (
							<SelectItem key={value.value} value={value.value}>
								{value.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</UiSelect>
			{field.state.meta.isTouched && <ErrorMessages errors={errors} />}
		</div>
	);
}
