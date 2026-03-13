import { withTracing } from "@posthog/ai";
import { auth } from "@repo/auth";
import { checkAutumnFeature, trackAutumnUsage } from "@repo/autumn/backend";
import { db, eq } from "@repo/db";
import { organization } from "@repo/db/schema";
import {
	convertToModelMessages,
	stepCountIs,
	streamText,
	type UIMessage,
} from "ai";
import { after } from "next/server";
import { PostHog } from "posthog-node";
import { DEFAULT_CHAT_MODEL_ID, getChatModel } from "@/ai/models";

import { createTools } from "./_tools";

const getOrganizationSession = async (req: Request) => {
	const sessionData = await auth.api.getSession({ headers: req.headers });
	if (!sessionData?.session?.activeOrganizationId) return null;
	const activeOrganizationId = sessionData.session.activeOrganizationId;
	const [activeOrganization] = await db
		.select({ name: organization.name })
		.from(organization)
		.where(eq(organization.id, activeOrganizationId))
		.limit(1);

	return {
		organizationId: activeOrganizationId,
		organizationName: activeOrganization?.name ?? "Unknown organization",
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
	const rawBody = (await req.json()) as {
		messages?: UIMessage[];
		model?: string;
	};
	const messages = rawBody.messages;
	if (!Array.isArray(messages)) {
		return new Response(JSON.stringify({ error: "Invalid request payload." }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const requestedModelId =
		typeof rawBody.model === "string" ? rawBody.model.trim() : undefined;
	if (requestedModelId && !getChatModel(requestedModelId)) {
		return new Response(
			JSON.stringify({ error: `Unsupported model: ${requestedModelId}` }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const selectedModel = getChatModel(requestedModelId ?? DEFAULT_CHAT_MODEL_ID);
	if (!selectedModel) {
		return new Response(
			JSON.stringify({ error: "No default chat model configured." }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}

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

	const aiMessagesAccess = await checkAutumnFeature({
		customerId: session.organizationId,
		featureId: "ai_messages",
		requiredBalance: 1,
	});
	if (!aiMessagesAccess.allowed) {
		return new Response(
			JSON.stringify({ error: "KI-Nachrichten-Limit erreicht." }),
			{ status: 402, headers: { "Content-Type": "application/json" } },
		);
	}

	const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
	if (!posthogKey) {
		return new Response(
			JSON.stringify({ error: "PostHog is not configured." }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}

	const phClient = new PostHog(posthogKey, {
		host: "https://eu.i.posthog.com",
	});

	const model = withTracing(selectedModel.model, phClient, {
		posthogDistinctId: session.userId,
		posthogTraceId:
			messages.length > 0 ? messages[messages.length - 1].id : undefined,
		// posthogProperties: { conversationId: "abc123", paid: true }, // optional
		posthogPrivacyMode: false,
		posthogGroups: { organization: session.organizationId },
	});

	const result = streamText({
		model,
		system: `You are MatDesk AI, a helpful assistant for a martial arts school management platform.

Context:
- Organization: ${session.organizationName} (id: ${session.organizationId})
- User: ${session.userName}

Rules:
- Stay focused on this organization and school operations. Be clear and practical.
- Use tools for data; do not guess records.
- Maximum 10 reasoning/tool rounds. If that is not enough, ask a short clarification question.
- Member email and phone are sensitive. Request them only when necessary by passing \`includeFields\` with only the needed fields.
- If contact-data access is denied, do not retry. If that data is required, give a short plain reply that access was denied and the request cannot be completed without approval. Do not call unrelated tools or ask follow-up questions in the same response.

Tool guide:
- \`queryMembers\`: member searches, lists, pagination, status filters, and expiring contracts. Use \`contractEndingWithinDays: 30\` by default for "ending soon" requests unless the user specifies another range. Include cancelled-but-active members by default unless the user excludes them.
- \`getMemberInfo\`: single-member details by exact \`memberId\`. Resolve the ID with \`queryMembers\` first when needed.
- \`listGroups\`: group discovery and group-name resolution. If searching members by group name, resolve the group with \`listGroups\` first, then pass the group id to \`queryMembers\`.
- \`getNumbers\`: totals and summary counts. Treat active members as including cancellations not yet effective.
- \`searchDocs\`: how-to, onboarding, troubleshooting, API, and feature explanations. Include relevant docs links in the answer.

Formatting:
- Always answer in Markdown.
- Use tables when they improve readability, especially for export-style lists.
- Users usually do not care about internal IDs; include them only when useful.
- If the user asks for "all" of something and a tool can answer directly, just run the tool and answer.`,
		messages: await convertToModelMessages(messages),
		stopWhen: stepCountIs(10),
		tools: createTools(session.organizationId),
		onFinish: async ({ totalUsage }) => {
			const totalTokens = totalUsage.totalTokens;

			if (typeof totalTokens !== "number" || totalTokens <= 0) {
				return;
			}

			await trackAutumnUsage({
				customerId: session.organizationId,
				featureId: "ai_messages",
				value: 1,
				idempotencyKey: messages.at(-1)?.id,
			});
		},
	});

	after(() => {
		void result.consumeStream({
			onError: (error) => {
				console.error("web chat stream consume failed", error);
			},
		});
	});

	return result.toUIMessageStreamResponse();
}
