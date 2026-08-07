import { z } from "zod";

/**
 * IDs stored in PostgreSQL's UUID columns.
 *
 * Some legacy Matdesk records use UUID-shaped identifiers with a version nibble
 * of 0. PostgreSQL accepts those values, while Zod's `z.uuid()` only accepts
 * RFC-defined versions 1-8. `z.guid()` keeps the canonical UUID shape check
 * without rejecting existing database rows.
 */
export const databaseIdSchema = z.guid();
