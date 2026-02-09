import {
	streamText,
	tool,
	gateway,
	type UIMessage,
	convertToModelMessages,
	stepCountIs,
} from "ai";
import { z } from "zod";
import { auth } from "@repo/auth";
import { and, count, db, eq, ilike, or, sql, inArray } from "@repo/db";
import { clubMember, contract, group, groupMember } from "@repo/db/schema";
import { withTracing } from "@posthog/ai"
import { PostHog } from "posthog-node";


const searchMembersInput = z.object({
	query: z
		.string()
		.trim()
		.optional()
		.describe("Search by name, email, or phone. Use empty to list all."),
	limit: z
		.number()
		.int()
		.min(1)
		.max(50)
		.optional()
		.describe("Maximum number of members to return."),
});

const getMemberInfoInput = z
	.object({
		memberId: z.string().uuid().optional(),
		query: z
			.string()
			.trim()
			.min(1)
			.optional()
			.describe("Member name, email, or phone when memberId is unknown."),
	})
	.refine((value) => value.memberId || value.query, {
		message: "Provide either memberId or query.",
	});

const getOrganizationSession = async (req: Request) => {
	const sessionData = await auth.api.getSession({ headers: req.headers });
	if (!sessionData?.session?.activeOrganizationId) return null;
	return {
		organizationId: sessionData.session.activeOrganizationId,
		userName: sessionData.user.name,
		userId: sessionData.user.id
	};
};

const getSchoolStats = async (organizationId: string) => {
	return new Promise(async (resolve, reject) => {
		try {
			const [{ count: totalMembers = 0 } = { count: 0 }] = await db
				.select({ count: count() })
				.from(clubMember)
				.where(eq(clubMember.organizationId, organizationId));

			const [{ count: activeMembers = 0 } = { count: 0 }] = await db
				.select({ count: count() })
				.from(clubMember)
				.innerJoin(contract, eq(contract.memberId, clubMember.id))
				.where(
					and(
						eq(clubMember.organizationId, organizationId),
						sql`(
							${contract.cancellationEffectiveDate} IS NULL
							OR ${contract.cancellationEffectiveDate} >= CURRENT_DATE
						)`
					)
				);

			const [{ count: totalGroups = 0 } = { count: 0 }] = await db
				.select({ count: count() })
				.from(group)
				.where(eq(group.organizationId, organizationId));

			resolve({
				totalMembers,
				activeMembers,
				totalGroups,
			});
		} catch (error) {
			reject(error);
		}
	});
};

