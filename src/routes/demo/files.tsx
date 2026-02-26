import { type ChangeEvent, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { isCRPCClientError } from "better-convex";

import { detectFileType } from "@/lib/file-type";
import { useCRPC } from "@/lib/convex/crpc";

export const Route = createFileRoute("/demo/files")({
	component: FilesPage,
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

function FilesPage() {
	const crpc = useCRPC();
	const queryClient = useQueryClient();
	const inputRef = useRef<HTMLInputElement>(null);
	const [error, setError] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);

	const listQueryOptions = crpc.functions.files.list.queryOptions({});
	const { data: files = [] } = useQuery(listQueryOptions);

	const generateUploadUrl = useMutation(crpc.functions.files.generateUploadUrl.mutationOptions());
	const saveFile = useMutation(crpc.functions.files.saveFile.mutationOptions());
	const removeFile = useMutation(crpc.functions.files.remove.mutationOptions());

	const refreshList = async () => {
		await queryClient.invalidateQueries({ queryKey: listQueryOptions.queryKey });
	};

	const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (file.size > 50 * 1024 * 1024) {
			setError("File size must be less than 50MB.");
			return;
		}

		setError(null);
		setUploading(true);
		setUploadProgress(0);

		const typeResult = await detectFileType(file);
		if (typeResult.isErr()) {
			setError(typeResult.error.message);
			setUploading(false);
			return;
		}

		const detected = typeResult.value;

		try {
			const uploadUrl = await generateUploadUrl.mutateAsync({});
			const storageId = await new Promise<string>((resolve, reject) => {
				const xhr = new XMLHttpRequest();

				xhr.upload.addEventListener("progress", (progressEvent) => {
					if (!progressEvent.lengthComputable) return;
					const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
					setUploadProgress(progress);
				});

				xhr.addEventListener("load", () => {
					if (xhr.status >= 200 && xhr.status < 300) {
						const parsedStorageId = extractJsonStringField(xhr.responseText, "storageId");
						if (parsedStorageId) {
							resolve(parsedStorageId);
							return;
						}
						reject(new Error("Upload response did not include storageId."));
						return;
					}
					reject(new Error(`Upload failed with HTTP ${xhr.status}`));
				});

				xhr.addEventListener("error", () => reject(new Error("Upload failed.")));
				xhr.addEventListener("abort", () => reject(new Error("Upload aborted.")));

				xhr.open("POST", uploadUrl);
				xhr.setRequestHeader("Content-Type", detected.mime);
				xhr.send(file);
			});

			await saveFile.mutateAsync({
				storageId,
				fileName: file.name,
				fileType: detected.mime,
				fileSize: file.size,
				detectedFileType: detected.detectedExt ?? undefined,
				typeSource: detected.source,
			});

			await refreshList();
		} catch (cause) {
			if (isCRPCClientError(cause)) {
				setError(cause.data?.message ?? "Upload failed.");
			} else {
				setError(cause instanceof Error ? cause.message : "Upload failed.");
			}
		} finally {
			setUploading(false);
			setUploadProgress(0);
			if (inputRef.current) inputRef.current.value = "";
		}
	};

	const onRemove = async (id: string) => {
		setError(null);
		await removeFile
			.mutateAsync({ id })
			.then(refreshList)
			.catch((cause: unknown) => {
				if (isCRPCClientError(cause)) {
					setError(cause.data?.message ?? "Delete failed.");
					return;
				}
				setError(cause instanceof Error ? cause.message : "Delete failed.");
			});
	};

	return (
		<section className="space-y-4">
			<h1 className="text-2xl font-semibold">Files</h1>
			<p className="text-sm text-muted-foreground">Public list, authenticated owner-only uploads/removals.</p>

			<input ref={inputRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
			<button
				onClick={() => inputRef.current?.click()}
				disabled={uploading}
				className="rounded-md border border-border px-4 py-2"
			>
				{uploading ? "Uploading..." : "Upload file"}
			</button>
			{uploading ? <p className="text-sm text-muted-foreground">Progress: {uploadProgress}%</p> : null}
			{error ? <p className="text-sm text-destructive">{error}</p> : null}

			<ul className="space-y-2">
				{files.map((file) => (
					<li key={file._id} className="rounded-md border border-border p-3">
						<div className="flex items-center gap-2">
							<p className="font-medium">{file.fileName}</p>
							<span className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</span>
							<button
								onClick={() => onRemove(file._id)}
								className="ml-auto rounded-md border border-border px-2 py-1 text-xs"
							>
								Delete
							</button>
						</div>
						{file.url ? (
							<a href={file.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
								Open file
							</a>
						) : null}
					</li>
				))}
			</ul>
		</section>
	);
}
