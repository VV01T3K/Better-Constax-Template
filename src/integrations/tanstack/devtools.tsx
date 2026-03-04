import { formDevtoolsPlugin } from "@tanstack/react-form-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

const tanStackDevtoolsPlugins = [
	{
		name: "TanStack Router",
		render: <TanStackRouterDevtoolsPanel />,
	},
	formDevtoolsPlugin(),
	{
		name: "TanStack Query",
		render: <ReactQueryDevtoolsPanel />,
	},
];

export default tanStackDevtoolsPlugins;
