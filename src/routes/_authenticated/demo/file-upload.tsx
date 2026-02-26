import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
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
import { err as resultErr, ok, type Result } from "neverthrow";
import { useRef, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { detectFileType } from "@/lib/file-type";

export const Route = createFileRoute("/_authenticated/demo/file-upload")({
	beforeLoad: async ({ context }) => {
		const allowed = await context.queryClient.fetchQuery({
			...convexQuery(api.functions.authorization.hasPermission, {
				permission: "demo.files.access",
			}),
			staleTime: 0,
		});
		if (!allowed) throw redirect({ to: "/forbidden" });
	},
	loader: async ({ context }) => {
		await context.queryClient.fetchQuery(convexQuery(api.functions.files.list, {}));
	},
	component: FileUploadDemo,
});

function formatFileSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractJsonStringField(responseText: string, fieldName: string) {
	const fieldPattern = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]+)"`);
	return fieldPattern.exec(responseText)?.[1] ?? null;
}

async function downloadFile(url: string, fileName: string): Promise<Result<void, Error>> {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			return resultErr(
				new Error(`Download failed: HTTP ${response.status} ${response.statusText}`),
			);
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
		return resultErr(cause instanceof Error ? cause : new Error(String(cause)));
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
	if (fileType.startsWith("image/")) return <FileImage className="size-5" />;
	if (fileType.startsWith("video/")) return <FileVideo className="size-5" />;
	if (fileType.startsWith("audio/")) return <FileAudio className="size-5" />;

	if (fileType === "application/pdf") return <FileText className="size-5" />;
	if (
		fileType === "application/msword" ||
		fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	)
		return <FileText className="size-5" />;

	if (
		fileType === "application/vnd.ms-excel" ||
		fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
		fileType === "text/csv"
	)
		return <FileSpreadsheet className="size-5" />;

	if (
		fileType === "application/zip" ||
		fileType === "application/gzip" ||
		fileType === "application/x-tar" ||
		fileType === "application/x-7z-compressed" ||
		fileType === "application/x-rar-compressed"
	)
		return <Archive className="size-5" />;

	if (
		fileType === "application/json" ||
		fileType === "application/xml" ||
		fileType === "text/javascript" ||
		fileType === "text/typescript" ||
		fileType === "text/html" ||
		fileType === "text/css"
	)
		return <FileCode className="size-5" />;

	if (fileType.startsWith("text/")) return <FileText className="size-5" />;

	return <File className="size-5" />;
}

