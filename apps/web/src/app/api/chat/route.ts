import { withTracing } from "@posthog/ai";
import { auth } from "@repo/auth";
import {
	convertToModelMessages,
	gateway,
	stepCountIs,
	streamText,
	type UIMessage,
} from "ai";
import { PostHog } from "posthog-node";

import { createTools } from "./_tools";

const getOrganizationSession = async (req: Request) => {
	const sessionData = await auth.api.getSession({ headers: req.headers });
	if (!sessionData?.session?.activeOrganizationId) return null;
	return {
		organizationId: sessionData.session.activeOrganizationId,
		userName: sessionData.user.name,
		userId: sessionData.user.id,
	};
};

const hasAiChatPermission = async (req: Request) => {
	const result = await auth.api.hasPermission({
		headers: req.headers,
		body: {
			permissions: {
				ai: ["chat"],
			},
		},
	});

	return result.success;
};

export async function POST(req: Request) {
	const { messages }: { messages: UIMessage[] } = await req.json();
	const session = await getOrganizationSession(req);

	if (!session) {
		return new Response(
			JSON.stringify({ error: "Unauthorized: missing active organization." }),
			{ status: 401, headers: { "Content-Type": "application/json" } },
		);
	}

	const canUseAiChat = await hasAiChatPermission(req);
	if (!canUseAiChat) {
		return new Response(
			JSON.stringify({ error: "Forbidden: missing ai.chat permission." }),
			{ status: 403, headers: { "Content-Type": "application/json" } },
		);
	}

	const phClient = new PostHog(
		"phc_5IpoPfDwxD67IpBzfbF51WSGFA6Jw6CXuWD3LZNIlE2",
		{ host: "https://eu.i.posthog.com" },
	);

	const model = withTracing(gateway("openai/gpt-5-mini"), phClient, {
		posthogDistinctId: session.userId,
		posthogTraceId:
			messages.length > 0 ? messages[messages.length - 1].id : undefined,
		// posthogProperties: { conversationId: "abc123", paid: true }, // optional
		posthogPrivacyMode: false,
		posthogGroups: { organization: session.organizationId },
	});

	const result = streamText({
		model,
		system: `You are a helpful assistant for MatDesk, a martial arts school management platform. Keep the conversation related to the user's school. Use the members tool for member data with actions: search, count, byGroup, byId. For listing members call members with action "search" and no query. If the user asks about a specific member by name/email/phone, call members with action "search" first, then call members with action "byId" using the selected memberId. Only call action "byId" directly when a memberId is already known. Use the groups tool for group data with actions: search, count, byId, byMember. For group lists call groups with action "search" and no query. For group totals call groups with action "count". If the user asks which groups a member is in, call groups with action "byMember" and that memberId (resolve memberId first if needed). Reply with Markdown your response is rendered in a Markdown component supporting github flavored md. Users usually do not care about IDs, so only include IDs when explicitly useful. Use tools to read school data. Context user: ${session.userName}.`,
		messages: await convertToModelMessages(messages),
		stopWhen: stepCountIs(5),
		tools: createTools(session.organizationId),
	});

	return result.toUIMessageStreamResponse();
}
