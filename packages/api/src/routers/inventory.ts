import { ORPCError } from "@orpc/server";
import { and, count, db, desc, eq, ilike, inArray, wsDb } from "@repo/db";
import {
	inventoryProduct,
	inventoryProductAttribute,
	inventoryProductAttributeValue,
	inventoryVariant,
} from "@repo/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { requirePermission } from "../middleware/permissions";
import { rateLimitMiddleware } from "../middleware/ratelimit";

type NormalizedAttribute = {
	name: string;
	values: string[];
};

type VariantOption = {
	attributeName: string;
	value: string;
};

const attributeSchema = z.object({
	name: z.string().trim().min(1).max(80),
	values: z.array(z.string().trim().min(1).max(80)).min(1),
});

const createProductSchema = z.object({
	name: z.string().trim().min(1).max(140),
	description: z.string().trim().max(2000).optional(),
	attributes: z.array(attributeSchema).max(8).default([]),
});

const updateProductSchema = z.object({
	productId: z.string(),
	name: z.string().trim().min(1).max(140),
	description: z.string().trim().max(2000).optional(),
	attributes: z.array(attributeSchema).max(8).default([]),
});

const updateVariantQuantitySchema = z.object({
	variantId: z.string(),
	quantity: z.number().int().min(0),
});

const updateVariantQuantitiesSchema = z.object({
	productId: z.string(),
	updates: z
		.array(
			z.object({
				variantId: z.string(),
				quantity: z.number().int().min(0),
			}),
		)
		.min(1)
		.max(500),
});

const deleteProductSchema = z.object({
	productId: z.string(),
});

type DbTransaction = Parameters<Parameters<typeof wsDb.transaction>[0]>[0];

function requireActiveOrganizationId(activeOrganizationId?: string | null) {
	if (!activeOrganizationId) {
		throw new ORPCError("BAD_REQUEST", {
			message: "No active organization selected",
		});
	}

	return activeOrganizationId;
}

function dedupeValues(values: string[]) {
	const seen = new Set<string>();
	const output: string[] = [];

	for (const value of values) {
		const trimmed = value.trim().replace(/\s+/g, " ");
		if (!trimmed) continue;
		const key = trimmed.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		output.push(trimmed);
	}

	return output;
}

function normalizeAttributes(
	attributes: Array<{ name: string; values: string[] }>,
) {
	const seenNames = new Set<string>();
	const normalized: NormalizedAttribute[] = [];

	for (const attribute of attributes) {
		const name = attribute.name.trim();
		const values = dedupeValues(attribute.values);
		if (!name || values.length === 0) continue;

		const nameKey = name.toLowerCase();
		if (seenNames.has(nameKey)) {
			throw new ORPCError("BAD_REQUEST", {
				message: `Duplicate attribute name: ${name}`,
			});
		}

		seenNames.add(nameKey);
		normalized.push({ name, values });
	}

	return normalized;
}

