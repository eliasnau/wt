import { count, db, eq } from "..";
import { clubMember, contract, group, groupMember } from "../schema";

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
						contractInitialPeriod: contract.initialPeriod,
						contractInitialPeriodEndDate: contract.initialPeriodEndDate,
						contractCurrentPeriodEndDate: contract.currentPeriodEndDate,
						contractNextBillingDate: contract.nextBillingDate,
						contractJoiningFeeAmount: contract.joiningFeeAmount,
						contractYearlyFeeAmount: contract.yearlyFeeAmount,
						contractNotes: contract.notes,
						contractCancelledAt: contract.cancelledAt,
						contractCancelReason: contract.cancelReason,
						contractCancellationEffectiveDate:
							contract.cancellationEffectiveDate,
						// Group membership fields
						groupId: groupMember.groupId,
						membershipPrice: groupMember.membershipPrice,
						groupName: group.name,
						groupDescription: group.description,
						groupDefaultMembershipPrice: group.defaultMembershipPrice,
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
						membershipPrice: row.membershipPrice,
						group: {
							id: row.groupId!,
							name: row.groupName!,
							description: row.groupDescription,
							defaultMembershipPrice: row.groupDefaultMembershipPrice,
						},
					}));

				return {
					id: firstRow.id,
					firstName: firstRow.firstName,
					lastName: firstRow.lastName,
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
						initialPeriod: firstRow.contractInitialPeriod,
						initialPeriodEndDate: firstRow.contractInitialPeriodEndDate,
						currentPeriodEndDate: firstRow.contractCurrentPeriodEndDate,
						nextBillingDate: firstRow.contractNextBillingDate,
						joiningFeeAmount: firstRow.contractJoiningFeeAmount,
						yearlyFeeAmount: firstRow.contractYearlyFeeAmount,
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
						membershipPrice: groupMember.membershipPrice,
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
	},
	mutation: {
		members: {
			createMemberWithContract: async ({
				organizationId,
				memberId,
				memberData,
				contractData,
			}: {
				organizationId: string;
				memberId: string;
				memberData: {
					firstName: string;
					lastName: string;
					email: string;
					phone: string;
					street: string;
					city: string;
					state: string;
					postalCode: string;
					country: string;
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
					nextBillingDate: string;
					joiningFeeAmount?: string;
					yearlyFeeAmount?: string;
					notes?: string;
				};
			}) => {
				return db.transaction(async (tx) => {
					const [newMember] = await tx
						.insert(clubMember)
						.values({
							id: memberId,
							firstName: memberData.firstName,
							lastName: memberData.lastName,
							email: memberData.email,
							phone: memberData.phone,
							street: memberData.street,
							city: memberData.city,
							state: memberData.state,
							postalCode: memberData.postalCode,
							country: memberData.country,
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
							initialPeriod: contractData.initialPeriod,
							startDate: contractData.startDate,
							initialPeriodEndDate: contractData.initialPeriodEndDate,
							currentPeriodEndDate: contractData.initialPeriodEndDate,
							nextBillingDate: contractData.nextBillingDate,
							joiningFeeAmount: contractData.joiningFeeAmount,
							yearlyFeeAmount: contractData.yearlyFeeAmount,
							notes: contractData.notes,
						})
						.returning();

					if (!newContract) {
						throw new Error("Failed to create contract");
					}

					return { member: newMember, contract: newContract };
				});
			},
		},
		groups: {
			createGroup: async ({
				organizationId,
				name,
				description,
				defaultMembershipPrice,
			}: {
				organizationId: string;
				name: string;
				description?: string;
				defaultMembershipPrice?: string;
			}) => {
				const [newGroup] = await db
					.insert(group)
					.values({
						name,
						description,
						defaultMembershipPrice,
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
					defaultMembershipPrice?: string;
				};
			}) => {
				const [updatedGroup] = await db
					.update(group)
					.set(updates)
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
		},
	},
};
