import { AlertCircle, Loader2 } from "lucide-react";

import type { OptimisticTodo } from "@/db-collections";

export function StatusBadge({ status }: { status: OptimisticTodo["status"] }) {
	if (status === "optimistic") {
		return (
			<span className="inline-flex animate-pulse items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600">
				<Loader2 size={12} className="animate-spin" />
				Pending...
			</span>
		);
	}

	if (status === "error") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
				<AlertCircle size={12} />
				Failed
			</span>
		);
	}

	return null;
}
