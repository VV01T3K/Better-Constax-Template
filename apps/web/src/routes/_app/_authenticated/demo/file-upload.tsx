import { MAX_FILE_SIZE_LABEL, fileSchema } from "@repo/convex/schemas/files";
import { parseId, type Id } from "@repo/convex/schemas/ids";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldTitle,
} from "@repo/ui/components/field";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@repo/ui/components/item";
import { cn } from "@repo/ui/lib/utils";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	AlertCircle,
	Archive,
	Download,
	File,
	FileAudio,
	FileCode,
	FileImage,
	FileSpreadsheet,
	FileText,
	FileVideo,
	Globe,
	Trash2,
	Upload,
	UploadCloud,
} from "lucide-react";
import { useRef, useState } from "react";

import { staticCRPC, useCRPC } from "@/integrations/convex/crpc";
import { detectFileType } from "@/lib/file-type";

export const Route = createFileRoute("/_app/_authenticated/demo/file-upload")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(staticCRPC.func.files.list.staticQueryOptions({}));
	},
	component: FileUploadDemoPage,
});

function formatFileSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function extractStringField(responseText: string, fieldName: string) {
	try {
		const parsed = JSON.parse(responseText) as unknown;
		if (!isRecord(parsed)) return null;

		const value = parsed[fieldName];
		return typeof value === "string" ? value : null;
	} catch {
		return null;
	}
}

function FileIcon({ fileType }: { fileType: string }) {
	if (fileType.startsWith("image/")) return <FileImage />;
	if (fileType.startsWith("video/")) return <FileVideo />;
	if (fileType.startsWith("audio/")) return <FileAudio />;

	if (fileType === "application/pdf") return <FileText />;
	if (
		fileType === "application/msword" ||
		fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	) {
		return <FileText />;
	}

	if (
		fileType === "application/vnd.ms-excel" ||
		fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
		fileType === "text/csv"
	) {
		return <FileSpreadsheet />;
	}

	if (
		fileType === "application/zip" ||
		fileType === "application/gzip" ||
		fileType === "application/x-tar" ||
		fileType === "application/x-7z-compressed" ||
		fileType === "application/x-rar-compressed"
	) {
		return <Archive />;
	}

	if (
		fileType === "application/json" ||
		fileType === "application/xml" ||
		fileType === "text/javascript" ||
		fileType === "text/typescript" ||
		fileType === "text/html" ||
		fileType === "text/css"
	) {
		return <FileCode />;
	}

	if (fileType.startsWith("text/")) return <FileText />;

	return <File />;
}

function openProtectedFile(id: Id<"files">, download = false) {
	const fileUrl = `/api/files/${id}${download ? "?download=1" : ""}`;

	if (download) {
		const link = document.createElement("a");
		link.href = fileUrl;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		return;
	}

	window.open(fileUrl, "_blank", "noopener,noreferrer");
}

