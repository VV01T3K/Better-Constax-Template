import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@repo/ui/components/field";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from "@repo/ui/components/item";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowDown,
	ArrowUp,
	BriefcaseBusiness,
	Building2,
	CalendarRange,
	Check,
	CircleAlert,
	Loader2,
	Plus,
	Rocket,
	ShieldCheck,
	Trash2,
	Users,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { z } from "zod";

import { useAppForm } from "../../integrations/tanstack/form";

export const Route = createFileRoute("/demo/tanstack-form")({
	component: TanStackFormDemoPage,
});

const industryOptions = [
	{ label: "Fintech", value: "fintech" },
	{ label: "Health", value: "health" },
	{ label: "Logistics", value: "logistics" },
	{ label: "Retail", value: "retail" },
	{ label: "Public sector", value: "public-sector" },
] as const;

const projectTypeOptions = [
	{ label: "Greenfield launch", value: "greenfield" },
	{ label: "Platform migration", value: "migration" },
	{ label: "Internal operations tool", value: "ops" },
	{ label: "Customer portal refresh", value: "refresh" },
] as const;

const budgetOptions = [
	{ label: "Under $25k", value: "under-25k" },
	{ label: "$25k - $75k", value: "25k-75k" },
	{ label: "$75k - $150k", value: "75k-150k" },
	{ label: "$150k+", value: "150k-plus" },
] as const;

const teamSizeOptions = [
	{ label: "1 - 3 people", value: "1-3" },
	{ label: "4 - 8 people", value: "4-8" },
	{ label: "9 - 15 people", value: "9-15" },
	{ label: "16+ people", value: "16-plus" },
] as const;

const stakeholderRoleOptions = [
	{ label: "Executive sponsor", value: "executive-sponsor" },
	{ label: "Product lead", value: "product-lead" },
	{ label: "Engineering manager", value: "engineering-manager" },
	{ label: "Compliance lead", value: "compliance-lead" },
] as const;

const successMetricOptions = [
	{
		label: "Reduce manual operations",
		value: "ops-efficiency",
		description: "Automate repeated back-office workflows.",
	},
	{
		label: "Ship a new customer experience",
		value: "customer-launch",
		description: "Launch a materially new surface area for end users.",
	},
	{
		label: "Retire a legacy system",
		value: "legacy-retirement",
		description: "Move teams off an incumbent platform without regressions.",
	},
	{
		label: "Improve security posture",
		value: "security-upgrade",
		description: "Add stronger controls, observability, or auditability.",
	},
] as const;

const integrationOptions = [
	{ label: "Okta", value: "okta" },
	{ label: "Microsoft Entra", value: "entra" },
	{ label: "Salesforce", value: "salesforce" },
	{ label: "Stripe", value: "stripe" },
	{ label: "Snowflake", value: "snowflake" },
] as const;

const regionOptions = [
	{ label: "United States", value: "us" },
	{ label: "European Union", value: "eu" },
	{ label: "United Kingdom", value: "uk" },
	{ label: "Canada", value: "ca" },
] as const;

const stakeholderSchema = z.object({
	name: z.string().trim().min(2, "Stakeholder name is required."),
	role: z.enum(stakeholderRoleOptions.map((option) => option.value)),
	email: z.email("Enter a valid stakeholder email."),
	decisionMaker: z.boolean(),
});

const milestoneSchema = z.object({
	name: z.string().trim().min(3, "Milestone name is required."),
	owner: z.string().trim().min(2, "Assign an owner."),
	dueDate: z.string().min(1, "Pick a due date."),
	critical: z.boolean(),
});