const createTools = (organizationId: string) => ({
	searchMembers: tool({
		description:
			"Search or list members of the current organization. Max 50 results.",
		inputSchema: searchMembersInput,
		execute: async ({ query, limit }) => {
			const safeLimit = Math.min(limit ?? 20, 50);
			const normalizedQuery =
				query && query.trim() !== "*" ? query.trim() : undefined;
			const like = normalizedQuery ? `%${normalizedQuery}%` : undefined;

			const memberWhere = and(
				eq(clubMember.organizationId, organizationId),
				normalizedQuery
					? or(
							ilike(clubMember.firstName, like!),
							ilike(clubMember.lastName, like!),
							ilike(clubMember.email, like!),
							ilike(clubMember.phone, like!),
							ilike(
								sql`${clubMember.firstName} || ' ' || ${clubMember.lastName}`,
								like!,
							),
						)
					: undefined,
				sql`EXISTS (
					SELECT 1 FROM ${contract}
					WHERE ${contract.memberId} = ${clubMember.id}
					AND (
						${contract.cancellationEffectiveDate} IS NULL
						OR ${contract.cancellationEffectiveDate} >= CURRENT_DATE
					)
				)`,
			);

			const members = await db
				.select({
					id: clubMember.id,
					firstName: clubMember.firstName,
					lastName: clubMember.lastName,
					email: clubMember.email,
					phone: clubMember.phone,
					joinedAt: clubMember.createdAt,
					contractStartDate: contract.startDate,
					contractInitialPeriod: contract.initialPeriod,
					contractNextBillingDate: contract.nextBillingDate,
					contractCurrentPeriodEndDate: contract.currentPeriodEndDate,
					contractCancellationEffectiveDate: contract.cancellationEffectiveDate,
				})
				.from(clubMember)
				.innerJoin(contract, eq(contract.memberId, clubMember.id))
				.where(memberWhere)
				.limit(safeLimit);

			const memberIds = members.map((member) => member.id);
			const groupsByMember = new Map<string, string[]>();

			if (memberIds.length > 0) {
				const groupRows = await db
					.select({
						memberId: groupMember.memberId,
						groupName: group.name,
					})
					.from(groupMember)
					.innerJoin(group, eq(group.id, groupMember.groupId))
					.where(inArray(groupMember.memberId, memberIds));

				for (const row of groupRows) {
					const list = groupsByMember.get(row.memberId) ?? [];
					list.push(row.groupName);
					groupsByMember.set(row.memberId, list);
				}
			}

			return {
				count: members.length,
				members: members.map((member) => ({
					id: member.id,
					name: `${member.firstName} ${member.lastName}`.trim(),
					email: member.email,
					phone: member.phone,
					joinedAt: member.joinedAt,
					contract: {
						startDate: member.contractStartDate,
						initialPeriod: member.contractInitialPeriod,
						nextBillingDate: member.contractNextBillingDate,
						currentPeriodEndDate: member.contractCurrentPeriodEndDate,
						cancellationEffectiveDate: member.contractCancellationEffectiveDate,
					},
					groups: groupsByMember.get(member.id) ?? [],
				})),
			};
		},
	}),
	getMemberInfo: tool({
		description:
			"Get detailed information about one member, including contract and groups.",
		inputSchema: getMemberInfoInput,
		execute: async ({ memberId, query }) => {
			const normalizedQuery =
				query && query.trim() !== "*" ? query.trim() : undefined;
			const like = normalizedQuery ? `%${normalizedQuery}%` : undefined;

			const memberWhere = and(
				eq(clubMember.organizationId, organizationId),
				memberId ? eq(clubMember.id, memberId) : undefined,
				!memberId && normalizedQuery
					? or(
							ilike(clubMember.firstName, like!),
							ilike(clubMember.lastName, like!),
							ilike(clubMember.email, like!),
							ilike(clubMember.phone, like!),
							ilike(
								sql`${clubMember.firstName} || ' ' || ${clubMember.lastName}`,
								like!,
							),
						)
					: undefined,
			);

			const member = await db
				.select({
					id: clubMember.id,
					firstName: clubMember.firstName,
					lastName: clubMember.lastName,
					email: clubMember.email,
					phone: clubMember.phone,
					street: clubMember.street,
					city: clubMember.city,
					state: clubMember.state,
					postalCode: clubMember.postalCode,
					country: clubMember.country,
					notes: clubMember.notes,
					guardianName: clubMember.guardianName,
					guardianEmail: clubMember.guardianEmail,
					guardianPhone: clubMember.guardianPhone,
					joinedAt: clubMember.createdAt,
					contractId: contract.id,
					contractInitialPeriod: contract.initialPeriod,
					contractStartDate: contract.startDate,
					contractInitialPeriodEndDate: contract.initialPeriodEndDate,
					contractCurrentPeriodEndDate: contract.currentPeriodEndDate,
					contractNextBillingDate: contract.nextBillingDate,
					contractJoiningFeeAmount: contract.joiningFeeAmount,
					contractYearlyFeeAmount: contract.yearlyFeeAmount,
					contractCancelledAt: contract.cancelledAt,
					contractCancellationEffectiveDate: contract.cancellationEffectiveDate,
					contractNotes: contract.notes,
				})
				.from(clubMember)
				.leftJoin(contract, eq(contract.memberId, clubMember.id))
				.where(memberWhere)
				.limit(1);

			if (member.length === 0) {
				return {
					found: false,
					message: "Member not found.",
				};
			}

			const selected = member[0];

			const memberGroups = await db
				.select({
					groupId: group.id,
					groupName: group.name,
				})
				.from(groupMember)
				.innerJoin(group, eq(group.id, groupMember.groupId))
				.where(eq(groupMember.memberId, selected.id));

			return {
				found: true,
				member: {
					id: selected.id,
					name: `${selected.firstName} ${selected.lastName}`.trim(),
					email: selected.email,
					phone: selected.phone,
					joinedAt: selected.joinedAt,
					address: {
						street: selected.street,
						city: selected.city,
						state: selected.state,
						postalCode: selected.postalCode,
						country: selected.country,
					},
					guardian: {
						name: selected.guardianName,
						email: selected.guardianEmail,
						phone: selected.guardianPhone,
					},
					notes: selected.notes,
					groups: memberGroups.map((item) => ({
						id: item.groupId,
						name: item.groupName,
					})),
					contract: selected.contractId
						? {
								id: selected.contractId,
								initialPeriod: selected.contractInitialPeriod,
								startDate: selected.contractStartDate,
								initialPeriodEndDate: selected.contractInitialPeriodEndDate,
								currentPeriodEndDate: selected.contractCurrentPeriodEndDate,
								nextBillingDate: selected.contractNextBillingDate,
								joiningFeeAmount: selected.contractJoiningFeeAmount,
								yearlyFeeAmount: selected.contractYearlyFeeAmount,
								cancelledAt: selected.contractCancelledAt,
								cancellationEffectiveDate:
									selected.contractCancellationEffectiveDate,
								notes: selected.contractNotes,
							}
						: null,
				},
			};
		},
	}),
	getSchoolStats: tool({
		description:
			"Get high-level school stats like total members and total groups.",
		inputSchema: z.object({}),
		execute: async () => getSchoolStats(organizationId),
	}),
	listGroups: tool({
		description: "List groups in the current organization.",
		inputSchema: z.object({
			limit: z.number().int().min(1).max(50).optional(),
		}),
		execute: async ({ limit }) => {
			const safeLimit = Math.min(limit ?? 25, 50);
			const groups = await db
				.select({
					id: group.id,
					name: group.name,
				})
				.from(group)
				.where(eq(group.organizationId, organizationId))
				.limit(safeLimit);
			return { count: groups.length, groups };
		},
	}),
});

