import { authMiddleware } from "better-convex/auth/http";
import { CRPCError, createHttpRouter, createHttpRouterFactory } from "better-convex/server";
import { Hono } from "hono";

import { fileInternalSchema } from "../shared/schemas/files";
import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { getAuth } from "./generated/auth";

const app = new Hono();
const httpRouter = createHttpRouterFactory()({});
// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const getHttpAuth = getAuth as unknown as Parameters<typeof authMiddleware>[0];

app.use(authMiddleware(getHttpAuth));

const getFileErrorResponse = (error: unknown) => {
	if (!(error instanceof CRPCError)) {
		return null;
	}

	if (error.code === "UNAUTHORIZED") {
		return new Response(error.code, { status: 401 });
	}

	if (error.code === "FORBIDDEN" || error.code === "NOT_FOUND") {
		return new Response(error.code, { status: 404 });
	}

	return null;
};

app.get("/files/:fileId", async (c) => {
	// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
	const ctx = c.env as ActionCtx;
	const fileIdParam = c.req.param("fileId");

	if (!fileIdParam) {
		return c.text("Missing file id", 400);
	}

	const parsedGetServeInfoInput = fileInternalSchema.getServeInfo.input.safeParse({
		_id: decodeURIComponent(fileIdParam),
	});
	if (!parsedGetServeInfoInput.success) {
		return c.text("Invalid file id", 400);
	}

	try {
		const file = fileInternalSchema.getServeInfo.output.parse(
			await ctx.runQuery(internal.func.files.getServeInfo, parsedGetServeInfoInput.data),
		);
		const blob = await ctx.storage.get(file.storageId);

		if (!blob) {
			return c.text("Not found", 404);
		}

		const isDownload = c.req.query("download") === "1";
		const safeFileName = file.fileName.replaceAll('"', "");

		c.header("Cache-Control", "private, no-store, max-age=0");
		c.header(
			"Content-Disposition",
			`${isDownload ? "attachment" : "inline"}; filename="${safeFileName}"`,
		);
		c.header("Content-Length", String(file.fileSize));
		c.header("Content-Type", file.fileType);

		return new Response(blob, {
			status: 200,
			headers: c.res.headers,
		});
	} catch (error) {
		const response = getFileErrorResponse(error);
		if (response) return response;

		throw error;
	}
});

export default createHttpRouter(app, httpRouter);
