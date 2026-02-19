import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

async function getNames(): Promise<string[]> {
	const res = await fetch("/demo/legacy/api/names");
	const data: unknown = await res.json();

	if (Array.isArray(data) && data.every((item) => typeof item === "string")) {
		return data;
	}

	return [];
}

export const Route = createFileRoute("/demo/legacy/start/api-request")({
	component: Home,
});

function Home() {
	const { data: names = [] } = useQuery({
		queryKey: ["names"],
		queryFn: getNames,
	});

	return (
		<div
			className="flex min-h-screen items-center justify-center p-4 text-white"
			style={{
				backgroundColor: "#000",
				backgroundImage:
					"radial-gradient(ellipse 60% 60% at 0% 100%, #444 0%, #222 60%, #000 100%)",
			}}
		>
			<div className="w-full max-w-2xl rounded-xl border-8 border-black/10 bg-black/80 p-8 shadow-xl">
				<h1 className="mb-4 text-2xl">Start API Request Demo - Names List</h1>
				<ul className="mb-4 space-y-2">
					{names.map((name) => (
						<li key={name} className="rounded-lg border border-white/20 bg-white/20 p-3 shadow-md">
							<span className="text-lg text-white">{name}</span>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