function FileUploadDemoPage() {
	const c = useCRPC();
	const queryClient = useQueryClient();
	const inputRef = useRef<HTMLInputElement>(null);
	const filesQuery = c.func.files.list.queryOptions({});
	const { data: files, isFetching } = useSuspenseQuery(filesQuery);
	const { mutateAsync: generateUploadUrl } = useMutation(
		c.func.files.generateUploadUrl.mutationOptions(),
	);
	const { mutateAsync: saveFile } = useMutation(c.func.files.saveFile.mutationOptions());
	const { mutateAsync: removeFile } = useMutation(c.func.files.remove.mutationOptions());

	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const resetUploadUi = () => {
		setUploading(false);
		setUploadProgress(0);

		if (inputRef.current) {
			inputRef.current.value = "";
		}
	};

	const refreshFiles = async () => {
		await queryClient.invalidateQueries({ queryKey: filesQuery.queryKey });
	};

	const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const fileSizeResult = fileSchema.saveFile.input.pick({ fileSize: true }).safeParse({
			fileSize: file.size,
		});
		if (!fileSizeResult.success) {
			setError(fileSizeResult.error.issues[0]?.message ?? "Invalid file size.");
			return;
		}

		setError(null);
		setUploading(true);
		setUploadProgress(0);

		try {
			const detected = await detectFileType(file);
			const uploadUrl = await generateUploadUrl({});
			const storageId = await new Promise<string>((resolve, reject) => {
				const xhr = new XMLHttpRequest();

				xhr.upload.addEventListener("progress", (progressEvent) => {
					if (!progressEvent.lengthComputable) return;

					const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
					setUploadProgress(progress);
				});

				xhr.addEventListener("load", () => {
					if (xhr.status < 200 || xhr.status >= 300) {
						const message =
							extractStringField(xhr.responseText, "message") ??
							`Upload failed: HTTP ${xhr.status}`;
						reject(new Error(message));
						return;
					}

					const parsedStorageId = extractStringField(xhr.responseText, "storageId");
					if (!parsedStorageId) {
						reject(new Error("Upload failed: missing storage id"));
						return;
					}

					resolve(parsedStorageId);
				});

				xhr.addEventListener("error", () => reject(new Error("Upload failed")));
				xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

				xhr.open("POST", uploadUrl);
				xhr.setRequestHeader("Content-Type", detected.mime);
				xhr.send(file);
			});

			await saveFile({
				storageId: parseId("_storage", storageId),
				fileName: file.name,
				fileType: detected.mime,
				fileSize: file.size,
				detectedFileType: detected.detectedExt ?? undefined,
				typeSource: detected.source,
			});
			await refreshFiles();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Upload failed");
		} finally {
			resetUploadUi();
		}
	};

	const handleRemove = async (id: (typeof files)[number]["_id"]) => {
		setError(null);

		try {
			await removeFile({ id });
			await refreshFiles();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Delete failed");
		}
	};

	const imageCount = files.filter((file) => file.fileType.startsWith("image/")).length;
	const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0);

	return (
		<div className="flex min-h-screen justify-center p-4">
			<div className="flex w-full max-w-5xl flex-col gap-4">
				<Card className="border-border/70 bg-background/80 relative overflow-hidden">
					<div className="bg-primary/15 absolute inset-x-0 top-0 h-1" />
					<CardHeader className="gap-3 border-b">
						<div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
							<div className="flex max-w-2xl flex-col gap-1">
								<CardTitle className="text-2xl tracking-tight">File Upload</CardTitle>
								<CardDescription>
									Authenticated file storage with MIME detection, upload progress, preview support,
									and clean ownership boundaries.
								</CardDescription>
							</div>
							<div className="flex flex-wrap gap-2">
								<Badge variant="outline">{files.length} stored</Badge>
								<Badge variant="outline">{imageCount} images</Badge>
								<Badge variant="outline">{formatFileSize(totalSize)} total</Badge>
								{isFetching ? <Badge>Refreshing</Badge> : null}
							</div>
						</div>
					</CardHeader>
					<CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
						<FieldGroup className="gap-4">
							<Field>
								<FieldContent>
									<FieldTitle>Drop-in demo surface</FieldTitle>
									<FieldDescription>
										This port keeps the legacy capabilities but shifts the presentation to the
										current sharp, editorial UI system.
									</FieldDescription>
								</FieldContent>
							</Field>
							<Field>
								<FieldContent>
									<input
										ref={inputRef}
										type="file"
										onChange={(event) => {
											void handleUpload(event);
										}}
										className="hidden"
										disabled={uploading}
									/>
									<Button
										type="button"
										variant="outline"
										size="lg"
										className="h-auto w-full justify-start gap-4 border-dashed px-4 py-6 text-left"
										onClick={() => inputRef.current?.click()}
										disabled={uploading}
									>
										<UploadCloud data-icon="inline-start" />
										<span className="flex flex-col gap-0.5">
											<span>{uploading ? "Uploading file..." : "Choose a file to upload"}</span>
											<span className="text-muted-foreground text-xs font-normal">
												Maximum size {MAX_FILE_SIZE_LABEL}. Stored privately to the signed-in user.
											</span>
										</span>
									</Button>
								</FieldContent>
							</Field>
							{uploading ? (
								<Field>
									<FieldContent>
										<div className="bg-muted h-2 overflow-hidden rounded-none">
											<div
												className="bg-primary h-full transition-[width] duration-300"
												style={{ width: `${uploadProgress}%` }}
											/>
										</div>
										<FieldDescription>
											Uploading with XHR progress tracking: {uploadProgress}% complete.
										</FieldDescription>
									</FieldContent>
								</Field>
							) : null}
							{error ? (
								<Alert variant="destructive">
									<AlertCircle />
									<AlertTitle>Action failed</AlertTitle>
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							) : null}
						</FieldGroup>

						<Card className="bg-muted/30 py-0">
							<CardHeader className="border-b py-4">
								<CardTitle>Storage Notes</CardTitle>
								<CardDescription>
									Binary types use magic-byte detection. Known text formats fall back to extension
									or browser MIME metadata.
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-col gap-3 py-4">
								<div className="flex items-center justify-between gap-3">
									<span className="text-muted-foreground">Upload transport</span>
									<Badge variant="outline">Convex storage URL</Badge>
								</div>
								<div className="flex items-center justify-between gap-3">
									<span className="text-muted-foreground">Ownership model</span>
									<Badge variant="outline">Authenticated user</Badge>
								</div>
								<div className="flex items-center justify-between gap-3">
									<span className="text-muted-foreground">File preview</span>
									<Badge variant="outline">Images inline</Badge>
								</div>
								<div className="flex items-center justify-between gap-3">
									<span className="text-muted-foreground">Fallback actions</span>
									<Badge variant="outline">Open, download, delete</Badge>
								</div>
							</CardContent>
						</Card>
					</CardContent>
				</Card>

				<Card className="border-border/70">
					<CardHeader className="border-b">
						<CardTitle>Stored Files</CardTitle>
						<CardDescription>
							Every entry is served through an authenticated same-origin proxy route.
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						{files.length === 0 ? (
							<div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
								<div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-none border">
									<Upload />
								</div>
								<div className="flex flex-col gap-1">
									<p className="text-sm font-medium">No files uploaded yet</p>
									<p className="text-muted-foreground max-w-md text-xs">
										Upload an image, document, archive, or source file to exercise the storage flow
										and metadata rendering.
									</p>
								</div>
							</div>
						) : (
							<ItemGroup className="gap-0">
								{files.map((file, index) => (
									<Item
										key={file._id}
										variant="outline"
										className={cn(
											"border-x-0 border-t-0 px-4 py-3 first:border-t-0 last:border-b-0",
											index % 2 === 0 ? "bg-background" : "bg-muted/20",
										)}
									>
										<ItemMedia variant="image" className="bg-muted text-muted-foreground border">
											{file.fileType.startsWith("image/") ? (
												<img
													src={`/api/files/${file._id}`}
													alt={file.fileName}
													loading="lazy"
													decoding="async"
												/>
											) : (
												<div className="flex size-full items-center justify-center">
													<FileIcon fileType={file.fileType} />
												</div>
											)}
										</ItemMedia>
										<ItemContent>
											<ItemTitle className="max-w-full truncate">{file.fileName}</ItemTitle>
											<ItemDescription className="flex flex-wrap gap-x-3 gap-y-1">
												<span>{file.fileType}</span>
												<span>{formatFileSize(file.fileSize)}</span>
												{file.detectedFileType ? <span>.{file.detectedFileType}</span> : null}
												{file.typeSource ? <span>{file.typeSource}</span> : null}
											</ItemDescription>
										</ItemContent>
										<ItemActions className="ml-auto flex-wrap justify-end">
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => {
													openProtectedFile(file._id);
												}}
											>
												<Globe data-icon="inline-start" />
												Open
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => {
													openProtectedFile(file._id, true);
												}}
											>
												<Download data-icon="inline-start" />
												Download
											</Button>
											<Button
												type="button"
												variant="destructive"
												size="sm"
												onClick={() => {
													void handleRemove(file._id);
												}}
											>
												<Trash2 data-icon="inline-start" />
												Delete
											</Button>
										</ItemActions>
									</Item>
								))}
							</ItemGroup>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
