import { and, count, db, desc, eq, inArray, isNotNull, isNull, wsDb } from "..";
import {
	clubMember,
	contract,
	group,
	groupMember,
	organization,
	sepaMandate,
	selfRegistration,
} from "../schema";

function normalizeCents(
	value?: number | string | null,
): number | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}

	if (typeof value === "number") {
		if (!Number.isInteger(value) || value < 0) {
			throw new Error("Invalid money amount");
		}

		return value;
	}

	const normalizedValue = value.trim().replace(/\s+/g, "");

	if (normalizedValue === "") {
		return undefined;
	}

	if (!/^\d+$/.test(normalizedValue)) {
		throw new Error("Invalid cents amount");
	}

	const parsedValue = Number.parseInt(normalizedValue, 10);
	if (!Number.isFinite(parsedValue) || parsedValue < 0) {
		throw new Error("Invalid cents amount");
	}

	return parsedValue;
}

async function resolveGroupMembershipPrice({
	groupId,
	membershipPriceCents,
}: {
	groupId: string;
	membershipPriceCents?: number | string | null;
}) {
	const normalizedMembershipPriceCents = normalizeCents(
		membershipPriceCents,
	);

	if (normalizedMembershipPriceCents !== undefined) {
		return normalizedMembershipPriceCents;
	}

	const existingGroup = await db.query.group.findFirst({
		where: (fields, { eq }) => eq(fields.id, groupId),
		columns: {
			defaultMembershipPriceCents: true,
		},
	});

	if (!existingGroup) {
		throw new Error("Group not found");
	}

	if (existingGroup.defaultMembershipPriceCents !== null) {
		return existingGroup.defaultMembershipPriceCents;
	}

	return 0;
}

