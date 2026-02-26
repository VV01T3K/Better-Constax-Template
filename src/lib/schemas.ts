import { z } from "zod";

export type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type UserId = Brand<string, "user_id">;
export type TodoId = Brand<string, "todo_id">;
export type FileId = Brand<string, "file_id">;
export type AddressSubmissionId = Brand<string, "address_submission_id">;
export type StorageId = Brand<string, "storage_id">;

export const todoShape = {
	text: z.string().min(1, "Text is required"),
	completed: z.boolean(),
	ownerUserId: z.string(),
};

export const fileShape = {
	storageId: z.string(),
	fileName: z.string().min(1, "File name is required"),
	fileType: z.string().min(1, "File type is required"),
	fileSize: z.number().int().nonnegative(),
	detectedFileType: z.string().optional(),
	typeSource: z.enum(["magic-bytes", "extension", "content-sniff"]).optional(),
	ownerUserId: z.string(),
};

export const addressShape = {
	street: z.string().min(1, "Street address is required"),
	city: z.string().min(1, "City is required"),
	state: z.string().min(1, "State is required"),
	zipCode: z.string().min(1, "Zip code is required").regex(/^\d{5}(-\d{4})?$/, "Invalid zip code format"),
	country: z.string().min(1, "Country is required"),
};

export const addressSubmissionShape = {
	fullName: z.string().min(1, "Full name is required"),
	email: z.string().email("Invalid email address"),
	address: z.object(addressShape),
	phone: z
		.string()
		.min(1, "Phone number is required")
		.regex(/^\(?(\+\d{1,3})?\)?\s?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}$/, "Invalid phone number format"),
	submittedAt: z.number(),
	ownerUserId: z.string(),
};

export const TodoDocSchema = z.object({
	_id: z.string(),
	_creationTime: z.number(),
	...todoShape,
});

export const FileDocSchema = z.object({
	_id: z.string(),
	_creationTime: z.number(),
	...fileShape,
});

export const AddressSubmissionDocSchema = z.object({
	_id: z.string(),
	_creationTime: z.number(),
	...addressSubmissionShape,
});

export const FileWithUrlSchema = FileDocSchema.extend({
	url: z.string().nullable(),
});

export const CreateTodoInputSchema = z.object({
	text: todoShape.text,
});

export const ToggleTodoInputSchema = z.object({
	id: z.string(),
});

export const RemoveTodoInputSchema = z.object({
	id: z.string(),
});

export const SaveFileInputSchema = z.object({
	storageId: fileShape.storageId,
	fileName: fileShape.fileName,
	fileType: fileShape.fileType,
	fileSize: fileShape.fileSize,
	detectedFileType: fileShape.detectedFileType,
	typeSource: fileShape.typeSource,
});

export const RemoveFileInputSchema = z.object({
	id: z.string(),
});

export const AddressListInputSchema = z.object({
	limit: z.number().int().positive().max(100).optional(),
});

export const SubmitAddressFormInputSchema = z.object({
	fullName: addressSubmissionShape.fullName,
	email: addressSubmissionShape.email,
	address: addressSubmissionShape.address,
	phone: addressSubmissionShape.phone,
});

export const SignInInputSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export const SignUpInputSchema = SignInInputSchema.extend({
	name: z.string().min(1, "Name is required"),
});

export const OperationSuccessSchema = z.object({
	success: z.boolean(),
});

export type TodoDoc = z.infer<typeof TodoDocSchema>;
export type FileDoc = z.infer<typeof FileDocSchema>;
export type FileWithUrl = z.infer<typeof FileWithUrlSchema>;
export type AddressSubmissionDoc = z.infer<typeof AddressSubmissionDocSchema>;

export type CreateTodoInput = z.infer<typeof CreateTodoInputSchema>;
export type ToggleTodoInput = z.infer<typeof ToggleTodoInputSchema>;
export type RemoveTodoInput = z.infer<typeof RemoveTodoInputSchema>;
export type SaveFileInput = z.infer<typeof SaveFileInputSchema>;
export type RemoveFileInput = z.infer<typeof RemoveFileInputSchema>;
export type AddressListInput = z.infer<typeof AddressListInputSchema>;
export type SubmitAddressFormInput = z.infer<typeof SubmitAddressFormInputSchema>;
export type SignInInput = z.infer<typeof SignInInputSchema>;
export type SignUpInput = z.infer<typeof SignUpInputSchema>;
