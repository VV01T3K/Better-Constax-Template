import { fileTypeFromBlob } from "file-type";
import { err, ok, type Result } from "neverthrow";

export interface DetectedFileType {
	/** The MIME type to use (detected or fallback) */
	mime: string;
	/** The file extension detected by magic bytes (without dot), or null if not detected */
	detectedExt: string | null;
	/** How the MIME type was determined */
	source: "magic-bytes" | "extension" | "content-sniff";
}

export class FileTypeError extends Error {
	constructor(
		message: string,
		public readonly cause?: unknown,
	) {
		super(message);
		this.name = "FileTypeError";
	}
}

export class FileValidationError extends Error {
	constructor(
		message: string,
		public readonly code: "EMPTY_FILE" | "FILE_TOO_SMALL" | "FILE_TOO_LARGE" | "UNKNOWN_TYPE",
		public readonly maxSize?: number,
	) {
		super(message);
		this.name = "FileValidationError";
	}
}

/** Text-based MIME types that inherently have no magic bytes */
const TEXT_MIME_TYPES = new Set([
	"text/plain",
	"text/csv",
	"text/html",
	"text/css",
	"text/javascript",
	"text/markdown",
	"text/xml",
	"text/yaml",
	"application/json",
	"application/xml",
	"application/x-yaml",
	"image/svg+xml",
]);

/** Extension-to-MIME map for text files when the browser reports an empty or generic type */
const TEXT_EXTENSION_MAP: Record<string, string> = {
	txt: "text/plain",
	csv: "text/csv",
	json: "application/json",
	html: "text/html",
	htm: "text/html",
	css: "text/css",
	js: "text/javascript",
	mjs: "text/javascript",
	ts: "text/typescript",
	tsx: "text/typescript",
	jsx: "text/javascript",
	xml: "application/xml",
	svg: "image/svg+xml",
	md: "text/markdown",
	mdx: "text/markdown",
	yaml: "application/x-yaml",
	yml: "application/x-yaml",
	log: "text/plain",
	env: "text/plain",
	toml: "text/plain",
	ini: "text/plain",
	cfg: "text/plain",
	conf: "text/plain",
	sh: "text/x-shellscript",
	bash: "text/x-shellscript",
	zsh: "text/x-shellscript",
	py: "text/x-python",
	rb: "text/x-ruby",
	rs: "text/x-rust",
	go: "text/x-go",
	java: "text/x-java",
	kt: "text/x-kotlin",
	swift: "text/x-swift",
	c: "text/x-c",
	h: "text/x-c",
	cpp: "text/x-c++",
	hpp: "text/x-c++",
	sql: "text/x-sql",
	graphql: "text/x-graphql",
	gql: "text/x-graphql",
};

/**
 * Detect the actual file type using magic bytes.
 * Falls back to browser-reported type for text-based files,
 * then to extension-based mapping as a last resort.
 */
export async function detectFileType(file: File): Promise<Result<DetectedFileType, FileTypeError>> {
	// 1. Try magic bytes detection first
	let detected: Awaited<ReturnType<typeof fileTypeFromBlob>>;
	try {
		detected = await fileTypeFromBlob(file);
	} catch (cause) {
		return err(new FileTypeError("Failed to detect file type from magic bytes", cause));
	}

	if (detected) {
		return ok({
			mime: detected.mime,
			detectedExt: detected.ext,
			source: "magic-bytes",
		});
	}

	// 2. If browser reports a known text type, trust it
	if (file.type && TEXT_MIME_TYPES.has(file.type)) {
		return ok({
			mime: file.type,
			detectedExt: null,
			source: "extension",
		});
	}

	// 3. Try extension-based mapping for known text formats
	const ext = file.name.split(".").pop()?.toLowerCase();
	if (ext && ext in TEXT_EXTENSION_MAP) {
		return ok({
			mime: TEXT_EXTENSION_MAP[ext],
			detectedExt: null,
			source: "content-sniff",
		});
	}

	// 4. Fall back to browser type, or application/octet-stream
	return ok({
		mime: file.type || "application/octet-stream",
		detectedExt: null,
		source: "extension",
	});
}
