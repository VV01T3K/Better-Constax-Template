import type { Id } from "@convex/_generated/dataModel";

import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import {
	Archive,
	Download,
	File,
	FileAudio,
	FileCode,
	FileImage,
	FileSpreadsheet,
	FileText,
	FileVideo,
	Trash2,
	Upload,
	UploadCloud,
} from "lucide-react";
import { err, ok, type Result } from "neverthrow";
import { useRef, useState } from "react";

import { detectFileType } from "@/lib/file-type";

export const Route = createFileRoute("/demo/file-upload")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(convexQuery(api.files.list, {}));
	},
	component: FileUploadDemo,
});

function formatFileSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function downloadFile(url: string, fileName: string): Promise<Result<void, Error>> {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			return err(new Error(`Download failed: HTTP ${response.status} ${response.statusText}`));
		}
		const blob = await response.blob();
		const blobUrl = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = blobUrl;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(blobUrl);
		return ok(undefined);
	} catch (cause) {
		return err(cause instanceof Error ? cause : new Error(String(cause)));
	}
}
		const link = document.createElement("a");
		link.href = blobUrl;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(blobUrl);
		return ok(undefined);
	} catch (cause) {
		return err(`Download failed: ${cause instanceof Error ? cause.message : String(cause)}`);
	}
}

async function handleDownload(url: string, fileName: string) {
	const result = await downloadFile(url, fileName);
	if (result.isErr()) {
		// oxlint-disable-next-line no-console
		console.error(result.error);
	}
}

function FileIcon({ fileType }: { fileType: string }) {
	if (fileType.startsWith("image/")) return <FileImage size={20} />;
	if (fileType.startsWith("video/")) return <FileVideo size={20} />;
	if (fileType.startsWith("audio/")) return <FileAudio size={20} />;

	if (fileType === "application/pdf") return <FileText size={20} />;
	if (
		fileType === "application/msword" ||
		fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	)
		return <FileText size={20} />;

	if (
		fileType === "application/vnd.ms-excel" ||
		fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
		fileType === "text/csv"
	)
		return <FileSpreadsheet size={20} />;

	if (
		fileType === "application/zip" ||
		fileType === "application/gzip" ||
		fileType === "application/x-tar" ||
		fileType === "application/x-7z-compressed" ||
		fileType === "application/x-rar-compressed"
	)
		return <Archive size={20} />;

	if (
		fileType === "application/json" ||
		fileType === "application/xml" ||
		fileType === "text/javascript" ||
		fileType === "text/typescript" ||
		fileType === "text/html" ||
		fileType === "text/css"
	)
		return <FileCode size={20} />;

	if (fileType.startsWith("text/")) return <FileText size={20} />;

	return <File size={20} />;
}

