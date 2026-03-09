import { createFileRoute } from "@tanstack/react-router";

import { Demo } from "../../../components/demo";

export const Route = createFileRoute("/_app/demo/shadcn")({
	component: ShadcnDemoPage,
});

function ShadcnDemoPage() {
	return <Demo />;
}