function FileUploadDemo() {
	const filesQuery = convexQuery(api.functions.files.list, {});
	const { data: files } = useSuspenseQuery(filesQuery);
	const generateUploadUrl = useMutation(api.functions.files.generateUploadUrl);
	const saveFile = useMutation(api.functions.files.saveFile);
	const removeFile = useMutation(api.functions.files.remove);
	const queryClient = useQueryClient();

	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const resetUploadUi = () => {
		setUploading(false);
		setUploadProgress(0);
		if (inputRef.current) {
			inputRef.current.value = "";
		}
	};

	const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
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
			resetUploadUi();
			return;
		}
		const detected = detectResult.value;

		const uploadResult = await generateUploadUrl()
			.then(
				(uploadUrl) =>
					new Promise<string>((resolve, reject) => {
						const xhr = new XMLHttpRequest();

						xhr.upload.addEventListener("progress", (progressEvent) => {
							if (progressEvent.lengthComputable) {
								const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
								setUploadProgress(progress);
							}
						});

						xhr.addEventListener("load", () => {
							if (xhr.status >= 200 && xhr.status < 300) {
								const storageId = extractJsonStringField(xhr.responseText, "storageId");
								if (storageId && storageId.length > 0) {
									resolve(storageId);
									return;
								}
								reject(new Error("Upload failed: missing storage id"));
							} else {
								const parsedMessage = extractJsonStringField(xhr.responseText, "message");
								const errorMessage =
									parsedMessage && parsedMessage.length > 0
										? parsedMessage
										: `Upload failed: HTTP ${xhr.status}`;
								reject(new Error(errorMessage));
							}
						});

						xhr.addEventListener("error", () => reject(new Error("Upload failed")));
						xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

						xhr.open("POST", uploadUrl);
						xhr.setRequestHeader("Content-Type", detected.mime);
						xhr.send(file);
					}),
			)
			.then(async (storageId) => {
				await saveFile({
					storageId,
					fileName: file.name,
					fileType: detected.mime,
					fileSize: file.size,
					detectedFileType: detected.detectedExt ?? undefined,
					typeSource: detected.source,
				});
				await queryClient.invalidateQueries({ queryKey: filesQuery.queryKey });
				return ok(undefined);
			})
			.catch((uploadError) =>
				resultErr(uploadError instanceof Error ? uploadError : new Error(String(uploadError))),
			);

		if (uploadResult.isErr()) {
			setError(uploadResult.error.message);
		}

		resetUploadUi();
	};

	const handleRemove = async (id: Id<"files">) => {
		await removeFile({ id });
		await queryClient.invalidateQueries({ queryKey: filesQuery.queryKey });
	};

	const imageCount = files.filter((f) => f.fileType.startsWith("image/")).length;
	const totalSize = files.reduce((sum, f) => sum + f.fileSize, 0);

	return (
		<div className="mx-auto w-full max-w-2xl space-y-6 p-6">
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-3xl">File Upload</CardTitle>
					<CardDescription>Convex File Storage Demo</CardDescription>
					{files.length > 0 && (
						<div className="text-muted-foreground mt-2 flex justify-center gap-6 text-sm">
							<span>
								{files.length} file{files.length !== 1 ? "s" : ""}
							</span>
							<span>{imageCount} images</span>
							<span>{formatFileSize(totalSize)} total</span>
						</div>
					)}
				</CardHeader>
			</Card>

			<Card>
				<CardContent className="pt-6">
					<input
						ref={inputRef}
						type="file"
						onChange={handleUpload}
						className="hidden"
						disabled={uploading}
					/>
					<Button
						variant="outline"
						className="flex h-auto w-full flex-col items-center gap-3 border-dashed py-8"
						onClick={() => inputRef.current?.click()}
						disabled={uploading}
					>
						<UploadCloud className="text-muted-foreground size-8" />
						<span className="text-sm font-medium">
							{uploading ? "Uploading..." : "Click to upload a file"}
						</span>
					</Button>
					{uploading && uploadProgress > 0 && (
						<div className="mt-4 space-y-1">
							<div className="text-muted-foreground flex justify-between text-sm">
								<span>Uploading...</span>
								<span className="font-medium">{uploadProgress}%</span>
							</div>
							<Progress value={uploadProgress} />
						</div>
					)}
					{error && <p className="text-destructive mt-2 text-sm">{error}</p>}
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-0">
					{files.length === 0 ? (
						<div className="p-12 text-center">
							<Upload className="text-muted-foreground/40 mx-auto mb-4 size-12" />
							<h3 className="mb-2 text-xl font-semibold">No files yet</h3>
							<p className="text-muted-foreground">Upload your first file above to get started!</p>
						</div>
					) : (
						<TooltipProvider>
							<div className="divide-border divide-y">
								{files.map((file) => (
									<div
										key={file._id}
										className="hover:bg-muted/50 flex items-center gap-4 p-4 transition-colors"
									>
										<div className="bg-muted text-muted-foreground flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg">
											{file.fileType.startsWith("image/") && file.url ? (
												<img
													src={file.url}
													alt={file.fileName}
													width={48}
													height={48}
													loading="lazy"
													decoding="async"
													className="h-full w-full object-cover"
												/>
											) : (
												<FileIcon fileType={file.fileType} />
											)}
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-foreground truncate font-medium">{file.fileName}</p>
											<p className="text-muted-foreground text-sm">
												{file.fileType} &middot; {formatFileSize(file.fileSize)}
											</p>
										</div>
										<div className="flex shrink-0 items-center gap-1">
											{file.url && (
												<>
													<Tooltip>
														<TooltipTrigger
															render={
																<a
																	href={file.url}
																	target="_blank"
																	rel="noopener noreferrer"
																	className={buttonVariants({
																		variant: "ghost",
																		size: "icon",
																	})}
																>
																	<span className="sr-only">Open file</span>
																</a>
															}
														>
															<Upload className="size-4" />
														</TooltipTrigger>
														<TooltipContent>Open file</TooltipContent>
													</Tooltip>
													<Tooltip>
														<TooltipTrigger
															render={
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() =>
																		file.url && handleDownload(file.url, file.fileName)
																	}
																/>
															}
														>
															<Download className="size-4" />
														</TooltipTrigger>
														<TooltipContent>Download</TooltipContent>
													</Tooltip>
												</>
											)}
											<Tooltip>
												<TooltipTrigger
													render={
														<Button
															variant="ghost"
															size="icon"
															onClick={() => handleRemove(file._id)}
															className="text-destructive hover:bg-destructive/10 hover:text-destructive"
														/>
													}
												>
													<Trash2 className="size-4" />
												</TooltipTrigger>
												<TooltipContent>Delete</TooltipContent>
											</Tooltip>
										</div>
									</div>
								))}
							</div>
						</TooltipProvider>
					)}
				</CardContent>
			</Card>

			<p className="text-muted-foreground text-center text-sm">
				Built with Convex File Storage &bull; Upload &bull; Preview &bull; Download &bull; Delete
			</p>
		</div>
	);
}
