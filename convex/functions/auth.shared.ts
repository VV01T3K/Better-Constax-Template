export const DEFAULT_SITE_URL = "http://localhost:3000";

export const getSiteUrl = () => process.env.SITE_URL ?? DEFAULT_SITE_URL;

// Shared auth options used by both runtime auth (`./auth.ts`) and schema
// generation (`./auth.schema.config.ts`) so they cannot diverge silently.
export const getSharedAuthOptions = () => ({
	emailAndPassword: {
		enabled: true,
	},
});
