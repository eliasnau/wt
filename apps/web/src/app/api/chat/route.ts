import { withTracing } from "@posthog/ai";
import { auth } from "@repo/auth";
import { db, eq } from "@repo/db";
import { organization } from "@repo/db/schema";
import {
	convertToModelMessages,
	stepCountIs,
	streamText,
	type UIMessage,
} from "ai";
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

	const phClient = new PostHog(
		"phc_5IpoPfDwxD67IpBzfbF51WSGFA6Jw6CXuWD3LZNIlE2",
		{ host: "https://eu.i.posthog.com" },
	);

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

Scope and behavior:
- Keep responses focused on this organization and school operations.
- Explain clearly and practically when users ask for details or why something was done.
- Use tools to read data whenever data is needed; do not guess records.

Tool usage:
- Use \`members\` for member data with actions: \`search\`, \`count\`, \`byGroup\`, \`byId\`.
- For member lists, call \`members\` with action \`search\` and no query.
- For a member identified by name/email/phone, call \`members\` \`search\` first, then \`byId\` with the chosen \`memberId\`.
- Use \`byId\` directly only when \`memberId\` is already known.
- Use \`groups\` for group data with actions: \`search\`, \`count\`, \`byId\`, \`byMember\`.
- For group lists, call \`groups\` with action \`search\` and no query.
- For group totals, call \`groups\` with action \`count\`.
- If asked which groups a member is in, call \`groups\` with action \`byMember\` (resolve \`memberId\` first if needed).
- Use \`searchDocs\` to find relevant MatDesk documentation pages.
- For how-to, onboarding, troubleshooting, API, or feature-explainer questions, call \`searchDocs\` and include relevant docs links in the answer.

Formatting:
- Always answer in Markdown.
- You can use all common Markdown features, including tables, fenced code blocks, Mermaid diagrams, and KaTeX.
- The renderer supports GitHub Flavored Markdown (GFM), including tables, task lists, strikethrough, and autolinks.
- Tables support alignment and are ideal for structured comparisons or list-like results.
- Use tables for list-style results when it improves readability; do not force tables when short bullets are clearer.
- If the user asks to export a list, prefer a normal Markdown table (the UI can export tables as \`.md\` and \`.csv\`).
- Users usually do not care about internal IDs; include IDs only when they are useful to the task.`,
		messages: await convertToModelMessages(messages),
		stopWhen: stepCountIs(5),
		tools: createTools(session.organizationId),
	});

	return result.toUIMessageStreamResponse();
}
