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
  /**
   * Club members (the `clubMember` table) — deliberately *not* named `member`,
   * which is Better Auth's own statement for managing users of the organization.
   * Reusing that key would hand every role with club-member CRUD the right to
   * add, remove and re-role teammates.
   */
  members: {
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
  progression: {
    label: "Graduierungen",
    actions: {
      view: {
        label: "Ansehen",
        description: "Graduierungssysteme und verliehene Graduierungen ansehen.",
      },
      configure: { label: "Konfigurieren", description: "Systeme und Graduierungen verwalten." },
      award: { label: "Vergeben", description: "Graduierungen an Mitglieder vergeben." },
    },
  },
  coaching: {
    label: "Einzelcoaching",
    actions: {
      view: { label: "Ansehen", description: "Coachings und Teilnehmer ansehen." },
      create: { label: "Erstellen", description: "Coachings anlegen." },
      update: {
        label: "Bearbeiten",
        description: "Coachings, Anwesenheit und Zahlung bearbeiten.",
      },
      delete: { label: "Löschen", description: "Unberührte Coachings löschen." },
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

/**
 * `ownerAc`/`adminAc`/`memberAc` carry Better Auth's *team* rights
 * (`organization`, `member`, `invitation`, `team`, `ac`). Only owner and admin
 * get the management set; the operative roles start from `memberAc`, which
 * grants nothing but `ac: ["read"]`.
 */
export const owner = ac.newRole({
  ...ownerAc.statements,
  ...allCustomActions,
});

/** Operative management — everything except owner/bank-critical actions. */
export const admin = ac.newRole({
  ...adminAc.statements,
  ...allCustomActions,
  // SEPA mandates and the SEPA file export stay with the owner (and Buchhaltung).
  billing: ["view", "generate", "update"],
  sepa: ["view"],
});

/** Training operations: members, groups, attendance, gradings, coaching. */
export const trainer = ac.newRole({
  ...memberAc.statements,
  members: ["view", "update"],
  groups: ["view", "create", "update"],
  events: ["view", "create", "update"],
  progression: ["view", "award"],
  coaching: ["view", "create", "update"],
  inventory: ["view"],
  statistics: ["view"],
  ai: ["chat"],
});

/** Front desk: member upkeep, sign-ups, events, simple payments. */
export const staff = ac.newRole({
  ...memberAc.statements,
  members: ["view", "create", "update", "view_payment"],
  groups: ["view"],
  events: ["view", "create", "update"],
  progression: ["view"],
  coaching: ["view", "create", "update"],
  inventory: ["view", "update"],
  billing: ["view"],
  statistics: ["view"],
  ai: ["chat"],
});

/** Finance: invoices, SEPA, financial figures. */
export const accountant = ac.newRole({
  ...memberAc.statements,
  members: ["view", "export", "view_payment"],
  groups: ["view"],
  coaching: ["view"],
  inventory: ["view"],
  billing: ["view", "generate", "download", "update"],
  sepa: ["view", "update"],
  statistics: ["view"],
  financeStatistics: ["view"],
  ai: ["chat"],
});

/**
 * Legacy read-only role from before the role set above existed. Kept registered
 * so members still carrying it resolve to the exact rights they had; it is not
 * offered when inviting or re-roling.
 */
export const member = ac.newRole({
  ...memberAc.statements,
  members: ["view"],
  groups: ["view"],
  events: ["view"],
  progression: ["view"],
  coaching: ["view"],
  inventory: ["view"],
  ai: ["chat"],
});

export const roles = { owner, admin, trainer, staff, accountant, member } as const;
export type RoleName = keyof typeof roles;

/** Purpose of each role, for role pickers and the permission matrix. */
export const roleMetadata: Record<
  RoleName,
  { label: string; description: string; assignable: boolean }
> = {
  owner: {
    label: "Inhaber",
    description: "Vollzugriff auf die gesamte Organisation.",
    assignable: false,
  },
  admin: {
    label: "Administrator",
    description: "Operative Verwaltung, aber keine kritischen Eigentümer- und Bankfunktionen.",
    assignable: true,
  },
  trainer: {
    label: "Trainer",
    description: "Mitglieder, Gruppen, Anwesenheit, Graduierungen, Coachings.",
    assignable: true,
  },
  staff: {
    label: "Empfang / Mitarbeiter",
    description: "Mitgliederpflege, Anmeldungen, Events, einfache Zahlungen.",
    assignable: true,
  },
  accountant: {
    label: "Buchhaltung",
    description: "Rechnungen, SEPA, Finanzdaten.",
    assignable: true,
  },
  member: {
    label: "Mitglied (alt)",
    description: "Frühere Rolle mit reinem Lesezugriff. Bitte auf eine neue Rolle umstellen.",
    assignable: false,
  },
};

/** Roles offered when inviting or changing someone's role. */
export const assignableRoles = (Object.keys(roleMetadata) as RoleName[]).filter(
  (role) => roleMetadata[role].assignable,
);

/** Human label for a role value from the database (may be a comma-separated list). */
export function getRoleLabel(role: string): string {
  return role
    .split(",")
    .map((part) => roleMetadata[part.trim() as RoleName]?.label ?? part.trim())
    .join(", ");
}

/**
 * Whether a stored role value grants `resource:action`. Covers Better Auth's own
 * statements too, so callers can ask about e.g. `member:update` (team
 * management) or `invitation:create`.
 */
export function roleHas(
  role: string | null | undefined,
  resource: string,
  action: string,
): boolean {
  if (!role) return false;
  return role.split(",").some((part) => {
    const statements = roles[part.trim() as RoleName]?.statements as
      | Record<string, readonly string[] | undefined>
      | undefined;
    return statements?.[resource]?.includes(action) ?? false;
  });
}

/** Whether a role may invite, remove and re-role teammates. */
export function roleCanManageTeam(role: string | null | undefined): boolean {
  return roleHas(role, "member", "update");
}
