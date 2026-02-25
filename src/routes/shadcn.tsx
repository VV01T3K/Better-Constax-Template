import { createFileRoute } from "@tanstack/react-router";

import { ComponentExample } from "@/components/component-example";

export const Route = createFileRoute("/shadcn")({ component: ShadcnPage });

function ShadcnPage() {
	return (
		<div className="flex flex-1 flex-col">
			<ComponentExample />
		</div>
	);
}
