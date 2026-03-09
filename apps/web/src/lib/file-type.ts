import { fileTypeFromBlob } from "file-type";

export type DetectedFileType = {
	mime: string;
	detectedExt: string | null;
	source: "magic-bytes" | "extension" | "content-sniff";
};

const textMimeTypes = new Set([
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

const textExtensionMap: Record<string, string> = {
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

export async function detectFileType(file: File): Promise<DetectedFileType> {
	const detected = await fileTypeFromBlob(file);

	if (detected) {
		return {
			mime: detected.mime,
			detectedExt: detected.ext,
			source: "magic-bytes",
		};
	}

	if (file.type && textMimeTypes.has(file.type)) {
		return {
			mime: file.type,
			detectedExt: null,
			source: "extension",
		};
	}

	const ext = file.name.split(".").pop()?.toLowerCase();
	if (ext && ext in textExtensionMap) {
		return {
			mime: textExtensionMap[ext],
			detectedExt: null,
			source: "content-sniff",
		};
	}

	return {
		mime: file.type || "application/octet-stream",
		detectedExt: null,
		source: "extension",
	};
}
