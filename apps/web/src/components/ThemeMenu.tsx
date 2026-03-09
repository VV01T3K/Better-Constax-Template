import {
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "@repo/ui/components/dropdown-menu";
import { cn } from "@repo/ui/lib/utils";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import * as React from "react";

import { useCircleThemeTransition } from "./theme-switch/useCircleThemeTransition";
import { type AppTheme, useTheme } from "./ThemeProvider";

const themeOptions = [
	{
		value: "light" as const,
		label: "Light",
		icon: SunIcon,
	},
	{
		value: "dark" as const,
		label: "Dark",
		icon: MoonIcon,
	},
	{
		value: "system" as const,
		label: "System",
		icon: MonitorIcon,
	},
];

function isAppTheme(value: string): value is AppTheme {
	return value === "light" || value === "dark" || value === "system";
}

export function ThemeMenu() {
	const [mounted, setMounted] = React.useState(false);
	const { resolvedTheme, theme, setTheme } = useTheme();
	const animateThemeChange = useCircleThemeTransition();

	React.useEffect(() => {
		setMounted(true);
	}, []);

	const selectedTheme = mounted && theme ? theme : "system";
	const resolvedThemeLabel = mounted ? (resolvedTheme ?? "light") : "light";

	return (
		<>
			<DropdownMenuGroup>
				<DropdownMenuLabel className="text-foreground p-0 font-normal">
					<div className="flex flex-col gap-3 px-2 py-2">
						<div className="grid gap-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">Appearance</span>
							<span className="text-muted-foreground text-xs">
								{selectedTheme === "system"
									? `Following system - ${resolvedThemeLabel}.`
									: `Using ${selectedTheme} theme.`}
							</span>
						</div>
						<div className="bg-muted/60 ring-border grid grid-cols-3 gap-1 p-1 ring-1">
							{themeOptions.map((option) => {
								const Icon = option.icon;
								const isActive = selectedTheme === option.value;

								return (
									<button
										key={option.value}
										type="button"
										className={cn(
											"flex min-w-0 flex-col items-center gap-1 px-2 py-2 text-[11px] transition-colors",
											"focus-visible:border-ring focus-visible:ring-ring/50 border border-transparent outline-none focus-visible:ring-1",
											isActive
												? "border-primary bg-primary text-primary-foreground shadow-sm"
												: "text-muted-foreground hover:border-border/80 hover:bg-background/70 hover:text-foreground",
										)}
										aria-pressed={isActive}
										disabled={!mounted}
										onClick={(event) => {
											if (isAppTheme(option.value)) {
												void animateThemeChange(event.currentTarget, () => {
													setTheme(option.value);
												});
											}
										}}
									>
										<Icon />
										<span className="truncate">{option.label}</span>
									</button>
								);
							})}
						</div>
					</div>
				</DropdownMenuLabel>
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
		</>
	);
}