function FileUploadDemo() {
	const { data: files } = useSuspenseQuery(convexQuery(api.files.list, {}));
	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const saveFile = useMutation(api.files.saveFile);
	const removeFile = useMutation(api.files.remove);

	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (file.size > 50 * 1024 * 1024) {
			setError("File size must be less than 50 MB");
			return;
		}

		setError(null);
		setUploading(true);
		setUploadProgress(0);
		const detectResult = await detectFileType(file);
		if (detectResult.isErr()) {
			setError(detectResult.error.message);
			setUploading(false);
			if (inputRef.current) {
				inputRef.current.value = "";
			}
			return;
		}
		const detected = detectResult.value;

		try {
			const uploadUrl = await generateUploadUrl();

			// Use XMLHttpRequest for progress tracking
			const storageId = await new Promise<string>((resolve, reject) => {
				const xhr = new XMLHttpRequest();

				xhr.upload.addEventListener("progress", (e) => {
					if (e.lengthComputable) {
						const progress = Math.round((e.loaded / e.total) * 100);
						setUploadProgress(progress);
					}
				});

				xhr.addEventListener("load", () => {
					if (xhr.status >= 200 && xhr.status < 300) {
						try {
							const response = JSON.parse(xhr.responseText);
							resolve(response.storageId);
						} catch {
							reject(new Error("Invalid response"));
						}
					} else {
						reject(new Error("Upload failed"));
					}
				});

				xhr.addEventListener("error", () => reject(new Error("Upload failed")));
				xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

				xhr.open("POST", uploadUrl);
				xhr.setRequestHeader("Content-Type", detected.mime);
				xhr.send(file);
			});

			await saveFile({
				storageId,
				fileName: file.name,
				fileType: detected.mime,
				fileSize: file.size,
				detectedFileType: detected.detectedExt ?? undefined,
				typeSource: detected.source,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Upload failed");
		} finally {
			setUploading(false);
			setUploadProgress(0);
			if (inputRef.current) {
				inputRef.current.value = "";
			}
		}
	};

	const handleRemove = async (id: Id<"files">) => {
		await removeFile({ id });
	};

	const imageCount = files.filter((f) => f.fileType.startsWith("image/")).length;
	const totalSize = files.reduce((sum, f) => sum + f.fileSize, 0);

	return (
		<div
			className="flex min-h-screen items-center justify-center p-4"
			style={{
				background:
					"linear-gradient(135deg, #4a5568 0%, #667eea 25%, #764ba2 50%, #a855f7 75%, #faf5ff 100%)",
			}}
		>
			<div className="w-full max-w-2xl">
				{/* Header Card */}
				<div className="mb-6 rounded-2xl border border-purple-200/50 bg-white p-8 shadow-2xl">
					<div className="text-center">
						<h1 className="mb-2 text-4xl font-bold text-purple-800">File Upload</h1>
						<p className="text-lg text-purple-600">Convex File Storage Demo</p>
						{files.length > 0 && (
							<div className="mt-4 flex justify-center space-x-6 text-sm">
								<span className="font-medium text-purple-700">
									{files.length} file{files.length !== 1 ? "s" : ""}
								</span>
								<span className="text-gray-600">{imageCount} images</span>
								<span className="text-gray-600">{formatFileSize(totalSize)} total</span>
							</div>
						)}
					</div>
				</div>

				{/* Upload Card */}
				<div className="mb-6 rounded-2xl border border-purple-200/50 bg-white p-6 shadow-xl">
					<input
						ref={inputRef}
						type="file"
						onChange={handleUpload}
						className="hidden"
						disabled={uploading}
					/>
					<button
						onClick={() => inputRef.current?.click()}
						disabled={uploading}
						className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/50 px-6 py-8 font-semibold text-purple-700 transition-all duration-200 hover:border-purple-400 hover:bg-purple-100/50 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<UploadCloud size={24} />
						{uploading ? "Uploading..." : "Click to upload a file"}
					</button>
					{uploading && uploadProgress > 0 && (
						<div className="mt-4">
							<div className="mb-1 flex justify-between text-sm">
								<span className="text-purple-700">Uploading...</span>
								<span className="font-medium text-purple-700">{uploadProgress}%</span>
							</div>
							<div className="h-2 w-full overflow-hidden rounded-full bg-purple-100">
								<div
									className="h-full rounded-full bg-linear-to-r from-purple-500 to-purple-600 transition-all duration-300"
									style={{ width: `${uploadProgress}%` }}
								/>
							</div>
						</div>
					)}
					{error && <p className="mt-2 text-sm text-red-600">{error}</p>}
				</div>

				{/* File List */}
				<div className="overflow-hidden rounded-2xl border border-purple-200/50 bg-white shadow-xl">
					{files.length === 0 ? (
						<div className="p-12 text-center">
							<Upload size={48} className="mx-auto mb-4 text-purple-300" />
							<h3 className="mb-2 text-xl font-semibold text-purple-800">No files yet</h3>
							<p className="text-purple-600">Upload your first file above to get started!</p>
						</div>
					) : (
						<div className="divide-y divide-purple-100">
							{files.map((file) => (
								<div
									key={file._id}
									className="flex items-center gap-4 p-4 transition-colors hover:bg-purple-50/50"
								>
									{/* Preview / Icon */}
									<div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-purple-100 text-purple-600">
										{file.fileType.startsWith("image/") && file.url ? (
											<img
												src={file.url}
												alt={file.fileName}
												className="h-full w-full object-cover"
											/>
										) : (
											<FileIcon fileType={file.fileType} />
										)}
									</div>

									{/* File info */}
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium text-gray-800">{file.fileName}</p>
										<p className="text-sm text-gray-500">
											{file.fileType} &middot; {formatFileSize(file.fileSize)}
										</p>
									</div>

									{/* Actions */}
									<div className="flex shrink-0 items-center gap-2">
										{file.url && (
											<>
												<a
													href={file.url}
													target="_blank"
													rel="noopener noreferrer"
													className="rounded-lg p-2 text-purple-500 transition-colors hover:bg-purple-50 hover:text-purple-700"
													title="Open file"
												>
													<Upload size={18} />
												</a>
												<button
													onClick={() => file.url && handleDownload(file.url, file.fileName)}
													className="rounded-lg p-2 text-blue-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
													title="Download file"
												>
													<Download size={18} />
												</button>
											</>
										)}
										<button
											onClick={() => handleRemove(file._id)}
											className="shrink-0 rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
											title="Delete file"
										>
											<Trash2 size={18} />
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="mt-6 text-center">
					<p className="text-sm text-purple-700/80">
						Built with Convex File Storage &bull; Upload &bull; Preview &bull; Download &bull;
						Delete
					</p>
				</div>
			</div>
		</div>
	);
}
