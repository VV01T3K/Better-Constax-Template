import { err, ok, type Result } from "neverthrow";
import { z } from "zod";

export const authUserIdSchema = z.string().min(1, "User ID is required").brand<"AuthUserId">();
export type AuthUserId = z.infer<typeof authUserIdSchema>;

export class AuthUserIdParseError extends Error {
	constructor(
		message: string,
		public readonly cause?: unknown,
	) {
		super(message, { cause });
		this.name = "AuthUserIdParseError";
	}
}

export function parseAuthUserId(value: unknown): Result<AuthUserId, AuthUserIdParseError> {
	const parsed = authUserIdSchema.safeParse(value);
	if (!parsed.success) {
		return err(new AuthUserIdParseError("Invalid auth user identifier", parsed.error));
	}

	return ok(parsed.data);
}
