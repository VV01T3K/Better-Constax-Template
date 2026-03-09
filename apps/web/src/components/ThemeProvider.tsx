import {
	ThemeProvider as NextThemesProvider,
	useTheme as useNextTheme,
	type ThemeProviderProps,
} from "next-themes";

export type AppTheme = "light" | "dark" | "system";
export type ResolvedAppTheme = Exclude<AppTheme, "system">;

type AppThemeContext = ReturnType<typeof useNextTheme> & {
	theme: AppTheme | undefined;
	resolvedTheme: ResolvedAppTheme | undefined;
	setTheme: (theme: AppTheme) => void;
};

function isAppTheme(value: string | undefined): value is AppTheme {
	return value === "light" || value === "dark" || value === "system";
}

function isResolvedAppTheme(value: string | undefined): value is ResolvedAppTheme {
	return value === "light" || value === "dark";
}

export function ThemeProvider({
	children,
	...props
}: Omit<
	ThemeProviderProps,
	"attribute" | "defaultTheme" | "disableTransitionOnChange" | "enableSystem"
>) {
	return (
		<NextThemesProvider
			attribute="class"
			defaultTheme="system"
			disableTransitionOnChange
			enableSystem
			{...props}
		>
			{children}
		</NextThemesProvider>
	);
}

export function useTheme(): AppThemeContext {
	const theme = useNextTheme();
	const appTheme = isAppTheme(theme.theme) ? theme.theme : undefined;
	const resolvedTheme = isResolvedAppTheme(theme.resolvedTheme) ? theme.resolvedTheme : undefined;

	return {
		...theme,
		theme: appTheme,
		resolvedTheme,
		setTheme: (nextTheme) => {
			theme.setTheme(nextTheme);
		},
	};
}
