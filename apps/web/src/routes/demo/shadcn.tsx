import { createFileRoute } from "@tanstack/react-router";

import { Demo } from "../../components/demo";

export const Route = createFileRoute("/demo/shadcn")({
	component: ShadcnDemoPage,
});

function ShadcnDemoPage() {
	return <Demo />;
}
