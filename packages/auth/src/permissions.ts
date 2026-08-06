import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

/**
 * Single source of truth for matdesk permissions.
 *
 * The Better Auth statement shape (`{ resource: action[] }`) is *derived* from this spec.
 * The spec, and authorization + UI stay in sync.
 *
 */
const PERMISSION_SPEC = {
  member: {
    label: "Mitglieder",
    actions: {
      view: { label: "Ansehen", description: "Mitglieder ansehen (Liste und Details)." },
      create: { label: "Erstellen", description: "Neue Mitglieder anlegen." },
      update: { label: "Bearbeiten", description: "Stammdaten ändern." },
      delete: { label: "Löschen", description: "Mitglieder entfernen." },
      export: { label: "Exportieren", description: "CSV-Export ausführen." },
      view_payment: { label: "Zahlungen ansehen", description: "Zahlungsinformationen einsehen." },
    },
  },
  groups: {
    label: "Gruppen",
    actions: {
      view: { label: "Ansehen", description: "Gruppen einsehen." },
      create: { label: "Erstellen", description: "Gruppen anlegen." },
      update: { label: "Bearbeiten", description: "Gruppen ändern." },
      delete: { label: "Löschen", description: "Gruppen entfernen." },
    },
  },
  events: {
    label: "Veranstaltungen",
    actions: {
      view: { label: "Ansehen", description: "Veranstaltungen und Teilnehmer ansehen." },
      create: { label: "Erstellen", description: "Veranstaltungen anlegen." },
      update: { label: "Bearbeiten", description: "Veranstaltungen und Teilnehmer bearbeiten." },
      delete: { label: "Löschen", description: "Veranstaltungen löschen." },
    },
  },
  inventory: {
    label: "Inventar",
    actions: {
      view: { label: "Ansehen", description: "Produkte und Bestände einsehen." },
      create: { label: "Erstellen", description: "Produkte anlegen." },
      update: { label: "Bearbeiten", description: "Produkte und Bestände ändern." },
      delete: { label: "Löschen", description: "Produkte entfernen." },
    },
  },
  billing: {
    label: "Abrechnung",
    actions: {
      view: { label: "Ansehen", description: "Rechnungen einsehen." },
      generate: { label: "Erzeugen", description: "Rechnungen und SEPA-Batches erzeugen." },
      download: { label: "Herunterladen", description: "SEPA-Dateien herunterladen." },
      update: { label: "Bearbeiten", description: "Rechnungsstellung anpassen." },
    },
  },
  sepa: {
    label: "SEPA",
    actions: {
      view: { label: "Ansehen", description: "Mandate und Bankdaten einsehen." },
      update: { label: "Bearbeiten", description: "Mandate verwalten." },
    },
  },
  statistics: {
    label: "Statistiken",
    actions: {
      view: { label: "Ansehen", description: "Statistiken einsehen." },
    },
  },
  financeStatistics: {
    label: "Finanzstatistiken",
    actions: {
      view: { label: "Ansehen", description: "Finanzkennzahlen einsehen." },
    },
  },
  ai: {
    label: "KI-Assistent",
    actions: {
      chat: { label: "Verwenden", description: "Mit dem KI-Assistenten chatten." },
    },
  },
} as const;

// ─── Types derived from the spec ────────────────────────────────────────────
export type PermissionSpec = typeof PERMISSION_SPEC;
export type PermissionResource = keyof PermissionSpec;
export type PermissionAction<R extends PermissionResource> = keyof PermissionSpec[R]["actions"] &
  string;

/** Shape consumed by `auth.api.hasPermission({ body: { permissions: ... } })`. */
export type PermissionCheck = {
  [R in PermissionResource]?: PermissionAction<R>[];
};

// ─── UI helpers ─────────────────────────────────────────────────────────────

/** Raw nested spec (foor rendering grouped permission UIs) */
export const permissionMetadata = PERMISSION_SPEC;

/** Flat list ( for checkbox grids and role editors) */
export const permissionList = Object.entries(PERMISSION_SPEC).flatMap(([resource, def]) =>
  Object.entries(def.actions).map(([action, meta]) => ({
    resource: resource as PermissionResource,
    resourceLabel: def.label,
    action,
    label: meta.label,
    description: meta.description,
  })),
);

/** UI helper: human label for any resource. */
export function getResourceLabel<R extends PermissionResource>(resource: R): string {
  return PERMISSION_SPEC[resource].label;
}

/** UI helper: human label for a single action on a resource. */
export function getActionLabel<R extends PermissionResource>(
  resource: R,
  action: PermissionAction<R>,
): string {
  const actions = PERMISSION_SPEC[resource].actions as Record<string, { label: string }>;
  return actions[action]!.label;
}

// ─── Better Auth statement (derived) ────────────────────────────────────────

/**
 * Derived Better Auth statement: `{ resource: readonly action[] }`.
 *
 * `Object.fromEntries(...).map(...)` runs at module load (cheap). The cast
 * preserves the literal string union from `PERMISSION_SPEC` so Better Auth's
 * generics see the exact action names per resource.
 */
const customStatement = Object.fromEntries(
  Object.entries(PERMISSION_SPEC).map(([resource, def]) => [resource, Object.keys(def.actions)]),
) as unknown as {
  [R in PermissionResource]: ReadonlyArray<PermissionAction<R>>;
};

export const statement = {
  ...defaultStatements,
  ...customStatement,
} as const;

export const ac = createAccessControl(statement);

// ─── Roles ──────────────────────────────────────────────────────────────────

/** Every custom action for every custom resource — used to grant full access. */
const allCustomActions = Object.fromEntries(
  Object.entries(customStatement).map(([resource, actions]) => [resource, [...actions]]),
) as unknown as { [R in PermissionResource]: PermissionAction<R>[] };

export const owner = ac.newRole({
  ...ownerAc.statements,
  ...allCustomActions,
});

export const admin = ac.newRole({
  ...adminAc.statements,
  ...allCustomActions,
});

export const member = ac.newRole({
  ...memberAc.statements,
  member: ["view"],
  groups: ["view"],
  events: ["view"],
  inventory: ["view"],
  ai: ["chat"],
});

export const roles = { owner, admin, member } as const;
export type RoleName = keyof typeof roles;
