import { useQueryClient } from "@tanstack/react-query";
import {
	Outlet,
	createFileRoute,
	redirect,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
	ensureAuthIdentity,
	getCachedAuthIdentity,
	isAuthenticatedFromIdentity,
	warmAuthIdentity,
} from "../integrations/convex/auth-state";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ context, location }) => {
		if (typeof context.isAuthenticated === "boolean") {
			if (!context.isAuthenticated) {
				throw redirect({
					to: "/auth",
					search: {
						redirect: location.href,
					},
				});
			}

			return {
				isAuthenticated: context.isAuthenticated,
			};
		}

		const cachedAuthIdentity = getCachedAuthIdentity(context.queryClient);
		const cachedIsAuthenticated = isAuthenticatedFromIdentity(cachedAuthIdentity);

		if (typeof cachedIsAuthenticated === "boolean") {
			if (!cachedIsAuthenticated) {
				throw redirect({
					to: "/auth",
					search: {
						redirect: location.href,
					},
				});
			}

			return {
				isAuthenticated: cachedIsAuthenticated,
			};
		}

		if (import.meta.env.SSR) {
			const authIdentity = await ensureAuthIdentity(context.queryClient);
			const isAuthenticated = authIdentity !== null;

			if (!isAuthenticated) {
				throw redirect({
					to: "/auth",
					search: {
						redirect: location.href,
					},
				});
			}

			return {
				isAuthenticated,
			};
		}

		warmAuthIdentity(context.queryClient);
		return {
			isAuthenticated: undefined,
		};
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	const navigate = useNavigate();
	const location = useLocation();
	const queryClient = useQueryClient();
	const { isAuthenticated } = Route.useRouteContext();
	const [isAccessGranted, setIsAccessGranted] = useState(isAuthenticated === true);

	useEffect(() => {
		const redirectToAuth = () =>
			void navigate({
				to: "/auth",
				search: {
					redirect: location.href,
				},
				replace: true,
			});

		if (isAuthenticated === false) {
			setIsAccessGranted(false);
			redirectToAuth();
			return;
		}

		if (isAuthenticated === true) {
			setIsAccessGranted(true);
			return;
		}

		setIsAccessGranted(false);

		let isCancelled = false;
		const verifyAuth = async () => {
			try {
				const authIdentity = await ensureAuthIdentity(queryClient);
				if (isCancelled) {
					return;
				}

				if (authIdentity === null) {
					redirectToAuth();
					return;
				}

				setIsAccessGranted(true);
			} catch {
				if (!isCancelled) {
					redirectToAuth();
				}
			}
		};
		void verifyAuth();

		return () => {
			isCancelled = true;
		};
	}, [isAuthenticated, location.href, navigate, queryClient]);

	if (!isAccessGranted) {
		return null;
	}

	return <Outlet />;
}
