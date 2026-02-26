/**
 * Better Auth expects browser-like globals in Convex runtime.
 * This file must be imported by convex/http.ts before registerRoutes.
 */
if (typeof globalThis.File === "undefined") {
	globalThis.File = class File {
		lastModified: number;
		name: string;
		size: number;
		type: string;

		constructor(_chunks: Array<BlobPart>, fileName: string, options?: FilePropertyBag) {
			this.name = fileName;
			this.lastModified = options?.lastModified ?? Date.now();
			this.type = options?.type ?? "";
			this.size = 0;
		}
	} as typeof File;
}

export {};
