import { createFileRoute } from "@tanstack/react-router";

import { handler } from "@/lib/auth-server";

export const Route = createFileRoute("/api/auth/$")({});

export const GET = ({ request }: { request: Request }) => handler(request);
export const POST = ({ request }: { request: Request }) => handler(request);