const intakeSchema = z
	.object({
		companyName: z.string().trim().min(2, "Company name is required."),
		website: z
			.string()
			.trim()
			.refine((value) => value.length === 0 || /^https?:\/\//.test(value), {
				message: "Use a full URL starting with http:// or https://.",
			}),
		contactName: z.string().trim().min(2, "Primary contact is required."),
		contactEmail: z.email("Enter a valid work email."),
		industry: z.enum(
			industryOptions.map((option) => option.value),
			{
				message: "Choose an industry.",
			},
		),
		projectType: z.enum(
			projectTypeOptions.map((option) => option.value),
			{
				message: "Choose a project type.",
			},
		),
		budgetBand: z.enum(
			budgetOptions.map((option) => option.value),
			{
				message: "Choose a budget band.",
			},
		),
		teamSize: z.enum(
			teamSizeOptions.map((option) => option.value),
			{
				message: "Choose a team size.",
			},
		),
		kickoffDate: z.string().min(1, "Pick a kickoff date."),
		launchDate: z.string().min(1, "Pick a target launch date."),
		summary: z
			.string()
			.trim()
			.min(60, "Provide enough detail for planning. Aim for at least 60 characters.")
			.max(400, "Keep the brief concise."),
		requiresSso: z.boolean(),
		handlesPii: z.boolean(),
		complianceOwner: z.string().trim(),
		successMetrics: z
			.array(z.enum(successMetricOptions.map((option) => option.value)))
			.min(2, "Select at least two success metrics."),
		integrations: z
			.array(z.enum(integrationOptions.map((option) => option.value)))
			.min(1, "Select at least one integration to model."),
		regions: z.array(z.enum(regionOptions.map((option) => option.value))),
		stakeholders: z
			.array(stakeholderSchema)
			.min(1, "Add at least one stakeholder.")
			.max(4, "Keep the initial working group to four people."),
		milestones: z.array(milestoneSchema).min(2, "Add at least two milestones."),
		approvedToProceed: z.boolean().refine((value) => value, {
			message: "Confirm that the intake is ready for review.",
		}),
	})
	.superRefine((value, ctx) => {
		const kickoff = Date.parse(value.kickoffDate);
		const launch = Date.parse(value.launchDate);

		if (!Number.isNaN(kickoff) && !Number.isNaN(launch) && launch <= kickoff) {
			ctx.addIssue({
				code: "custom",
				message: "Launch date must be after kickoff.",
				path: ["launchDate"],
			});
		}

		if (
			value.requiresSso &&
			!value.integrations.some((integration) => integration === "okta" || integration === "entra")
		) {
			ctx.addIssue({
				code: "custom",
				message: "SSO projects need Okta or Microsoft Entra in scope.",
				path: ["integrations"],
			});
		}

		if (value.handlesPii && value.regions.length === 0) {
			ctx.addIssue({
				code: "custom",
				message: "Select the regions where regulated data will live.",
				path: ["regions"],
			});
		}

		if (value.handlesPii && value.complianceOwner.length < 2) {
			ctx.addIssue({
				code: "custom",
				message: "Name the person who will own compliance review.",
				path: ["complianceOwner"],
			});
		}

		if (value.projectType === "migration" && value.stakeholders.length < 2) {
			ctx.addIssue({
				code: "custom",
				message: "Migration work needs at least two stakeholders for sign-off.",
				path: ["stakeholders"],
			});
		}

		if (
			value.budgetBand === "under-25k" &&
			value.milestones.some((milestone) => milestone.critical)
		) {
			ctx.addIssue({
				code: "custom",
				message: "Critical-path milestones are usually unrealistic in the smallest budget band.",
				path: ["milestones"],
			});
		}

		const seenEmails = new Map<string, number>();
		for (const [index, stakeholder] of value.stakeholders.entries()) {
			const emailKey = stakeholder.email.trim().toLowerCase();
			if (!emailKey) {
				continue;
			}

			const existingIndex = seenEmails.get(emailKey);
			if (existingIndex !== undefined) {
				ctx.addIssue({
					code: "custom",
					message: "Each stakeholder needs a unique email address.",
					path: ["stakeholders", index, "email"],
				});
				ctx.addIssue({
					code: "custom",
					message: "Each stakeholder needs a unique email address.",
					path: ["stakeholders", existingIndex, "email"],
				});
			} else {
				seenEmails.set(emailKey, index);
			}
		}
	});

