import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: Number.POSITIVE_INFINITY,
				gcTime: 5 * 60 * 1000,
				refetchOnWindowFocus: false,
				refetchOnReconnect: false,
				refetchOnMount: false,
			},
		},
	});
}
