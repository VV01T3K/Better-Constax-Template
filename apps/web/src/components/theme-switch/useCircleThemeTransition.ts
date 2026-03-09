import * as React from "react";
import { flushSync } from "react-dom";

type ViewTransition = {
	ready: Promise<void>;
};

type ViewTransitionDocument = Document & {
	startViewTransition?: (callback: () => void) => ViewTransition;
};

type UseCircleThemeTransitionOptions = {
	duration?: number;
	easing?: string;
	pseudoElement?: string;
};

const BASE_STYLE_ID = "theme-switch-base-style";

function ensureBaseStyles() {
	if (typeof document === "undefined" || document.getElementById(BASE_STYLE_ID)) {
		return;
	}

	const style = document.createElement("style");
	style.id = BASE_STYLE_ID;
	style.textContent = `
		::view-transition-old(root),
		::view-transition-new(root) {
			animation: none;
			mix-blend-mode: normal;
		}
	`;

	document.head.appendChild(style);
}

export function useCircleThemeTransition({
	duration = 750,
	easing = "ease-in-out",
	pseudoElement = "::view-transition-new(root)",
}: UseCircleThemeTransitionOptions = {}) {
	React.useEffect(() => {
		ensureBaseStyles();
	}, []);

	return React.useCallback(
		async (trigger: HTMLElement | null, commit: () => void) => {
			if (
				typeof window === "undefined" ||
				!trigger ||
				window.matchMedia("(prefers-reduced-motion: reduce)").matches
			) {
				commit();
				return;
			}

			const viewTransitionDocument = document as ViewTransitionDocument;

			if (!viewTransitionDocument.startViewTransition) {
				commit();
				return;
			}

			ensureBaseStyles();

			const { top, left, width, height } = trigger.getBoundingClientRect();
			const x = left + width / 2;
			const y = top + height / 2;
			const maxRadius = Math.max(
				Math.hypot(x, y),
				Math.hypot(window.innerWidth - x, y),
				Math.hypot(x, window.innerHeight - y),
				Math.hypot(window.innerWidth - x, window.innerHeight - y),
			);

			await viewTransitionDocument.startViewTransition(() => {
				flushSync(() => {
					commit();
				});
			}).ready;

			document.documentElement.animate(
				{
					clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`],
				},
				{
					duration,
					easing,
					pseudoElement,
				},
			);
		},
		[duration, easing, pseudoElement],
	);
}