type IntakeValues = z.infer<typeof intakeSchema>;

type SubmissionSnapshot = {
	planLabel: string;
	readinessScore: number;
	riskFlags: string[];
	submittedAt: string;
	values: IntakeValues;
};

type FieldErrorLike = {
	message?: string;
};

const defaultStakeholder = (): IntakeValues["stakeholders"][number] => ({
	name: "",
	role: "executive-sponsor",
	email: "",
	decisionMaker: true,
});

const defaultMilestone = (name: string): IntakeValues["milestones"][number] => ({
	name,
	owner: "",
	dueDate: "",
	critical: false,
});

const defaultValues: IntakeValues = {
	companyName: "",
	website: "",
	contactName: "",
	contactEmail: "",
	industry: "fintech",
	projectType: "greenfield",
	budgetBand: "25k-75k",
	teamSize: "4-8",
	kickoffDate: "",
	launchDate: "",
	summary: "",
	requiresSso: true,
	handlesPii: false,
	complianceOwner: "",
	successMetrics: ["customer-launch", "security-upgrade"],
	integrations: ["okta"],
	regions: [],
	stakeholders: [defaultStakeholder()],
	milestones: [defaultMilestone("Discovery"), defaultMilestone("Pilot launch")],
	approvedToProceed: false,
};

