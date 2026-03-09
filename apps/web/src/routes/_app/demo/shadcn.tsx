import { Button } from "@repo/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Demo } from "../../../components/demo";

export const Route = createFileRoute("/_app/demo/shadcn")({
	component: ShadcnDemoPage,
});

function ShadcnDemoPage() {
	return (
		<>
			<Button variant="outline" onClick={() => toast("Hello from Sonner!")}>
				Test Toast
			</Button>
			<Demo />
		</>
	);
}
