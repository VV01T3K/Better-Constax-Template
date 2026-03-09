import { cn } from "@repo/ui/lib/utils";
import type { CSSProperties, ReactNode } from "react";

type DashedGridBackgroundProps = {
	children: ReactNode;
	className?: string;
};

type DashedGridStyle = CSSProperties & Record<"--grid-color", string>;

const gridStyle: DashedGridStyle = {
	"--grid-color": "color-mix(in oklab, var(--border) 78%, transparent)",
	backgroundImage: `
		linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
		linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)
	`,
	backgroundPosition: "0 0, 0 0",
	backgroundSize: "20px 20px",
	maskImage: `
		repeating-linear-gradient(
			to right,
			black 0px,
			black 3px,
			transparent 3px,
			transparent 8px
		),
		repeating-linear-gradient(
			to bottom,
			black 0px,
			black 3px,
			transparent 3px,
			transparent 8px
		)
	`,
	WebkitMaskImage: `
		repeating-linear-gradient(
			to right,
			black 0px,
			black 3px,
			transparent 3px,
			transparent 8px
		),
		repeating-linear-gradient(
			to bottom,
			black 0px,
			black 3px,
			transparent 3px,
			transparent 8px
		)
	`,
	maskComposite: "intersect",
	WebkitMaskComposite: "source-in",
};

export function DashedGridBackground({ children, className }: DashedGridBackgroundProps) {
	return (
		<div className={cn("bg-background relative isolate w-full", className)}>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 z-0 opacity-80"
				style={gridStyle}
			/>
			<div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
		</div>
	);
}