const toggleValue = <T extends string>(currentValues: T[], value: T, checked: boolean): T[] => {
	if (checked) {
		return currentValues.includes(value) ? currentValues : [...currentValues, value];
	}

	return currentValues.filter((entry) => entry !== value);
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

const getTimelineDays = (kickoffDate: string, launchDate: string) => {
	const kickoff = Date.parse(kickoffDate);
	const launch = Date.parse(launchDate);

	if (Number.isNaN(kickoff) || Number.isNaN(launch)) {
		return null;
	}

	return Math.round((launch - kickoff) / 86_400_000);
};

const getRiskFlags = (values: IntakeValues) => {
	const riskFlags: string[] = [];
	const timelineDays = getTimelineDays(values.kickoffDate, values.launchDate);

	if (timelineDays !== null && timelineDays < 45) {
		riskFlags.push("Timeline is compressed for a multi-milestone delivery.");
	}

	if (!values.stakeholders.some((stakeholder) => stakeholder.decisionMaker)) {
		riskFlags.push("No stakeholder is marked as a decision maker.");
	}

	if (values.handlesPii && !values.regions.includes("eu")) {
		riskFlags.push("PII is enabled but EU hosting coverage is not planned.");
	}

	if (values.projectType === "migration" && !values.successMetrics.includes("legacy-retirement")) {
		riskFlags.push("Migration work should usually track legacy retirement explicitly.");
	}

	if (values.requiresSso && values.budgetBand === "under-25k") {
		riskFlags.push("SSO work is unlikely to fit the smallest budget tier.");
	}

	return riskFlags;
};

const getReadinessScore = (values: IntakeValues) => {
	const checkpoints = [
		values.companyName.trim().length > 1,
		values.contactEmail.trim().length > 1,
		values.summary.trim().length >= 60,
		values.successMetrics.length >= 2,
		values.integrations.length >= 1,
		values.stakeholders.every((stakeholder) => stakeholder.name && stakeholder.email),
		values.milestones.every((milestone) => milestone.name && milestone.owner && milestone.dueDate),
		values.approvedToProceed,
	];

	const completed = checkpoints.filter(Boolean).length;
	return Math.round((completed / checkpoints.length) * 100);
};

const getPlanLabel = (values: IntakeValues) => {
	const typeLabel =
		projectTypeOptions.find((option) => option.value === values.projectType)?.label ?? "Project";
	const integrationCount = values.integrations.length;

	return `${typeLabel} with ${integrationCount} mapped integration${integrationCount === 1 ? "" : "s"}`;
};

function TanStackFormDemoPage() {
	const [submission, setSubmission] = useState<SubmissionSnapshot | null>(null);

	const form = useAppForm({
		defaultValues,
		validators: {
			onChange: intakeSchema,
			onSubmit: intakeSchema,
		},
		onSubmit: async ({ value }) => {
			await new Promise((resolve) => setTimeout(resolve, 900));

			setSubmission({
				planLabel: getPlanLabel(value),
				readinessScore: getReadinessScore(value),
				riskFlags: getRiskFlags(value),
				submittedAt: new Date().toISOString(),
				values: value,
			});
		},
	});

	return (
		<div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
			<div className="flex flex-col gap-4">
				<Card className="overflow-hidden">
					<CardHeader className="border-b">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div className="space-y-1">
								<CardTitle className="text-xl">TanStack Form Delivery Intake</CardTitle>
								<CardDescription>
									A non-trivial demo with wrapper fields, array sections, cross-field validation,
									and live planning feedback.
								</CardDescription>
							</div>
							<div className="flex flex-wrap gap-2">
								<Badge variant="outline">Cross-field rules</Badge>
								<Badge variant="secondary">Repeatable groups</Badge>
								<Badge variant="outline">Async submit</Badge>
							</div>
						</div>
					</CardHeader>
					<CardContent className="pt-4">
						<form
							className="flex flex-col gap-6"
							onSubmit={(event) => {
								event.preventDefault();
								void form.handleSubmit();
							}}
						>
							<div className="grid gap-4 lg:grid-cols-2">
								<form.AppField name="companyName">
									{(field) => (
										<field.FormInput
											label="Company name"
											placeholder="Northstar Capital"
											description="Who is this plan for?"
										/>
									)}
								</form.AppField>
								<form.AppField name="website">
									{(field) => (
										<field.FormInput
											label="Website"
											placeholder="https://northstar.example"
											description="Optional, but useful context for delivery teams."
										/>
									)}
								</form.AppField>
								<form.AppField name="contactName">
									{(field) => <field.FormInput label="Primary contact" placeholder="Avery Stone" />}
								</form.AppField>
								<form.AppField name="contactEmail">
									{(field) => (
										<field.FormInput
											label="Primary contact email"
											type="email"
											placeholder="avery@northstar.example"
										/>
									)}
								</form.AppField>
								<form.AppField name="industry">
									{(field) => <field.FormSelect label="Industry" options={industryOptions} />}
								</form.AppField>
								<form.AppField name="projectType">
									{(field) => (
										<field.FormSelect
											label="Project type"
											options={projectTypeOptions}
											description="Used to tune planning rules and summary output."
										/>
									)}
								</form.AppField>
								<form.AppField name="budgetBand">
									{(field) => <field.FormSelect label="Budget band" options={budgetOptions} />}
								</form.AppField>
								<form.AppField name="teamSize">
									{(field) => <field.FormSelect label="Core team size" options={teamSizeOptions} />}
								</form.AppField>
							</div>

							<div className="grid gap-4 lg:grid-cols-2">
								<form.AppField name="kickoffDate">
									{(field) => <field.FormInput label="Kickoff date" type="date" />}
								</form.AppField>
								<form.AppField name="launchDate">
									{(field) => (
										<field.FormInput
											label="Target launch"
											type="date"
											description="Validated against kickoff to catch impossible timelines."
										/>
									)}
								</form.AppField>
							</div>

							<form.Field name="summary">
								{(field) => {
									const errors = toFieldErrors(field.state.meta.errors);
									const isInvalid = field.state.meta.isTouched && errors.length > 0;

									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Project brief</FieldLabel>
											<FieldContent>
												<Textarea
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(event) => field.handleChange(event.target.value)}
													className="min-h-28"
													aria-invalid={isInvalid}
													placeholder="Describe the user problem, delivery scope, and what success looks like."
												/>
												<FieldDescription>
													Make it concrete enough that an implementation team can estimate risk.
												</FieldDescription>
												<div className="text-muted-foreground text-[11px]">
													{field.state.value.length} / 400 characters
												</div>
												<FieldError errors={errors} />
											</FieldContent>
										</Field>
									);
								}}
							</form.Field>

							<div className="grid gap-4 lg:grid-cols-2">
								<form.Field name="requiresSso">
									{(field) => (
										<Field orientation="horizontal">
											<FieldContent>
												<FieldLabel htmlFor={field.name}>Single sign-on required</FieldLabel>
												<FieldDescription>
													Requires an identity provider integration in scope.
												</FieldDescription>
											</FieldContent>
											<Switch
												id={field.name}
												checked={field.state.value}
												onCheckedChange={(checked) => field.handleChange(checked)}
											/>
										</Field>
									)}
								</form.Field>
								<form.Field name="handlesPii">
									{(field) => (
										<Field orientation="horizontal">
											<FieldContent>
												<FieldLabel htmlFor={field.name}>
													Handles regulated personal data
												</FieldLabel>
												<FieldDescription>
													Enables regional hosting and compliance ownership requirements.
												</FieldDescription>
											</FieldContent>
											<Switch
												id={field.name}
												checked={field.state.value}
												onCheckedChange={(checked) => field.handleChange(checked)}
											/>
										</Field>
									)}
								</form.Field>
							</div>

							<form.Subscribe selector={(state) => state.values.handlesPii}>
								{(handlesPii) =>
									handlesPii ? (
										<form.AppField name="complianceOwner">
											{(field) => (
												<field.FormInput
													label="Compliance review owner"
													placeholder="Jordan Kim"
													description="Required when regulated personal data is in scope."
												/>
											)}
										</form.AppField>
									) : null
								}
							</form.Subscribe>

							<form.Field name="successMetrics">
								{(field) => {
									const errors = toFieldErrors(field.state.meta.errors);
									const isInvalid = field.state.meta.isTouched && errors.length > 0;

									return (
										<FieldSet data-invalid={isInvalid} className="gap-3">
											<FieldLegend>Success metrics</FieldLegend>
											<div className="grid gap-2 md:grid-cols-2">
												{successMetricOptions.map((option) => {
													const checked = field.state.value.includes(option.value);

													return (
														<FieldLabel key={option.value} className="border px-3 py-3">
															<Checkbox
																checked={checked}
																onCheckedChange={(nextChecked) =>
																	field.handleChange(
																		toggleValue(field.state.value, option.value, nextChecked),
																	)
																}
															/>
															<div className="space-y-1">
																<div className="text-xs font-medium">{option.label}</div>
																<p className="text-muted-foreground text-[11px] leading-relaxed">
																	{option.description}
																</p>
															</div>
														</FieldLabel>
													);
												})}
											</div>
											<FieldError errors={errors} />
										</FieldSet>
									);
								}}
							</form.Field>

							<form.Field name="integrations">
								{(field) => {
									const errors = toFieldErrors(field.state.meta.errors);
									const isInvalid = field.state.meta.isTouched && errors.length > 0;

									return (
										<FieldSet data-invalid={isInvalid} className="gap-3">
											<FieldLegend>Integration surface</FieldLegend>
											<div className="grid gap-2 md:grid-cols-2">
												{integrationOptions.map((option) => {
													const checked = field.state.value.includes(option.value);

													return (
														<FieldLabel key={option.value} className="border px-3 py-3">
															<Checkbox
																checked={checked}
																onCheckedChange={(nextChecked) =>
																	field.handleChange(
																		toggleValue(field.state.value, option.value, nextChecked),
																	)
																}
															/>
															<div className="text-xs font-medium">{option.label}</div>
														</FieldLabel>
													);
												})}
											</div>
											<FieldError errors={errors} />
										</FieldSet>
									);
								}}
							</form.Field>

							<form.Subscribe selector={(state) => state.values.handlesPii}>
								{(handlesPii) =>
									handlesPii ? (
										<form.Field name="regions">
											{(field) => {
												const errors = toFieldErrors(field.state.meta.errors);
												const isInvalid = field.state.meta.isTouched && errors.length > 0;

												return (
													<FieldSet data-invalid={isInvalid} className="gap-3">
														<FieldLegend>Hosting regions</FieldLegend>
														<div className="grid gap-2 md:grid-cols-2">
															{regionOptions.map((option) => {
																const checked = field.state.value.includes(option.value);

																return (
																	<FieldLabel key={option.value} className="border px-3 py-3">
																		<Checkbox
																			checked={checked}
																			onCheckedChange={(nextChecked) =>
																				field.handleChange(
																					toggleValue(field.state.value, option.value, nextChecked),
																				)
																			}
																		/>
																		<div className="text-xs font-medium">{option.label}</div>
																	</FieldLabel>
																);
															})}
														</div>
														<FieldError errors={errors} />
													</FieldSet>
												);
											}}
										</form.Field>
									) : null
								}
							</form.Subscribe>

							<form.Field name="stakeholders">
								{(field) => {
									const errors = toFieldErrors(field.state.meta.errors);

									return (
										<FieldSet className="gap-3">
											<div className="flex flex-wrap items-center justify-between gap-2">
												<div className="space-y-1">
													<FieldLegend>Stakeholders</FieldLegend>
													<FieldDescription>
														Repeatable rows using TanStack Form array helpers.
													</FieldDescription>
												</div>
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => field.pushValue(defaultStakeholder())}
													disabled={field.state.value.length >= 4}
												>
													<Plus />
													Add stakeholder
												</Button>
											</div>
											<div className="grid gap-3">
												{field.state.value.map((_, index) => (
													<Card key={index} size="sm" className="bg-background/50">
														<CardContent className="grid gap-3 pt-3 md:grid-cols-2">
															<form.AppField name={`stakeholders[${index}].name`}>
																{(nestedField) => (
																	<nestedField.FormInput label="Name" placeholder="Riley Chen" />
																)}
															</form.AppField>
															<form.AppField name={`stakeholders[${index}].role`}>
																{(nestedField) => (
																	<nestedField.FormSelect
																		label="Role"
																		options={stakeholderRoleOptions}
																	/>
																)}
															</form.AppField>
															<form.AppField name={`stakeholders[${index}].email`}>
																{(nestedField) => (
																	<nestedField.FormInput
																		label="Email"
																		type="email"
																		placeholder="riley@example.com"
																	/>
																)}
															</form.AppField>
															<form.Field name={`stakeholders[${index}].decisionMaker`}>
																{(nestedField) => (
																	<Field orientation="horizontal">
																		<FieldContent>
																			<FieldLabel htmlFor={nestedField.name}>
																				Decision maker
																			</FieldLabel>
																			<FieldDescription>
																				Used in the risk model shown on the right.
																			</FieldDescription>
																		</FieldContent>
																		<Switch
																			id={nestedField.name}
																			checked={nestedField.state.value}
																			onCheckedChange={(checked) =>
																				nestedField.handleChange(checked)
																			}
																		/>
																	</Field>
																)}
															</form.Field>
															<div className="flex justify-end md:col-span-2">
																<Button
																	type="button"
																	variant="destructive"
																	size="sm"
																	onClick={() => field.removeValue(index)}
																>
																	<Trash2 />
																	Remove stakeholder
																</Button>
															</div>
														</CardContent>
													</Card>
												))}
											</div>
											<FieldError errors={errors} />
										</FieldSet>
									);
								}}
							</form.Field>

							<form.Field name="milestones">
								{(field) => {
									const errors = toFieldErrors(field.state.meta.errors);

									return (
										<FieldSet className="gap-3">
											<div className="flex flex-wrap items-center justify-between gap-2">
												<div className="space-y-1">
													<FieldLegend>Milestones</FieldLegend>
													<FieldDescription>
														Reorderable array items with row-level controls.
													</FieldDescription>
												</div>
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => field.pushValue(defaultMilestone("Readiness review"))}
												>
													<Plus />
													Add milestone
												</Button>
											</div>
											<div className="grid gap-3">
												{field.state.value.map((_, index) => (
													<Item key={index} variant="outline" className="gap-3">
														<ItemContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_160px]">
															<form.AppField name={`milestones[${index}].name`}>
																{(nestedField) => (
																	<nestedField.FormInput
																		label="Milestone"
																		placeholder="Security review"
																	/>
																)}
															</form.AppField>
															<form.AppField name={`milestones[${index}].owner`}>
																{(nestedField) => (
																	<nestedField.FormInput
																		label="Owner"
																		placeholder="Platform team"
																	/>
																)}
															</form.AppField>
															<form.AppField name={`milestones[${index}].dueDate`}>
																{(nestedField) => (
																	<nestedField.FormInput label="Due date" type="date" />
																)}
															</form.AppField>
															<form.Field name={`milestones[${index}].critical`}>
																{(nestedField) => (
																	<Field orientation="horizontal" className="md:col-span-3">
																		<FieldContent>
																			<FieldLabel htmlFor={nestedField.name}>
																				Critical path milestone
																			</FieldLabel>
																			<FieldDescription>
																				Used by the validator to flag underscoped budgets.
																			</FieldDescription>
																		</FieldContent>
																		<Switch
																			id={nestedField.name}
																			checked={nestedField.state.value}
																			onCheckedChange={(checked) =>
																				nestedField.handleChange(checked)
																			}
																		/>
																	</Field>
																)}
															</form.Field>
														</ItemContent>
														<ItemActions className="ml-auto">
															<Button
																type="button"
																variant="outline"
																size="icon-xs"
																onClick={() => field.moveValue(index, index - 1)}
																disabled={index === 0}
																aria-label="Move milestone up"
															>
																<ArrowUp />
															</Button>
															<Button
																type="button"
																variant="outline"
																size="icon-xs"
																onClick={() => field.moveValue(index, index + 1)}
																disabled={index === field.state.value.length - 1}
																aria-label="Move milestone down"
															>
																<ArrowDown />
															</Button>
															<Button
																type="button"
																variant="destructive"
																size="icon-xs"
																onClick={() => field.removeValue(index)}
																aria-label="Remove milestone"
															>
																<Trash2 />
															</Button>
														</ItemActions>
													</Item>
												))}
											</div>
											<FieldError errors={errors} />
										</FieldSet>
									);
								}}
							</form.Field>

							<form.Field name="approvedToProceed">
								{(field) => {
									const errors = toFieldErrors(field.state.meta.errors);
									const isInvalid = field.state.meta.isTouched && errors.length > 0;

									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel className="border px-3 py-3">
												<Checkbox
													checked={field.state.value}
													onCheckedChange={(checked) => field.handleChange(checked)}
												/>
												<div className="space-y-1">
													<div className="text-xs font-medium">Ready for delivery review</div>
													<p className="text-muted-foreground text-[11px] leading-relaxed">
														Confirms that the sponsor and implementation team can review this plan.
													</p>
												</div>
											</FieldLabel>
											<FieldError errors={errors} />
										</Field>
									);
								}}
							</form.Field>

							<form.Subscribe
								selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty] as const}
							>
								{([canSubmit, isSubmitting, isDirty]) => (
									<div className="flex flex-wrap items-center gap-3 border-t pt-4">
										<Button type="submit" disabled={!canSubmit || isSubmitting}>
											{isSubmitting ? <Loader2 className="animate-spin" /> : <Rocket />}
											Generate delivery plan
										</Button>
										<Button
											type="button"
											variant="outline"
											onClick={() => {
												form.reset(defaultValues);
												setSubmission(null);
											}}
										>
											Reset
										</Button>
										<div className="text-muted-foreground text-[11px]">
											{isDirty
												? "Unsaved changes in progress."
												: "Form matches the default scenario."}
										</div>
									</div>
								)}
							</form.Subscribe>
						</form>
					</CardContent>
				</Card>
			</div>

			<div className="flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
				<form.Subscribe selector={(state) => state.values}>
					{(values) => {
						const readinessScore = getReadinessScore(values);
						const riskFlags = getRiskFlags(values);
						const timelineDays = getTimelineDays(values.kickoffDate, values.launchDate);

						return (
							<Card>
								<CardHeader className="border-b">
									<CardTitle className="text-sm">Live plan summary</CardTitle>
									<CardDescription>
										Derived directly from form state through `form.Subscribe`.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4 pt-4">
									<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
										<MetricCard
											icon={<Building2 className="size-4" />}
											label="Readiness"
											value={`${readinessScore}%`}
											help="Based on core fields, repeatable sections, and final approval."
										/>
										<MetricCard
											icon={<CalendarRange className="size-4" />}
											label="Timeline"
											value={timelineDays === null ? "Pending" : `${timelineDays} days`}
											help="Calculated from kickoff to target launch."
										/>
										<MetricCard
											icon={<Users className="size-4" />}
											label="Stakeholders"
											value={String(values.stakeholders.length)}
											help="Used to validate review coverage."
										/>
										<MetricCard
											icon={<BriefcaseBusiness className="size-4" />}
											label="Plan shape"
											value={getPlanLabel(values)}
											help="A concise summary of scope and integration count."
										/>
									</div>

									<div className="space-y-2">
										<div className="flex items-center gap-2 text-xs font-medium">
											<ShieldCheck className="size-4" />
											Risk flags
										</div>
										{riskFlags.length === 0 ? (
											<Item variant="muted">
												<Check className="text-primary" />
												<ItemContent>
													<ItemTitle>No immediate planning red flags</ItemTitle>
													<ItemDescription>
														The current inputs are internally consistent.
													</ItemDescription>
												</ItemContent>
											</Item>
										) : (
											riskFlags.map((riskFlag) => (
												<Item key={riskFlag} variant="outline">
													<CircleAlert className="text-destructive size-4" />
													<ItemContent>
														<ItemTitle>{riskFlag}</ItemTitle>
													</ItemContent>
												</Item>
											))
										)}
									</div>
								</CardContent>
							</Card>
						);
					}}
				</form.Subscribe>

				{submission ? (
					<Card>
						<CardHeader className="border-b">
							<CardTitle className="text-sm">Last submitted snapshot</CardTitle>
							<CardDescription>
								Generated on {new Date(submission.submittedAt).toLocaleString()}.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3 pt-4">
							<Item variant="muted">
								<Rocket className="text-primary size-4" />
								<ItemContent>
									<ItemTitle>{submission.planLabel}</ItemTitle>
									<ItemDescription>
										{submission.values.companyName} with {submission.values.milestones.length}{" "}
										milestones and {submission.values.integrations.length} modeled integrations.
									</ItemDescription>
								</ItemContent>
							</Item>
							<Item variant="outline">
								<Users className="size-4" />
								<ItemContent>
									<ItemTitle>Decision coverage</ItemTitle>
									<ItemDescription>
										{
											submission.values.stakeholders.filter(
												(stakeholder) => stakeholder.decisionMaker,
											).length
										}{" "}
										decision maker(s) marked for review.
									</ItemDescription>
								</ItemContent>
							</Item>
							<Item variant="outline">
								<ShieldCheck className="size-4" />
								<ItemContent>
									<ItemTitle>Risk count</ItemTitle>
									<ItemDescription>
										{submission.riskFlags.length === 0
											? "No active risk flags."
											: `${submission.riskFlags.length} active risk flag(s).`}
									</ItemDescription>
								</ItemContent>
							</Item>
						</CardContent>
					</Card>
				) : null}
			</div>
		</div>
	);
}

function MetricCard({
	help,
	icon,
	label,
	value,
}: {
	help: string;
	icon: ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div className="bg-background/60 grid gap-1 border p-3">
			<div className="text-muted-foreground flex items-center gap-2 text-[11px] tracking-[0.12em] uppercase">
				{icon}
				{label}
			</div>
			<div className="text-sm font-medium">{value}</div>
			<div className="text-muted-foreground text-[11px] leading-relaxed">{help}</div>
		</div>
	);
}
