import { withTracing } from "@posthog/ai";
import { env } from "@repo/env/web";
import {
	convertToModelMessages,
	createGateway,
	stepCountIs,
	streamText,
	type UIMessage,
} from "ai";
import { after } from "next/server";
import { PostHog } from "posthog-node";
import { tools } from "@/ai/tools";
import { getServerSession } from "@/lib/auth";

export async function POST(req: Request) {
	const sessionData = await getServerSession();
	const traceId = crypto.randomUUID();

	if (!sessionData?.user || !sessionData?.session?.activeOrganizationId) {
		return new Response("Unauthorized: No active organization found", {
			status: 401,
		});
	}

	const {
		messages,
		id: conversationId,
	}: { messages: UIMessage[]; id?: string } = await req.json();

	if (!conversationId) {
		return new Response("No chat Id", { status: 400 });
	}

	const gateway = createGateway({});

	const phClient = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
		host: env.NEXT_PUBLIC_POSTHOG_HOST,
	});
	const model = withTracing(gateway("openai/gpt-5-nano"), phClient, {
		posthogDistinctId: sessionData.user.id,
		posthogTraceId: traceId,
		posthogProperties: {
			conversationId: conversationId,
			$ai_session_id: conversationId,
		},
		posthogPrivacyMode: false,
		posthogGroups: { organization: sessionData.session.activeOrganizationId },
	});

	const result = streamText({
		model: model,
		messages: await convertToModelMessages(messages),
		tools: tools,
		stopWhen: stepCountIs(5),
	});

	after(() => {
		phClient.shutdown();
	});
	return result.toUIMessageStreamResponse();
}