function normalizeKeyPart(value: string) {
	return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getCombinationKey(options: VariantOption[]) {
	if (options.length === 0) {
		return "__default__";
	}

	return options
		.map(
			(option) =>
				`${normalizeKeyPart(option.attributeName)}=${normalizeKeyPart(option.value)}`,
		)
		.join("|");
}

function getCombinationTuple(
	options: VariantOption[],
	attributes: NormalizedAttribute[],
) {
	if (attributes.length === 0) {
		return "__default__";
	}

	const selectedByAttribute = new Map(
		options.map((option) => [
			normalizeKeyPart(option.attributeName),
			option.value,
		]),
	);

	const tuple: number[] = [];

	for (const attribute of attributes) {
		const attributeKey = normalizeKeyPart(attribute.name);
		const selectedValue = selectedByAttribute.get(attributeKey);
		if (!selectedValue) {
			return null;
		}

		const valueIndex = attribute.values.findIndex(
			(value) => normalizeKeyPart(value) === normalizeKeyPart(selectedValue),
		);
		if (valueIndex === -1) {
			return null;
		}

		tuple.push(valueIndex);
	}

	return tuple.join("|");
}

function buildVariantCombinations(attributes: NormalizedAttribute[]) {
	if (attributes.length === 0) {
		return [{ combinationKey: "__default__", options: [] as VariantOption[] }];
	}

	for (const attribute of attributes) {
		if (attribute.values.length === 0) {
			return [];
		}
	}

	let combinations: VariantOption[][] = [[]];

	for (const attribute of attributes) {
		const next: VariantOption[][] = [];
		for (const base of combinations) {
			for (const value of attribute.values) {
				next.push([...base, { attributeName: attribute.name, value }]);
			}
		}
		combinations = next;
	}

	return combinations.map((options) => ({
		combinationKey: getCombinationKey(options),
		options,
	}));
}

async function getProductDefinition(
	tx: DbTransaction,
	productId: string,
): Promise<NormalizedAttribute[]> {
	const attributeRows = await tx
		.select({
			id: inventoryProductAttribute.id,
			name: inventoryProductAttribute.name,
			position: inventoryProductAttribute.position,
		})
		.from(inventoryProductAttribute)
		.where(eq(inventoryProductAttribute.productId, productId));

	if (attributeRows.length === 0) {
		return [];
	}

	const attributeIds = attributeRows.map((attribute) => attribute.id);
	const valueRows = await tx
		.select({
			attributeId: inventoryProductAttributeValue.attributeId,
			value: inventoryProductAttributeValue.value,
			position: inventoryProductAttributeValue.position,
		})
		.from(inventoryProductAttributeValue)
		.where(inArray(inventoryProductAttributeValue.attributeId, attributeIds));

	const valuesByAttributeId = new Map<
		string,
		Array<{ value: string; position: number }>
	>();

	for (const valueRow of valueRows) {
		const current = valuesByAttributeId.get(valueRow.attributeId) ?? [];
		current.push({ value: valueRow.value, position: valueRow.position });
		valuesByAttributeId.set(valueRow.attributeId, current);
	}

	return attributeRows
		.sort((a, b) => a.position - b.position)
		.map((attribute) => ({
			name: attribute.name,
			values: (valuesByAttributeId.get(attribute.id) ?? [])
				.sort((a, b) => a.position - b.position)
				.map((value) => value.value),
		}));
}

async function replaceProductDefinition(
	tx: DbTransaction,
	productId: string,
	attributes: NormalizedAttribute[],
) {
	await tx
		.delete(inventoryProductAttribute)
		.where(eq(inventoryProductAttribute.productId, productId));

	for (const [attributeIndex, attribute] of attributes.entries()) {
		const [createdAttribute] = await tx
			.insert(inventoryProductAttribute)
			.values({
				productId,
				name: attribute.name,
				position: attributeIndex,
			})
			.returning({ id: inventoryProductAttribute.id });

		if (!createdAttribute) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Failed to create product attribute",
			});
		}

		for (const [valueIndex, value] of attribute.values.entries()) {
			await tx.insert(inventoryProductAttributeValue).values({
				attributeId: createdAttribute.id,
				value,
				position: valueIndex,
			});
		}
	}
}

async function syncProductVariants(
	tx: DbTransaction,
	productId: string,
	previousAttributes: NormalizedAttribute[],
	attributes: NormalizedAttribute[],
) {
	const desiredVariants = buildVariantCombinations(attributes);
	const existingVariants = await tx
		.select({
			id: inventoryVariant.id,
			combinationKey: inventoryVariant.combinationKey,
			options: inventoryVariant.options,
			quantity: inventoryVariant.quantity,
		})
		.from(inventoryVariant)
		.where(eq(inventoryVariant.productId, productId));

	const existingByKey = new Map(
		existingVariants.map((variant) => [variant.combinationKey, variant]),
	);
	const desiredKeys = new Set(
		desiredVariants.map((variant) => variant.combinationKey),
	);
	const existingByTuple = new Map(
		existingVariants
			.map((variant) => ({
				tuple: getCombinationTuple(variant.options, previousAttributes),
				variant,
			}))
			.filter(
				(
					item,
				): item is {
					tuple: string;
					variant: (typeof existingVariants)[number];
				} => Boolean(item.tuple),
			)
			.map((item) => [item.tuple, item.variant]),
	);

	for (const variant of desiredVariants) {
		const existing = existingByKey.get(variant.combinationKey);
		if (existing) {
			await tx
				.update(inventoryVariant)
				.set({
					options: variant.options,
				})
				.where(eq(inventoryVariant.id, existing.id));
			continue;
		}

		const tuple = getCombinationTuple(variant.options, attributes);
		const quantityFromTuple =
			(tuple ? existingByTuple.get(tuple)?.quantity : undefined) ?? 0;

		await tx.insert(inventoryVariant).values({
			productId,
			combinationKey: variant.combinationKey,
			options: variant.options,
			quantity: quantityFromTuple,
		});
	}

	const obsoleteVariantIds = existingVariants
		.filter((variant) => !desiredKeys.has(variant.combinationKey))
		.map((variant) => variant.id);

	if (obsoleteVariantIds.length > 0) {
		await tx
			.delete(inventoryVariant)
			.where(inArray(inventoryVariant.id, obsoleteVariantIds));
	}
}

