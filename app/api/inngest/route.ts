import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { syncJob } from "@/lib/inngest/syncJob";

export const { GET, POST } = serve({ client: inngest, functions: [syncJob] });

export async function OPTIONS() {
	return new Response(null, {
		status: 204,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
	});
}