export const DB = {
	query: {
		members: {
			getMemberById: async ({ id }: { id: string }) => {
				return db.query.clubMember.findFirst({
					where: (fields, { eq }) => eq(fields.id, id),
					columns: {
						id: true,
						organizationId: true,
						firstName: true,
						lastName: true,
						birthdate: true,
						email: true,
						phone: true,
						street: true,
						city: true,
						state: true,
						postalCode: true,
						country: true,
						notes: true,
						guardianName: true,
						guardianEmail: true,
						guardianPhone: true,
						createdAt: true,
						updatedAt: true,
					},
				});
			},
			getMembersPaymentInfo: async ({ id }: { id: string }) => {
				return db.query.clubMember.findFirst({
					where: (fields, { eq }) => eq(fields.id, id),
					columns: {
						id: true,
						organizationId: true,
						iban: true,
						bic: true,
						cardHolder: true,
					},
				});
			},
			getMemberWithDetails: async ({ memberId }: { memberId: string }) => {
				const results = await db
					.select({
						// Member fields
						id: clubMember.id,
						firstName: clubMember.firstName,
						lastName: clubMember.lastName,
						birthdate: clubMember.birthdate,
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
						organizationId: clubMember.organizationId,
						createdAt: clubMember.createdAt,
						updatedAt: clubMember.updatedAt,
						// Contract information
						contractId: contract.id,
						contractStartDate: contract.startDate,
						contractStatus: contract.status,
						contractInitialPeriod: contract.initialPeriod,
						contractInitialPeriodEndDate: contract.initialPeriodEndDate,
						contractJoiningFeeCents: contract.joiningFeeCents,
						contractYearlyFeeCents: contract.yearlyFeeCents,
						contractNotes: contract.notes,
						contractCancelledAt: contract.cancelledAt,
						contractCancelReason: contract.cancellationReason,
						contractCancellationEffectiveDate:
							contract.cancellationEffectiveDate,
						// Group membership fields
						groupId: groupMember.groupId,
						membershipPriceCents: groupMember.membershipPriceCents,
						groupMemberCreatedAt: groupMember.createdAt,
						groupName: group.name,
						groupDescription: group.description,
						groupColor: group.color,
						groupDefaultMembershipPriceCents: group.defaultMembershipPriceCents,
					})
					.from(clubMember)
					.innerJoin(contract, eq(contract.memberId, clubMember.id))
					.leftJoin(groupMember, eq(groupMember.memberId, clubMember.id))
					.leftJoin(group, eq(group.id, groupMember.groupId))
					.where(eq(clubMember.id, memberId));

				if (results.length === 0 || !results[0]) {
					return null;
				}

				// Aggregate the results - first row has member data, collect all groups
				const firstRow = results[0];
				const groups = results
					.filter((row) => row.groupId !== null)
					.map((row) => ({
						groupId: row.groupId!,
						membershipPriceCents: row.membershipPriceCents,
						joinedAt: row.groupMemberCreatedAt,
						group: {
							id: row.groupId!,
							name: row.groupName!,
							description: row.groupDescription,
							color: row.groupColor,
							defaultMembershipPriceCents:
								row.groupDefaultMembershipPriceCents,
						},
					}));

				return {
					id: firstRow.id,
					firstName: firstRow.firstName,
					lastName: firstRow.lastName,
					birthdate: firstRow.birthdate,
					email: firstRow.email,
					phone: firstRow.phone,
					street: firstRow.street,
					city: firstRow.city,
					state: firstRow.state,
					postalCode: firstRow.postalCode,
					country: firstRow.country,
					notes: firstRow.notes,
					guardianName: firstRow.guardianName,
					guardianEmail: firstRow.guardianEmail,
					guardianPhone: firstRow.guardianPhone,
					organizationId: firstRow.organizationId,
					createdAt: firstRow.createdAt,
					updatedAt: firstRow.updatedAt,
					contract: {
						id: firstRow.contractId,
						startDate: firstRow.contractStartDate,
						status: firstRow.contractStatus,
						initialPeriod: firstRow.contractInitialPeriod,
						initialPeriodEndDate: firstRow.contractInitialPeriodEndDate,
						joiningFeeCents: firstRow.contractJoiningFeeCents,
						yearlyFeeCents: firstRow.contractYearlyFeeCents,
						notes: firstRow.contractNotes,
						cancelledAt: firstRow.contractCancelledAt,
						cancelReason: firstRow.contractCancelReason,
						cancellationEffectiveDate:
							firstRow.contractCancellationEffectiveDate,
					},
					groups,
				};
			},
		},
		groups: {
			listGroups: async ({ organizationId }: { organizationId: string }) => {
				return db
					.select()
					.from(group)
					.where(eq(group.organizationId, organizationId));
			},
			getGroupById: async ({ groupId }: { groupId: string }) => {
				const result = await db
					.select()
					.from(group)
					.where(eq(group.id, groupId))
					.limit(1);

				return result[0] || null;
			},
			getGroupMembers: async ({ groupId }: { groupId: string }) => {
				return db
					.select({
						// Member fields
						memberId: clubMember.id,
						firstName: clubMember.firstName,
						lastName: clubMember.lastName,
						birthdate: clubMember.birthdate,
						email: clubMember.email,
						phone: clubMember.phone,
						street: clubMember.street,
						city: clubMember.city,
						state: clubMember.state,
						postalCode: clubMember.postalCode,
						country: clubMember.country,
						notes: clubMember.notes,
						memberCreatedAt: clubMember.createdAt,
						memberUpdatedAt: clubMember.updatedAt,
						// Group membership fields
						membershipPriceCents: groupMember.membershipPriceCents,
						joinedAt: groupMember.createdAt,
					})
					.from(groupMember)
					.innerJoin(clubMember, eq(clubMember.id, groupMember.memberId))
					.where(eq(groupMember.groupId, groupId));
			},
			getGroupMemberCount: async ({ groupId }: { groupId: string }) => {
				const result = await db
					.select({ count: count() })
					.from(groupMember)
					.where(eq(groupMember.groupId, groupId));

				return result[0]?.count || 0;
			},
		},
		selfRegistrations: {
			listConfigsByOrganization: async ({
				organizationId,
			}: {
				organizationId: string;
			}) => {
				return db
					.select()
					.from(selfRegistration)
					.where(eq(selfRegistration.organizationId, organizationId))
					.orderBy(desc(selfRegistration.createdAt));
			},
			getConfigById: async ({ id }: { id: string }) => {
				const [result] = await db
					.select()
					.from(selfRegistration)
					.where(eq(selfRegistration.id, id))
					.limit(1);
				return result || null;
			},
			getConfigByIdWithGroups: async ({ id }: { id: string }) => {
				const [result] = await db
					.select()
					.from(selfRegistration)
					.where(eq(selfRegistration.id, id))
					.limit(1);
				if (!result) return null;
				return {
					...result,
					groups: result.groupsSnapshot,
				};
			},
			getConfigByCode: async ({ code }: { code: string }) => {
				const [row] = await db
					.select()
					.from(selfRegistration)
					.where(eq(selfRegistration.code, code))
					.limit(1);

				return row || null;
			},
			getActiveConfigByCodeWithGroups: async ({ code }: { code: string }) => {
				const [row] = await db
					.select()
					.from(selfRegistration)
					.where(
						and(
							eq(selfRegistration.code, code),
							eq(selfRegistration.isActive, true),
						),
					)
					.limit(1);

				if (!row) return null;
				return {
					...row,
					groups: row.groupsSnapshot,
				};
			},
			listGroupsByIdsAndOrganization: async ({
				organizationId,
				groupIds,
			}: {
				organizationId: string;
				groupIds: string[];
			}) => {
				if (groupIds.length === 0) return [];
				return db
					.select({
						id: group.id,
						name: group.name,
					})
					.from(group)
					.where(
						and(
							eq(group.organizationId, organizationId),
							inArray(group.id, groupIds),
						),
					);
			},
			getOrganizationById: async ({ id }: { id: string }) => {
				const [result] = await db
					.select({
						id: organization.id,
						name: organization.name,
						logo: organization.logo,
					})
					.from(organization)
					.where(eq(organization.id, id))
					.limit(1);
				return result || null;
			},
			listSubmissionsByOrganization: async ({
				organizationId,
				status,
			}: {
				organizationId: string;
				status?: "submitted" | "created";
			}) => {
				const baseWhere = eq(selfRegistration.organizationId, organizationId);
				const whereClause =
					status === "submitted"
						? and(
								baseWhere,
								eq(selfRegistration.submitted, true),
								isNull(selfRegistration.memberId),
							)
						: status === "created"
							? and(baseWhere, isNotNull(selfRegistration.memberId))
							: baseWhere;

				return db
					.select({
						id: selfRegistration.id,
						organizationId: selfRegistration.organizationId,
						code: selfRegistration.code,
						memberId: selfRegistration.memberId,
						submitted: selfRegistration.submitted,
						status: selfRegistration.status,
						firstName: selfRegistration.firstName,
						lastName: selfRegistration.lastName,
						email: selfRegistration.email,
						phone: selfRegistration.phone,
						birthdate: selfRegistration.birthdate,
						street: selfRegistration.street,
						city: selfRegistration.city,
						state: selfRegistration.state,
						postalCode: selfRegistration.postalCode,
						country: selfRegistration.country,
						accountHolder: selfRegistration.accountHolder,
						iban: selfRegistration.iban,
						bic: selfRegistration.bic,
						submittedAt: selfRegistration.submittedAt,
						createdAt: selfRegistration.createdAt,
						updatedAt: selfRegistration.updatedAt,
						configName: selfRegistration.name,
					})
					.from(selfRegistration)
					.where(whereClause)
					.orderBy(
						desc(selfRegistration.submittedAt),
						desc(selfRegistration.createdAt),
					);
			},
			getSubmissionById: async ({ id }: { id: string }) => {
				const [result] = await db
					.select()
					.from(selfRegistration)
					.where(eq(selfRegistration.id, id))
					.limit(1);
				return result || null;
			},
			getSubmissionByConfigId: async ({ configId }: { configId: string }) => {
				const [result] = await db
					.select()
					.from(selfRegistration)
					.where(eq(selfRegistration.id, configId))
					.limit(1);
				return result || null;
			},
		},
	},
	mutation: {
		members: {
			updateMember: async ({
				memberId,
				organizationId,
				memberData,
				contractData,
			}: {
				memberId: string;
				organizationId: string;
				memberData: {
					firstName: string;
					lastName: string;
					email?: string | null;
					phone?: string | null;
					birthdate?: string;
					street: string;
					city: string;
					state: string;
					postalCode: string;
					country: string;
					latitude?: number | null;
					longitude?: number | null;
					notes?: string;
					guardianName?: string;
					guardianEmail?: string;
					guardianPhone?: string;
				};
				contractData: {
					// initialPeriod: string;
					joiningFeeCents?: number;
					yearlyFeeCents?: number;
					yearlyFeeMode?: "january" | "anniversary";
					settledThroughDate?: string;
					cancellationReason?: string;
					notes?: string;
				};
			}) => {
				return wsDb.transaction(async (tx) => {
					const [updatedMember] = await tx
						.update(clubMember)
						.set({
							firstName: memberData.firstName,
							lastName: memberData.lastName,
							email: memberData.email,
							phone: memberData.phone,
							birthdate: memberData.birthdate,
							street: memberData.street,
							city: memberData.city,
							state: memberData.state,
							postalCode: memberData.postalCode,
							country: memberData.country,
							latitude: memberData.latitude,
							longitude: memberData.longitude,
							notes: memberData.notes,
							guardianName: memberData.guardianName,
							guardianEmail: memberData.guardianEmail,
							guardianPhone: memberData.guardianPhone,
						})
						.where(
							and(
								eq(clubMember.id, memberId),
								eq(clubMember.organizationId, organizationId),
							),
						)
						.returning();

					if (!updatedMember) {
						throw new Error("Failed to update member");
					}

					const contractUpdateValues = Object.fromEntries(
						Object.entries({
							// initialPeriod: contractData.initialPeriod,
							joiningFeeCents: contractData.joiningFeeCents,
							yearlyFeeCents: contractData.yearlyFeeCents,
							yearlyFeeMode: contractData.yearlyFeeMode,
							settledThroughDate: contractData.settledThroughDate,
							cancellationReason: contractData.cancellationReason,
							notes: contractData.notes,
						}).filter(([, value]) => value !== undefined),
					);

					let updatedContract: typeof contract.$inferSelect | undefined;

					if (Object.keys(contractUpdateValues).length > 0) {
						const [nextContract] = await tx
							.update(contract)
							.set(contractUpdateValues)
							.where(
								and(
									eq(contract.memberId, memberId),
									eq(contract.organizationId, organizationId),
								),
							)
							.returning();

						if (!nextContract) {
							throw new Error("Failed to update contract");
						}

						updatedContract = nextContract;
					} else {
						[updatedContract] = await tx
							.select()
							.from(contract)
							.where(
								and(
									eq(contract.memberId, memberId),
									eq(contract.organizationId, organizationId),
								),
							)
							.limit(1);

						if (!updatedContract) {
							throw new Error("Failed to load contract");
						}
					}

					return { member: updatedMember, contract: updatedContract };
				});
			},
			createMemberWithContract: async ({
				organizationId,
				memberId,
				memberData,
				contractData,
				sepaMandateData,
			}: {
				organizationId: string;
				memberId: string;
				memberData: {
					firstName: string;
					lastName: string;
					email?: string | null;
					phone?: string | null;
					birthdate?: string;
					street: string;
					city: string;
					state: string;
					postalCode: string;
					country: string;
					latitude?: number | null;
					longitude?: number | null;
					iban: string;
					bic: string;
					cardHolder: string;
					notes?: string;
					guardianName?: string;
					guardianEmail?: string;
					guardianPhone?: string;
				};
				contractData: {
					initialPeriod: string;
					startDate: string;
					initialPeriodEndDate: string;
					status?: "active" | "cancelled" | "ended";
					cancellationNoticeDays?: number;
					cancellationEffectiveDate?: string;
					cancellationReason?: string;
					joiningFeeCents?: number;
					yearlyFeeCents?: number;
					yearlyFeeMode?: "january" | "anniversary";
					settledThroughDate?: string;
					notes?: string;
				};
				sepaMandateData: {
					mandateReference: string;
					accountHolder: string;
					iban: string;
					bic: string;
					signatureDate: string;
				};
			}) => {
				return wsDb.transaction(async (tx) => {
					const [newMember] = await tx
						.insert(clubMember)
						.values({
							id: memberId,
							firstName: memberData.firstName,
							lastName: memberData.lastName,
							email: memberData.email,
							phone: memberData.phone,
							birthdate: memberData.birthdate,
							street: memberData.street,
							city: memberData.city,
							state: memberData.state,
							postalCode: memberData.postalCode,
							country: memberData.country,
							latitude: memberData.latitude,
							longitude: memberData.longitude,
							iban: memberData.iban,
							bic: memberData.bic,
							cardHolder: memberData.cardHolder,
							notes: memberData.notes,
							guardianName: memberData.guardianName,
							guardianEmail: memberData.guardianEmail,
							guardianPhone: memberData.guardianPhone,
							organizationId,
						})
						.returning();

					if (!newMember) {
						throw new Error("Failed to create member");
					}

					const [newContract] = await tx
						.insert(contract)
						.values({
							memberId: newMember.id,
							organizationId,
							status: contractData.status ?? "active",
							initialPeriod: contractData.initialPeriod,
							startDate: contractData.startDate,
							initialPeriodEndDate: contractData.initialPeriodEndDate,
							cancellationNoticeDays:
								contractData.cancellationNoticeDays ?? 0,
							cancellationEffectiveDate:
								contractData.cancellationEffectiveDate,
							cancellationReason: contractData.cancellationReason,
							joiningFeeCents: contractData.joiningFeeCents,
							yearlyFeeCents: contractData.yearlyFeeCents,
							yearlyFeeMode: contractData.yearlyFeeMode ?? "january",
							settledThroughDate: contractData.settledThroughDate,
							notes: contractData.notes,
						})
						.returning();

					if (!newContract) {
						throw new Error("Failed to create contract");
					}

					const [newSepaMandate] = await tx
						.insert(sepaMandate)
						.values({
							organizationId,
							memberId: newMember.id,
							contractId: newContract.id,
							mandateReference: sepaMandateData.mandateReference,
							accountHolder: sepaMandateData.accountHolder,
							iban: sepaMandateData.iban,
							bic: sepaMandateData.bic,
							signatureDate: sepaMandateData.signatureDate,
							isActive: true,
						})
						.returning();

					if (!newSepaMandate) {
						throw new Error("Failed to create SEPA mandate");
					}

					return {
						member: newMember,
						contract: newContract,
						sepaMandate: newSepaMandate,
					};
				});
			},
		},
		groups: {
			createGroup: async ({
				organizationId,
				name,
				description,
				color,
				defaultMembershipPriceCents,
			}: {
				organizationId: string;
				name: string;
				description?: string;
				color: string;
				defaultMembershipPriceCents?: number | string | null;
			}) => {
				const normalizedDefaultMembershipPriceCents = normalizeCents(
					defaultMembershipPriceCents,
				);

				const [newGroup] = await db
					.insert(group)
					.values({
						name,
						description,
						color,
						defaultMembershipPriceCents:
							normalizedDefaultMembershipPriceCents,
						organizationId,
					})
					.returning();

				if (!newGroup) {
					throw new Error("Failed to create group");
				}

				return newGroup;
			},
			updateGroup: async ({
				groupId,
				updates,
			}: {
				groupId: string;
				updates: {
					name?: string;
					description?: string;
					color?: string;
					defaultMembershipPriceCents?: number | string | null;
				};
			}) => {
				const normalizedDefaultMembershipPriceCents = normalizeCents(
					updates.defaultMembershipPriceCents,
				);
				const normalizedUpdates = {
					...updates,
					defaultMembershipPriceCents:
						updates.defaultMembershipPriceCents === undefined
							? undefined
							: normalizedDefaultMembershipPriceCents ?? null,
				};

				const [updatedGroup] = await db
					.update(group)
					.set(normalizedUpdates)
					.where(eq(group.id, groupId))
					.returning();

				return updatedGroup;
			},
			deleteGroup: async ({ groupId }: { groupId: string }) => {
				const [deletedGroup] = await db
					.delete(group)
					.where(eq(group.id, groupId))
					.returning();

				return deletedGroup;
			},
			assignMemberToGroup: async ({
				memberId,
				groupId,
				membershipPriceCents,
			}: {
				memberId: string;
				groupId: string;
				membershipPriceCents?: number | string | null;
			}) => {
				const resolvedMembershipPrice = await resolveGroupMembershipPrice({
					groupId,
					membershipPriceCents,
				});

				const [newGroupMember] = await db
					.insert(groupMember)
					.values({
						memberId,
						groupId,
						membershipPriceCents: resolvedMembershipPrice,
					})
					.returning();

				return newGroupMember;
			},
			updateGroupMember: async ({
				memberId,
				groupId,
				membershipPriceCents,
			}: {
				memberId: string;
				groupId: string;
				membershipPriceCents?: number | string | null;
			}) => {
				const resolvedMembershipPrice = await resolveGroupMembershipPrice({
					groupId,
					membershipPriceCents,
				});

				const [updatedGroupMember] = await db
					.update(groupMember)
					.set({
						membershipPriceCents: resolvedMembershipPrice,
					})
					.where(
						and(
							eq(groupMember.memberId, memberId),
							eq(groupMember.groupId, groupId),
						),
					)
					.returning();

				return updatedGroupMember;
			},
			removeMemberFromGroup: async ({
				memberId,
				groupId,
			}: {
				memberId: string;
				groupId: string;
			}) => {
				const [deletedGroupMember] = await db
					.delete(groupMember)
					.where(
						and(
							eq(groupMember.memberId, memberId),
							eq(groupMember.groupId, groupId),
						),
					)
					.returning();

				return deletedGroupMember;
			},
		},
		selfRegistrations: {
			createConfigWithGroups: async ({
				organizationId,
				config,
				groups,
			}: {
				organizationId: string;
				config: {
					name: string;
					code: string;
					description?: string;
					isActive: boolean;
					billingCycle: string;
					joiningFeeCents?: number;
					yearlyFeeCents?: number;
					contractStartDate?: string;
					notes?: string;
				};
				groups: Array<{
					groupId: string;
					groupNameSnapshot: string;
					schedule?: string;
					monthlyFeeCents: number;
				}>;
			}) => {
				const [created] = await db
					.insert(selfRegistration)
					.values({
						organizationId,
						name: config.name,
						code: config.code,
						description: config.description,
						isActive: config.isActive,
						billingCycle: config.billingCycle,
						joiningFeeCents: config.joiningFeeCents,
						yearlyFeeCents: config.yearlyFeeCents,
						contractStartDate: config.contractStartDate,
						notes: config.notes,
						groupsSnapshot: groups,
						status: "draft",
					})
					.returning();

				if (!created) {
					throw new Error("Failed to create self-registration");
				}

				return created;
			},
			updateConfigWithGroups: async ({
				configId,
				updates,
				groups,
			}: {
				configId: string;
				updates: {
					name?: string;
					description?: string;
					isActive?: boolean;
					billingCycle?: string;
					joiningFeeCents?: number;
					yearlyFeeCents?: number;
					contractStartDate?: string;
					notes?: string;
					firstName?: string;
					lastName?: string;
					email?: string;
					phone?: string;
					birthdate?: string;
					street?: string;
					city?: string;
					state?: string;
					postalCode?: string;
					country?: string;
					accountHolder?: string;
					iban?: string;
					bic?: string;
					submitted?: boolean;
				};
				groups?: Array<{
					groupId: string;
					groupNameSnapshot: string;
					schedule?: string;
					monthlyFeeCents: number;
				}>;
			}) => {
				const [updated] = await db
					.update(selfRegistration)
					.set({
						...updates,
						...(groups ? { groupsSnapshot: groups } : {}),
					})
					.where(eq(selfRegistration.id, configId))
					.returning();

				if (!updated) {
					throw new Error("Failed to update self-registration");
				}

				return updated;
			},
			deleteConfig: async ({ configId }: { configId: string }) => {
				const [deletedConfig] = await db
					.delete(selfRegistration)
					.where(
						and(
							eq(selfRegistration.id, configId),
							isNull(selfRegistration.memberId),
						),
					)
					.returning();
				return deletedConfig || null;
			},
			createSubmission: async ({
				configId,
				submission,
			}: {
				configId: string | null;
				submission: {
					firstName: string;
					lastName: string;
					email?: string | null;
					phone?: string | null;
					birthdate?: string;
					street: string;
					city: string;
					state?: string;
					postalCode: string;
					country: string;
					accountHolder: string;
					iban: string;
					bic: string;
				};
			}) => {
				if (!configId) {
					throw new Error("Config id is required");
				}

				const [updatedRegistration] = await db
					.update(selfRegistration)
					.set({
						status: "submitted",
						submitted: true,
						firstName: submission.firstName,
						lastName: submission.lastName,
						email: submission.email,
						phone: submission.phone,
						birthdate: submission.birthdate,
						street: submission.street,
						city: submission.city,
						state: submission.state,
						postalCode: submission.postalCode,
						country: submission.country,
						accountHolder: submission.accountHolder,
						iban: submission.iban,
						bic: submission.bic,
						submittedAt: new Date(),
					})
					.where(eq(selfRegistration.id, configId))
					.returning();

				if (!updatedRegistration) {
					throw new Error("Failed to submit self-registration");
				}

				return updatedRegistration;
			},
			updateSubmissionStatus: async ({
				submissionId,
				organizationId,
				status,
			}: {
				submissionId: string;
				organizationId: string;
				status: "submitted" | "created";
			}) => {
				const [updatedSubmission] = await db
					.update(selfRegistration)
					.set({ status, submitted: status === "submitted" ? true : undefined })
					.where(
						and(
							eq(selfRegistration.id, submissionId),
							eq(selfRegistration.organizationId, organizationId),
						),
					)
					.returning();

				return updatedSubmission || null;
			},
			setMemberId: async ({
				registrationId,
				organizationId,
				memberId,
			}: {
				registrationId: string;
				organizationId: string;
				memberId: string;
			}) => {
				const [updated] = await db
					.update(selfRegistration)
					.set({
						memberId,
						submitted: true,
						status: "created",
					})
					.where(
						and(
							eq(selfRegistration.id, registrationId),
							eq(selfRegistration.organizationId, organizationId),
						),
					)
					.returning();

				return updated || null;
			},
		},
	},
};