const listProductsSchema = z.object({
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(20),
	search: z.string().trim().optional(),
});

const getProductSchema = z.object({
	productId: z.string(),
});

export const inventoryRouter = {
	listProducts: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ inventory: ["view"] }))
		.input(listProductsSchema)
		.handler(async ({ input, context }) => {
			const organizationId = requireActiveOrganizationId(
				context.session.activeOrganizationId,
			);

			const page = input.page;
			const limit = input.limit;

			const where = input.search
				? and(
						eq(inventoryProduct.organizationId, organizationId),
						ilike(inventoryProduct.name, `%${input.search}%`),
					)
				: eq(inventoryProduct.organizationId, organizationId);

			const [{ count: totalCount = 0 } = { count: 0 }] = await db
				.select({ count: count() })
				.from(inventoryProduct)
				.where(where);

			const totalPages = Math.ceil(totalCount / limit);

			if (totalCount === 0) {
				return {
					data: [],
					pagination: {
						page,
						limit,
						totalCount,
						totalPages: 0,
						hasNextPage: false,
						hasPreviousPage: false,
					},
				};
			}

			const products = await db
				.select({
					id: inventoryProduct.id,
					name: inventoryProduct.name,
					description: inventoryProduct.description,
					isActive: inventoryProduct.isActive,
					createdAt: inventoryProduct.createdAt,
					updatedAt: inventoryProduct.updatedAt,
				})
				.from(inventoryProduct)
				.where(where)
				.orderBy(desc(inventoryProduct.createdAt))
				.limit(limit)
				.offset((page - 1) * limit);

			const productIds = products.map((product) => product.id);

			const attributeRows = await db
				.select({
					productId: inventoryProductAttribute.productId,
					id: inventoryProductAttribute.id,
					name: inventoryProductAttribute.name,
					position: inventoryProductAttribute.position,
				})
				.from(inventoryProductAttribute)
				.where(inArray(inventoryProductAttribute.productId, productIds));

			const attributeIds = attributeRows.map((attribute) => attribute.id);

			const valueRows = attributeIds.length
				? await db
						.select({
							attributeId: inventoryProductAttributeValue.attributeId,
							value: inventoryProductAttributeValue.value,
							position: inventoryProductAttributeValue.position,
						})
						.from(inventoryProductAttributeValue)
						.where(
							inArray(inventoryProductAttributeValue.attributeId, attributeIds),
						)
				: [];

			const variantRows = await db
				.select({
					id: inventoryVariant.id,
					productId: inventoryVariant.productId,
					quantity: inventoryVariant.quantity,
					options: inventoryVariant.options,
					updatedAt: inventoryVariant.updatedAt,
				})
				.from(inventoryVariant)
				.where(inArray(inventoryVariant.productId, productIds));

			const valuesByAttributeId = new Map<
				string,
				Array<{ value: string; position: number }>
			>();
			for (const row of valueRows) {
				const current = valuesByAttributeId.get(row.attributeId) ?? [];
				current.push({ value: row.value, position: row.position });
				valuesByAttributeId.set(row.attributeId, current);
			}

			const attributesByProductId = new Map<
				string,
				Array<{ id: string; name: string; position: number; values: string[] }>
			>();

			for (const row of attributeRows) {
				const current = attributesByProductId.get(row.productId) ?? [];
				const values = (valuesByAttributeId.get(row.id) ?? [])
					.sort((a, b) => a.position - b.position)
					.map((value) => value.value);
				current.push({
					id: row.id,
					name: row.name,
					position: row.position,
					values,
				});
				attributesByProductId.set(row.productId, current);
			}

			const variantsByProductId = new Map<
				string,
				Array<{
					id: string;
					quantity: number;
					options: Array<{ attributeName: string; value: string }>;
					updatedAt: Date;
				}>
			>();

			for (const row of variantRows) {
				const current = variantsByProductId.get(row.productId) ?? [];
				current.push({
					id: row.id,
					quantity: row.quantity,
					options: row.options,
					updatedAt: row.updatedAt,
				});
				variantsByProductId.set(row.productId, current);
			}

			return {
				data: products.map((product) => ({
					...product,
					attributes: (attributesByProductId.get(product.id) ?? []).sort(
						(a, b) => a.position - b.position,
					),
					variants: variantsByProductId.get(product.id) ?? [],
				})),
				pagination: {
					page,
					limit,
					totalCount,
					totalPages,
					hasNextPage: page < totalPages,
					hasPreviousPage: page > 1,
				},
			};
		})
		.route({ method: "GET", path: "/inventory/products" }),

	getProduct: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ inventory: ["view"] }))
		.input(getProductSchema)
		.handler(async ({ input, context }) => {
			const organizationId = requireActiveOrganizationId(
				context.session.activeOrganizationId,
			);

			const [product] = await db
				.select({
					id: inventoryProduct.id,
					name: inventoryProduct.name,
					description: inventoryProduct.description,
					isActive: inventoryProduct.isActive,
					createdAt: inventoryProduct.createdAt,
					updatedAt: inventoryProduct.updatedAt,
				})
				.from(inventoryProduct)
				.where(
					and(
						eq(inventoryProduct.id, input.productId),
						eq(inventoryProduct.organizationId, organizationId),
					),
				)
				.limit(1);

			if (!product) {
				throw new ORPCError("NOT_FOUND", {
					message: "Product not found",
				});
			}

			const attributeRows = await db
				.select({
					id: inventoryProductAttribute.id,
					name: inventoryProductAttribute.name,
					position: inventoryProductAttribute.position,
				})
				.from(inventoryProductAttribute)
				.where(eq(inventoryProductAttribute.productId, product.id));

			const attributeIds = attributeRows.map((attribute) => attribute.id);

			const valueRows = attributeIds.length
				? await db
						.select({
							attributeId: inventoryProductAttributeValue.attributeId,
							value: inventoryProductAttributeValue.value,
							position: inventoryProductAttributeValue.position,
						})
						.from(inventoryProductAttributeValue)
						.where(
							inArray(inventoryProductAttributeValue.attributeId, attributeIds),
						)
				: [];

			const variantRows = await db
				.select({
					id: inventoryVariant.id,
					quantity: inventoryVariant.quantity,
					options: inventoryVariant.options,
					updatedAt: inventoryVariant.updatedAt,
				})
				.from(inventoryVariant)
				.where(eq(inventoryVariant.productId, product.id));

			const valuesByAttributeId = new Map<
				string,
				Array<{ value: string; position: number }>
			>();
			for (const row of valueRows) {
				const current = valuesByAttributeId.get(row.attributeId) ?? [];
				current.push({ value: row.value, position: row.position });
				valuesByAttributeId.set(row.attributeId, current);
			}

			const attributes = attributeRows
				.sort((a, b) => a.position - b.position)
				.map((attribute) => ({
					id: attribute.id,
					name: attribute.name,
					position: attribute.position,
					values: (valuesByAttributeId.get(attribute.id) ?? [])
						.sort((a, b) => a.position - b.position)
						.map((value) => value.value),
				}));

			return {
				...product,
				attributes,
				variants: variantRows,
			};
		})
		.route({ method: "GET", path: "/inventory/products/:productId" }),

	createProduct: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ inventory: ["create"] }))
		.input(createProductSchema)
		.handler(async ({ input, context }) => {
			const organizationId = requireActiveOrganizationId(
				context.session.activeOrganizationId,
			);
			const attributes = normalizeAttributes(input.attributes);

			const created = await wsDb.transaction(async (tx) => {
				const [product] = await tx
					.insert(inventoryProduct)
					.values({
						organizationId,
						name: input.name,
						description: input.description,
					})
					.returning({ id: inventoryProduct.id });

				if (!product) {
					throw new ORPCError("INTERNAL_SERVER_ERROR", {
						message: "Failed to create inventory product",
					});
				}

				await replaceProductDefinition(tx, product.id, attributes);
				await syncProductVariants(tx, product.id, attributes, attributes);

				return product;
			});

			return created;
		})
		.route({ method: "POST", path: "/inventory/products" }),

	updateProduct: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ inventory: ["update"] }))
		.input(updateProductSchema)
		.handler(async ({ input, context }) => {
			const organizationId = requireActiveOrganizationId(
				context.session.activeOrganizationId,
			);
			const attributes = normalizeAttributes(input.attributes);

			const updated = await wsDb.transaction(async (tx) => {
				const [product] = await tx
					.select({ id: inventoryProduct.id })
					.from(inventoryProduct)
					.where(
						and(
							eq(inventoryProduct.id, input.productId),
							eq(inventoryProduct.organizationId, organizationId),
						),
					)
					.limit(1);

				if (!product) {
					throw new ORPCError("NOT_FOUND", {
						message: "Product not found",
					});
				}

				const previousAttributes = await getProductDefinition(
					tx,
					input.productId,
				);

				await tx
					.update(inventoryProduct)
					.set({
						name: input.name,
						description: input.description,
					})
					.where(eq(inventoryProduct.id, input.productId));

				await replaceProductDefinition(tx, input.productId, attributes);
				await syncProductVariants(
					tx,
					input.productId,
					previousAttributes,
					attributes,
				);

				return { id: input.productId };
			});

			return updated;
		})
		.route({ method: "PUT", path: "/inventory/products/:productId" }),

	updateVariantQuantity: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ inventory: ["update"] }))
		.input(updateVariantQuantitySchema)
		.handler(async ({ input, context }) => {
			const organizationId = requireActiveOrganizationId(
				context.session.activeOrganizationId,
			);

			const [variant] = await db
				.select({
					id: inventoryVariant.id,
					organizationId: inventoryProduct.organizationId,
				})
				.from(inventoryVariant)
				.innerJoin(
					inventoryProduct,
					eq(inventoryProduct.id, inventoryVariant.productId),
				)
				.where(eq(inventoryVariant.id, input.variantId))
				.limit(1);

			if (!variant || variant.organizationId !== organizationId) {
				throw new ORPCError("NOT_FOUND", {
					message: "Variant not found",
				});
			}

			const [updated] = await db
				.update(inventoryVariant)
				.set({
					quantity: input.quantity,
				})
				.where(eq(inventoryVariant.id, input.variantId))
				.returning({
					id: inventoryVariant.id,
					quantity: inventoryVariant.quantity,
				});

			if (!updated) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to update quantity",
				});
			}

			return updated;
		})
		.route({ method: "PUT", path: "/inventory/variants/:variantId/quantity" }),

	updateVariantQuantities: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ inventory: ["update"] }))
		.input(updateVariantQuantitiesSchema)
		.handler(async ({ input, context }) => {
			const organizationId = requireActiveOrganizationId(
				context.session.activeOrganizationId,
			);

			const updatesByVariantId = new Map(
				input.updates.map((update) => [update.variantId, update.quantity]),
			);
			const variantIds = Array.from(updatesByVariantId.keys());

			const variants = await db
				.select({
					id: inventoryVariant.id,
					productId: inventoryVariant.productId,
					organizationId: inventoryProduct.organizationId,
				})
				.from(inventoryVariant)
				.innerJoin(
					inventoryProduct,
					eq(inventoryProduct.id, inventoryVariant.productId),
				)
				.where(inArray(inventoryVariant.id, variantIds));

			const authorizedVariantIds = variants
				.filter(
					(variant) =>
						variant.productId === input.productId &&
						variant.organizationId === organizationId,
				)
				.map((variant) => variant.id);

			if (authorizedVariantIds.length !== variantIds.length) {
				throw new ORPCError("NOT_FOUND", {
					message: "One or more variants were not found",
				});
			}

			const updated = await wsDb.transaction(async (tx) => {
				const results: Array<{ id: string; quantity: number }> = [];

				for (const variantId of authorizedVariantIds) {
					const quantity = updatesByVariantId.get(variantId);
					if (quantity === undefined) continue;

					const [row] = await tx
						.update(inventoryVariant)
						.set({ quantity })
						.where(eq(inventoryVariant.id, variantId))
						.returning({
							id: inventoryVariant.id,
							quantity: inventoryVariant.quantity,
						});

					if (!row) {
						throw new ORPCError("INTERNAL_SERVER_ERROR", {
							message: "Failed to update quantity",
						});
					}

					results.push(row);
				}

				return results;
			});

			return { updated };
		})
		.route({
			method: "PUT",
			path: "/inventory/products/:productId/variant-quantities",
		}),

	deleteProduct: protectedProcedure
		.use(rateLimitMiddleware(1))
		.use(requirePermission({ inventory: ["delete"] }))
		.input(deleteProductSchema)
		.handler(async ({ input, context }) => {
			const organizationId = requireActiveOrganizationId(
				context.session.activeOrganizationId,
			);

			const [deleted] = await db
				.delete(inventoryProduct)
				.where(
					and(
						eq(inventoryProduct.id, input.productId),
						eq(inventoryProduct.organizationId, organizationId),
					),
				)
				.returning({ id: inventoryProduct.id });

			if (!deleted) {
				throw new ORPCError("NOT_FOUND", {
					message: "Product not found",
				});
			}

			return deleted;
		})
		.route({ method: "DELETE", path: "/inventory/products/:productId" }),
};
