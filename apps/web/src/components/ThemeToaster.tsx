import { Toaster } from "@repo/ui/components/sonner";

import { useTheme } from "./ThemeProvider";

export function ThemeToaster() {
	const { resolvedTheme } = useTheme();

	return <Toaster theme={resolvedTheme === "dark" ? "dark" : "light"} />;
}
