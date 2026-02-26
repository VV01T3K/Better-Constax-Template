import { useEffect } from "react";

import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { useSignOutMutationOptions } from "@/lib/auth/client";

export const Route = createFileRoute("/auth/sign-out")({
	component: SignOutPage,
});

function SignOutPage() {
	const navigate = useNavigate();
	const signOut = useMutation({
		...useSignOutMutationOptions({
			onSuccess: () => {
				navigate({ to: "/" });
			},
		}),
	});

	useEffect(() => {
		signOut.mutate();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <p className="text-sm text-muted-foreground">Signing out...</p>;
}