export async function GET(req: Request) {
	const session = await getOrganizationSession(req);
	if (!session) {
		return new Response(
			JSON.stringify({ error: "Unauthorized: missing active organization." }),
			{ status: 401, headers: { "Content-Type": "application/json" } },
		);
	}

	const stats = await getSchoolStats(session.organizationId);
	return new Response(JSON.stringify(stats), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}

export async function POST(req: Request) {
	const { messages }: { messages: UIMessage[] } = await req.json();
	const session = await getOrganizationSession(req);

	if (!session) {
		return new Response(
			JSON.stringify({ error: "Unauthorized: missing active organization." }),
			{ status: 401, headers: { "Content-Type": "application/json" } },
		);
	}

	const phClient = new PostHog(
		'phc_5IpoPfDwxD67IpBzfbF51WSGFA6Jw6CXuWD3LZNIlE2',
		{ host: 'https://eu.i.posthog.com' }
	  );
	  
	
	const model = withTracing(gateway("openai/gpt-5-mini"), phClient, {
		posthogDistinctId: session.userId,
		posthogTraceId: messages.length > 0 ? messages[messages.length - 1].id : undefined,
		// posthogProperties: { conversationId: "abc123", paid: true }, // optional
		posthogPrivacyMode: false,
		posthogGroups: { organization: session.organizationId },
	  });
	  

	const result = streamText({
		model,
		system:
			`You are a helpful assistant for MatDesk, a martial arts school management platform. Keep the conversation related to the user's school. When listing members, call searchMembers with an empty query to list all (paginated) and never use "*". For one specific member, call getMemberInfo. Reply with Markdown your response is rendered in a Markdown component supporting github flavored md. Users usually do not care about UUIDs, so only include IDs when explicitly useful. Use tools to read school data. Context user: ${session.userName}.`,
		messages: await convertToModelMessages(messages),
		stopWhen: stepCountIs(5),
		tools: createTools(session.organizationId),
	});

	return result.toUIMessageStreamResponse();
}
