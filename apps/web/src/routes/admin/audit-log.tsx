import { Badge } from "@matdesk/ui/components/badge";
import { Button } from "@matdesk/ui/components/button";
import { CardFrame } from "@matdesk/ui/components/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@matdesk/ui/components/input-group";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroupLabel,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@matdesk/ui/components/menu";
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from "@matdesk/ui/components/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@matdesk/ui/components/table";
import { createFileRoute } from "@tanstack/react-router";
import {
  BanIcon,
  BanknoteIcon,
  Building2Icon,
  CreditCardIcon,
  DownloadIcon,
  FileTextIcon,
  FilterIcon,
  FolderPlusIcon,
  KeyRoundIcon,
  LogInIcon,
  MailPlusIcon,
  PackageIcon,
  PackagePlusIcon,
  PencilIcon,
  ReceiptIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SearchIcon,
  ShieldIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  UserMinusIcon,
  UserPenIcon,
  UserPlusIcon,
  UsersIcon,
  UserXIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import { useMemo, useState } from "react";

import { OrganizationAvatar } from "@/components/auth/organization-avatar";
import { UserAvatar } from "@/components/auth/user-avatar";

export const Route = createFileRoute("/admin/audit-log")({
  component: RouteComponent,
});

type AuditCategory =
  | "auth"
  | "admin"
  | "organization"
  | "members"
  | "groups"
  | "inventory"
  | "billing";

type AuditEventType =
  | "sign-up"
  | "sign-in"
  | "org-create"
  | "org-invite"
  | "org-member-add"
  | "org-member-remove"
  | "member-create"
  | "member-update"
  | "member-contract-update"
  | "member-contract-cancel"
  | "member-group-assign"
  | "member-group-update"
  | "member-group-remove"
  | "group-create"
  | "group-update"
  | "group-delete"
  | "inventory-create"
  | "inventory-update"
  | "inventory-delete"
  | "inventory-stock-update"
  | "inventory-sync"
  | "sepa-settings-update"
  | "sepa-mandate-create"
  | "sepa-mandate-revoke"
  | "credit-grant-create"
  | "invoice-generate"
  | "invoice-replace"
  | "invoice-void"
  | "sepa-batch-generate"
  | "sepa-batch-download"
  | "sepa-batch-mark-downloaded"
  | "sepa-batch-supersede"
  | "sepa-batch-void"
  | "user-ban"
  | "user-unban"
  | "user-admin-grant"
  | "user-admin-revoke"
  | "user-password-reset"
  | "user-impersonate"
  | "session-revoke"
  | "sessions-revoke"
  | "user-delete";

type Actor =
  | {
      kind: "user";
      id: string;
      name: string;
      email: string;
      image?: string | null;
    }
  | { kind: "system"; name: "System" };

type Target = {
  kind:
    | "user"
    | "organization"
    | "organizationMember"
    | "member"
    | "group"
    | "inventory"
    | "invoice"
    | "sepa"
    | "session"
    | "period";
  label: string;
  id?: string;
  secondary?: string;
};

type AuditEvent = {
  id: string;
  time: string;
  actor: Actor;
  action: string;
  target: Target;
  type: AuditEventType;
  category: AuditCategory;
  severity: "info" | "warning" | "critical";
  outcome?: "success" | "denied";
  deniedReason?: string;
  ip: string;
  org?: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
  };
  details: string;
};

const ACTORS = {
  system: { kind: "system", name: "System" } satisfies Actor,
  elias: {
    kind: "user",
    id: "usr_elias",
    name: "Elias Admin",
    email: "elias@example.com",
    image: null,
  } satisfies Actor,
  lena: {
    kind: "user",
    id: "usr_lena",
    name: "Lena Hoffmann",
    email: "lena@example.com",
    image: null,
  } satisfies Actor,
  clubAdmin: {
    kind: "user",
    id: "usr_club_admin",
    name: "Vereinsadmin",
    email: "admin@turnverein-west.de",
    image: null,
  } satisfies Actor,
  finance: {
    kind: "user",
    id: "usr_finance",
    name: "Finanzadmin",
    email: "finanzen@turnverein-west.de",
    image: null,
  } satisfies Actor,
  inventory: {
    kind: "user",
    id: "usr_inventory",
    name: "Lageradmin",
    email: "lager@turnverein-west.de",
    image: null,
  } satisfies Actor,
};

const ORGS = {
  west: {
    id: "org_west",
    name: "Turnverein West",
    slug: "turnverein-west",
    logo: null,
  },
  north: {
    id: "org_north",
    name: "Schwimmclub Nord",
    slug: "schwimmclub-nord",
    logo: null,
  },
};

const EVENT_ICONS: Record<AuditEventType, ComponentType<{ className?: string }>> = {
  "sign-up": UserPlusIcon,
  "sign-in": LogInIcon,
  "org-create": Building2Icon,
  "org-invite": MailPlusIcon,
  "org-member-add": UsersIcon,
  "org-member-remove": UserMinusIcon,
  "member-create": UserPlusIcon,
  "member-update": UserPenIcon,
  "member-contract-update": FileTextIcon,
  "member-contract-cancel": UserXIcon,
  "member-group-assign": UsersIcon,
  "member-group-update": PencilIcon,
  "member-group-remove": UserMinusIcon,
  "group-create": FolderPlusIcon,
  "group-update": PencilIcon,
  "group-delete": Trash2Icon,
  "inventory-create": PackagePlusIcon,
  "inventory-update": PackageIcon,
  "inventory-delete": Trash2Icon,
  "inventory-stock-update": PackageIcon,
  "inventory-sync": RefreshCwIcon,
  "sepa-settings-update": BanknoteIcon,
  "sepa-mandate-create": CreditCardIcon,
  "sepa-mandate-revoke": BanIcon,
  "credit-grant-create": BanknoteIcon,
  "invoice-generate": ReceiptIcon,
  "invoice-replace": RotateCcwIcon,
  "invoice-void": BanIcon,
  "sepa-batch-generate": FileTextIcon,
  "sepa-batch-download": DownloadIcon,
  "sepa-batch-mark-downloaded": DownloadIcon,
  "sepa-batch-supersede": RotateCcwIcon,
  "sepa-batch-void": BanIcon,
  "user-ban": BanIcon,
  "user-unban": RotateCcwIcon,
  "user-admin-grant": ShieldIcon,
  "user-admin-revoke": ShieldIcon,
  "user-password-reset": KeyRoundIcon,
  "user-impersonate": LogInIcon,
  "session-revoke": UserXIcon,
  "sessions-revoke": UserXIcon,
  "user-delete": Trash2Icon,
};

const CATEGORY_LABELS: Record<AuditCategory, string> = {
  auth: "Auth",
  admin: "Admin",
  organization: "Organisationen",
  members: "Mitglieder",
  groups: "Gruppen",
  inventory: "Inventar",
  billing: "Abrechnung",
};

const MOCK_EVENTS: AuditEvent[] = [
  {
    id: "evt_mock_001",
    time: "2026-06-02T14:58:00Z",
    actor: ACTORS.system,
    action: "Sign up",
    target: { kind: "user", label: "Lena Hoffmann", secondary: "lena@example.com" },
    type: "sign-up",
    category: "auth",
    severity: "info",
    ip: "84.141.22.19",
    details: "Neuer Benutzeraccount registriert.",
  },
  {
    id: "evt_mock_002",
    time: "2026-06-02T14:54:00Z",
    actor: ACTORS.lena,
    action: "Sign in",
    target: { kind: "session", label: "Lena Hoffmann", secondary: "Chrome auf macOS" },
    type: "sign-in",
    category: "auth",
    severity: "info",
    ip: "84.141.22.19",
    details: "Login erfolgreich.",
  },
  {
    id: "evt_mock_043",
    time: "2026-06-02T14:49:00Z",
    actor: ACTORS.system,
    action: "Sign in",
    target: { kind: "user", label: "Maria Schmitt", secondary: "maria@example.com" },
    type: "sign-in",
    category: "auth",
    severity: "critical",
    outcome: "denied",
    deniedReason: "Benutzerkonto ist gesperrt.",
    ip: "185.220.101.42",
    details: "Login wurde wegen gesperrtem Benutzerkonto abgelehnt.",
  },
  {
    id: "evt_mock_003",
    time: "2026-06-02T14:42:00Z",
    actor: ACTORS.elias,
    action: "Organisation erstellt",
    target: { kind: "organization", label: ORGS.west.name, secondary: ORGS.west.slug },
    type: "org-create",
    category: "organization",
    severity: "info",
    ip: "91.12.44.18",
    org: ORGS.west,
    details: "Organisation wurde über das Admin-Panel angelegt.",
  },
  {
    id: "evt_mock_004",
    time: "2026-06-02T14:36:00Z",
    actor: ACTORS.elias,
    action: "Org-Mitglied eingeladen",
    target: { kind: "organizationMember", label: "Max Kramer", secondary: "max@example.com" },
    type: "org-invite",
    category: "organization",
    severity: "info",
    ip: "91.12.44.18",
    org: ORGS.west,
    details: "Einladung mit Rolle admin verschickt.",
  },
  {
    id: "evt_mock_005",
    time: "2026-06-02T14:31:00Z",
    actor: ACTORS.elias,
    action: "Org-Mitglied hinzugefügt",
    target: { kind: "organizationMember", label: "Jonas Keller", secondary: "jonas@example.com" },
    type: "org-member-add",
    category: "organization",
    severity: "warning",
    ip: "91.12.44.18",
    org: ORGS.west,
    details: "Benutzer direkt durch Platform Admin hinzugefügt.",
  },
  {
    id: "evt_mock_006",
    time: "2026-06-02T14:26:00Z",
    actor: ACTORS.elias,
    action: "Org-Mitglied entfernt",
    target: { kind: "organizationMember", label: "Anne Wolf", secondary: "anne@example.com" },
    type: "org-member-remove",
    category: "organization",
    severity: "warning",
    ip: "91.12.44.18",
    org: ORGS.north,
    details: "Benutzer wurde aus der Organisation entfernt.",
  },
  {
    id: "evt_mock_007",
    time: "2026-06-02T14:18:00Z",
    actor: ACTORS.clubAdmin,
    action: "Mitglied erstellt",
    target: { kind: "member", id: "M-1042", label: "Anna Becker", secondary: "M-1042" },
    type: "member-create",
    category: "members",
    severity: "info",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Neuer Vereinsdatensatz mit Vertrag angelegt.",
  },
  {
    id: "evt_mock_008",
    time: "2026-06-02T14:12:00Z",
    actor: ACTORS.clubAdmin,
    action: "Mitglied bearbeitet",
    target: { kind: "member", id: "M-1042", label: "Anna Becker", secondary: "M-1042" },
    type: "member-update",
    category: "members",
    severity: "info",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Adresse und Kontaktdaten aktualisiert.",
  },
  {
    id: "evt_mock_009",
    time: "2026-06-02T14:06:00Z",
    actor: ACTORS.clubAdmin,
    action: "Vertrag bearbeitet",
    target: { kind: "member", id: "M-1042", label: "Anna Becker", secondary: "M-1042" },
    type: "member-contract-update",
    category: "members",
    severity: "warning",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Monatsbeitrag und Startdatum geändert.",
  },
  {
    id: "evt_mock_010",
    time: "2026-06-02T13:59:00Z",
    actor: ACTORS.clubAdmin,
    action: "Vertrag gekündigt",
    target: { kind: "member", id: "M-0918", label: "Paul Richter", secondary: "M-0918" },
    type: "member-contract-cancel",
    category: "members",
    severity: "warning",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Kündigungsdatum und Grund hinterlegt.",
  },
  {
    id: "evt_mock_011",
    time: "2026-06-02T13:52:00Z",
    actor: ACTORS.clubAdmin,
    action: "Gruppe zugewiesen",
    target: { kind: "member", id: "M-1042", label: "Anna Becker", secondary: "Karate" },
    type: "member-group-assign",
    category: "members",
    severity: "info",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Mitglied einer Gruppe zugeordnet.",
  },
  {
    id: "evt_mock_012",
    time: "2026-06-02T13:47:00Z",
    actor: ACTORS.clubAdmin,
    action: "Gruppenmitgliedschaft bearbeitet",
    target: { kind: "member", id: "M-1042", label: "Anna Becker", secondary: "Karate" },
    type: "member-group-update",
    category: "members",
    severity: "info",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Gruppenbeitrag und Startdatum angepasst.",
  },
  {
    id: "evt_mock_013",
    time: "2026-06-02T13:43:00Z",
    actor: ACTORS.clubAdmin,
    action: "Gruppenmitgliedschaft entfernt",
    target: { kind: "member", id: "M-1042", label: "Anna Becker", secondary: "Karate" },
    type: "member-group-remove",
    category: "members",
    severity: "info",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Mitgliedschaft in der Gruppe beendet.",
  },
  {
    id: "evt_mock_014",
    time: "2026-06-02T13:38:00Z",
    actor: ACTORS.clubAdmin,
    action: "Gruppe erstellt",
    target: { kind: "group", label: "Yoga Anfänger" },
    type: "group-create",
    category: "groups",
    severity: "info",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Neue Gruppe mit Standardbeitrag angelegt.",
  },
  {
    id: "evt_mock_015",
    time: "2026-06-02T13:35:00Z",
    actor: ACTORS.clubAdmin,
    action: "Gruppe bearbeitet",
    target: { kind: "group", label: "Yoga Anfänger" },
    type: "group-update",
    category: "groups",
    severity: "info",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Name, Farbe und Standardbeitrag geändert.",
  },
  {
    id: "evt_mock_016",
    time: "2026-06-02T13:31:00Z",
    actor: ACTORS.clubAdmin,
    action: "Gruppe gelöscht",
    target: { kind: "group", label: "Archiv 2024" },
    type: "group-delete",
    category: "groups",
    severity: "warning",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Leere Gruppe entfernt.",
  },
  {
    id: "evt_mock_017",
    time: "2026-06-02T13:25:00Z",
    actor: ACTORS.inventory,
    action: "Inventarprodukt erstellt",
    target: { kind: "inventory", label: "T-Shirt Classic" },
    type: "inventory-create",
    category: "inventory",
    severity: "info",
    ip: "91.12.44.18",
    org: ORGS.west,
    details: "Produkt mit Varianten angelegt.",
  },
  {
    id: "evt_mock_018",
    time: "2026-06-02T13:21:00Z",
    actor: ACTORS.inventory,
    action: "Inventarprodukt bearbeitet",
    target: { kind: "inventory", label: "T-Shirt Classic" },
    type: "inventory-update",
    category: "inventory",
    severity: "info",
    ip: "91.12.44.18",
    org: ORGS.west,
    details: "Beschreibung und Varianten geändert.",
  },
  {
    id: "evt_mock_019",
    time: "2026-06-02T13:18:00Z",
    actor: ACTORS.inventory,
    action: "Inventarprodukt gelöscht",
    target: { kind: "inventory", label: "Cap Altbestand" },
    type: "inventory-delete",
    category: "inventory",
    severity: "warning",
    ip: "91.12.44.18",
    org: ORGS.west,
    details: "Produkt aus Inventar entfernt.",
  },
  {
    id: "evt_mock_020",
    time: "2026-06-02T13:12:00Z",
    actor: ACTORS.inventory,
    action: "Bestand aktualisiert",
    target: { kind: "inventory", label: "T-Shirt Classic", secondary: "Größe M" },
    type: "inventory-stock-update",
    category: "inventory",
    severity: "info",
    ip: "91.12.44.18",
    org: ORGS.west,
    details: "Variantenbestand von 18 auf 24 gesetzt.",
  },
  {
    id: "evt_mock_021",
    time: "2026-06-02T13:08:00Z",
    actor: ACTORS.system,
    action: "Inventar synchronisiert",
    target: { kind: "inventory", label: "Bestandsabgleich" },
    type: "inventory-sync",
    category: "inventory",
    severity: "info",
    ip: "internal",
    org: ORGS.west,
    details: "Bestandsdaten aus externem System synchronisiert.",
  },
  {
    id: "evt_mock_022",
    time: "2026-06-02T13:02:00Z",
    actor: ACTORS.finance,
    action: "SEPA-Einstellungen bearbeitet",
    target: { kind: "sepa", label: "SEPA-Einstellungen" },
    type: "sepa-settings-update",
    category: "billing",
    severity: "warning",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Gläubiger-ID und Einzugstext aktualisiert.",
  },
  {
    id: "evt_mock_023",
    time: "2026-06-02T12:57:00Z",
    actor: ACTORS.finance,
    action: "SEPA-Mandat erstellt",
    target: { kind: "member", id: "M-1042", label: "Anna Becker", secondary: "M-1042" },
    type: "sepa-mandate-create",
    category: "billing",
    severity: "info",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Mandat mit IBAN und Referenz angelegt.",
  },
  {
    id: "evt_mock_024",
    time: "2026-06-02T12:52:00Z",
    actor: ACTORS.finance,
    action: "SEPA-Mandat widerrufen",
    target: { kind: "member", id: "M-0918", label: "Paul Richter", secondary: "M-0918" },
    type: "sepa-mandate-revoke",
    category: "billing",
    severity: "warning",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Mandat deaktiviert.",
  },
  {
    id: "evt_mock_025",
    time: "2026-06-02T12:47:00Z",
    actor: ACTORS.finance,
    action: "Gutschrift erstellt",
    target: { kind: "member", id: "M-1042", label: "Anna Becker", secondary: "25,00 EUR" },
    type: "credit-grant-create",
    category: "billing",
    severity: "warning",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Gutschrift über 25,00 EUR erfasst.",
  },
  {
    id: "evt_mock_026",
    time: "2026-06-02T12:41:00Z",
    actor: ACTORS.finance,
    action: "Rechnungen generiert",
    target: { kind: "period", label: "2026-06" },
    type: "invoice-generate",
    category: "billing",
    severity: "warning",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Monatsrechnungen für Organisation erstellt.",
  },
  {
    id: "evt_mock_027",
    time: "2026-06-02T12:36:00Z",
    actor: ACTORS.finance,
    action: "Rechnung ersetzt",
    target: { kind: "invoice", label: "INV-2026-0042" },
    type: "invoice-replace",
    category: "billing",
    severity: "warning",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Bestehende Rechnung storniert und neu erzeugt.",
  },
  {
    id: "evt_mock_028",
    time: "2026-06-02T12:31:00Z",
    actor: ACTORS.finance,
    action: "Rechnung ungültig gemacht",
    target: { kind: "invoice", label: "INV-2026-0037" },
    type: "invoice-void",
    category: "billing",
    severity: "critical",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Rechnung auf void gesetzt.",
  },
  {
    id: "evt_mock_029",
    time: "2026-06-02T12:24:00Z",
    actor: ACTORS.finance,
    action: "SEPA-Batch generiert",
    target: { kind: "sepa", label: "BATCH-2026-06-01" },
    type: "sepa-batch-generate",
    category: "billing",
    severity: "warning",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Einzugsdatei für offene Rechnungen erzeugt.",
  },
  {
    id: "evt_mock_030",
    time: "2026-06-02T12:19:00Z",
    actor: ACTORS.finance,
    action: "SEPA-Batch heruntergeladen",
    target: { kind: "sepa", label: "BATCH-2026-06-01" },
    type: "sepa-batch-download",
    category: "billing",
    severity: "warning",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "XML-Datei heruntergeladen.",
  },
  {
    id: "evt_mock_031",
    time: "2026-06-02T12:15:00Z",
    actor: ACTORS.finance,
    action: "SEPA-Batch als heruntergeladen markiert",
    target: { kind: "sepa", label: "BATCH-2026-06-01" },
    type: "sepa-batch-mark-downloaded",
    category: "billing",
    severity: "warning",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Batch-Status manuell auf downloaded gesetzt.",
  },
  {
    id: "evt_mock_032",
    time: "2026-06-02T12:10:00Z",
    actor: ACTORS.finance,
    action: "SEPA-Batch ersetzt",
    target: { kind: "sepa", label: "BATCH-2026-05-01" },
    type: "sepa-batch-supersede",
    category: "billing",
    severity: "critical",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Alter Batch durch korrigierten Batch ersetzt.",
  },
  {
    id: "evt_mock_033",
    time: "2026-06-02T12:06:00Z",
    actor: ACTORS.finance,
    action: "SEPA-Batch ungültig gemacht",
    target: { kind: "sepa", label: "BATCH-2026-04-01" },
    type: "sepa-batch-void",
    category: "billing",
    severity: "critical",
    ip: "80.187.71.9",
    org: ORGS.west,
    details: "Batch zurückgezogen, Rechnungen wieder freigegeben.",
  },
  {
    id: "evt_mock_034",
    time: "2026-06-02T11:58:00Z",
    actor: ACTORS.elias,
    action: "Benutzer gesperrt",
    target: { kind: "user", label: "Maria Schmitt", secondary: "maria@example.com" },
    type: "user-ban",
    category: "admin",
    severity: "critical",
    ip: "91.12.44.18",
    details: "Sperrgrund hinterlegt.",
  },
  {
    id: "evt_mock_035",
    time: "2026-06-02T11:52:00Z",
    actor: ACTORS.elias,
    action: "Benutzer entsperrt",
    target: { kind: "user", label: "Maria Schmitt", secondary: "maria@example.com" },
    type: "user-unban",
    category: "admin",
    severity: "warning",
    ip: "91.12.44.18",
    details: "Sperre aufgehoben.",
  },
  {
    id: "evt_mock_036",
    time: "2026-06-02T11:47:00Z",
    actor: ACTORS.elias,
    action: "Adminrechte vergeben",
    target: { kind: "user", label: "Jonas Keller", secondary: "jonas@example.com" },
    type: "user-admin-grant",
    category: "admin",
    severity: "critical",
    ip: "91.12.44.18",
    details: "Plattformrolle von Benutzer auf Admin geändert.",
  },
  {
    id: "evt_mock_037",
    time: "2026-06-02T11:42:00Z",
    actor: ACTORS.elias,
    action: "Adminrechte entzogen",
    target: { kind: "user", label: "Jonas Keller", secondary: "jonas@example.com" },
    type: "user-admin-revoke",
    category: "admin",
    severity: "critical",
    ip: "91.12.44.18",
    details: "Plattformrolle von Admin auf Benutzer geändert.",
  },
  {
    id: "evt_mock_038",
    time: "2026-06-02T11:37:00Z",
    actor: ACTORS.elias,
    action: "Passwort zurückgesetzt",
    target: { kind: "user", label: "Support User", secondary: "support@example.com" },
    type: "user-password-reset",
    category: "admin",
    severity: "critical",
    ip: "91.12.44.18",
    details: "Neues Passwort durch Platform Admin gesetzt.",
  },
  {
    id: "evt_mock_039",
    time: "2026-06-02T11:33:00Z",
    actor: ACTORS.elias,
    action: "Benutzer impersoniert",
    target: { kind: "user", label: "Support User", secondary: "support@example.com" },
    type: "user-impersonate",
    category: "admin",
    severity: "critical",
    ip: "91.12.44.18",
    details: "Admin hat eine Benutzer-Session übernommen.",
  },
  {
    id: "evt_mock_040",
    time: "2026-06-02T11:28:00Z",
    actor: ACTORS.elias,
    action: "Session widerrufen",
    target: { kind: "session", id: "sess_9a41", label: "Support User", secondary: "sess_9a41" },
    type: "session-revoke",
    category: "admin",
    severity: "warning",
    ip: "91.12.44.18",
    details: "Eine aktive Session wurde beendet.",
  },
  {
    id: "evt_mock_041",
    time: "2026-06-02T11:24:00Z",
    actor: ACTORS.elias,
    action: "Alle Sessions widerrufen",
    target: { kind: "user", label: "Support User", secondary: "support@example.com" },
    type: "sessions-revoke",
    category: "admin",
    severity: "critical",
    ip: "91.12.44.18",
    details: "Alle aktiven Sessions des Benutzers wurden beendet.",
  },
  {
    id: "evt_mock_042",
    time: "2026-06-02T11:20:00Z",
    actor: ACTORS.elias,
    action: "Benutzer gelöscht",
    target: { kind: "user", label: "Old User", secondary: "old-user@example.com" },
    type: "user-delete",
    category: "admin",
    severity: "critical",
    ip: "91.12.44.18",
    details: "Benutzerkonto dauerhaft entfernt.",
  },
];

function severityVariant(severity: AuditEvent["severity"]) {
  if (severity === "critical") return "destructive" as const;
  if (severity === "warning") return "warning" as const;
  return "secondary" as const;
}

function severityLabel(severity: AuditEvent["severity"]) {
  if (severity === "critical") return "Kritisch";
  if (severity === "warning") return "Warnung";
  return "Info";
}

function eventOutcome(event: AuditEvent) {
  return event.outcome ?? "success";
}

function outcomeLabel(outcome: ReturnType<typeof eventOutcome>) {
  return outcome === "denied" ? "Abgelehnt" : "Erfolgreich";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("de-DE");
}

function actorText(actor: Actor) {
  return actor.kind === "system" ? actor.name : `${actor.name} ${actor.email}`;
}

function targetKindLabel(kind: Target["kind"]) {
  const labels: Record<Target["kind"], string> = {
    user: "Benutzer",
    organization: "Organisation",
    organizationMember: "Benutzer",
    member: "Mitglied",
    group: "Gruppe",
    inventory: "Inventar",
    invoice: "Rechnung",
    sepa: "SEPA",
    session: "Session",
    period: "Zeitraum",
  };

  return labels[kind];
}

type SheetSelection =
  | { kind: "event"; event: AuditEvent }
  | { kind: "actor"; actor: Actor; event: AuditEvent }
  | { kind: "org"; org: NonNullable<AuditEvent["org"]>; event: AuditEvent }
  | { kind: "target"; target: Target; event: AuditEvent };

function ActorButton({ actor, onClick }: { actor: Actor; onClick: () => void }) {
  if (actor.kind === "system") {
    return (
      <button
        className="flex items-center gap-2 text-left hover:underline"
        onClick={onClick}
        type="button"
      >
        <span className="flex size-7 items-center justify-center rounded-full border bg-muted text-muted-foreground">
          <RefreshCwIcon className="size-3.5" />
        </span>
        <span className="font-medium">{actor.name}</span>
      </button>
    );
  }

  return (
    <button
      className="flex min-w-0 items-center gap-2 text-left hover:underline"
      onClick={onClick}
      type="button"
    >
      <UserAvatar className="size-7" image={actor.image} name={actor.name} seed={actor.id} />
      <span className="min-w-0">
        <span className="block truncate font-medium">{actor.name}</span>
        <span className="block truncate text-muted-foreground text-xs">{actor.email}</span>
      </span>
    </button>
  );
}

function TargetButton({ target, onClick }: { target: Target; onClick: () => void }) {
  return (
    <button
      className="flex min-w-0 items-start gap-2 text-left hover:underline"
      onClick={onClick}
      type="button"
    >
      <Badge className="mt-0.5 shrink-0" variant="outline">
        {targetKindLabel(target.kind)}
      </Badge>
      <span className="min-w-0">
        <span className="block truncate text-foreground">{target.label}</span>
        {target.secondary ? (
          <span className="block truncate text-muted-foreground text-xs">{target.secondary}</span>
        ) : null}
      </span>
    </button>
  );
}

function OrgButton({
  org,
  onClick,
}: {
  org?: AuditEvent["org"];
  onClick: (org: NonNullable<AuditEvent["org"]>) => void;
}) {
  if (!org) return <span className="text-muted-foreground">-</span>;

  return (
    <button
      className="flex min-w-0 items-center gap-2 text-left hover:underline"
      onClick={() => onClick(org)}
      type="button"
    >
      <OrganizationAvatar
        className="size-7 rounded-md"
        id={org.id}
        logo={org.logo}
        name={org.name}
      />
      <span className="min-w-0">
        <span className="block truncate font-medium">{org.name}</span>
        <span className="block truncate text-muted-foreground text-xs">{org.slug}</span>
      </span>
    </button>
  );
}

function EventSheetContent({ event }: { event: AuditEvent }) {
  const outcome = eventOutcome(event);

  return (
    <>
      <SheetHeader>
        <SheetTitle>{event.action}</SheetTitle>
        <SheetDescription>{formatDate(event.time)}</SheetDescription>
      </SheetHeader>
      <SheetPanel className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={severityVariant(event.severity)}>{severityLabel(event.severity)}</Badge>
          {outcome === "denied" ? (
            <Badge variant="destructive">{outcomeLabel(outcome)}</Badge>
          ) : null}
          <Badge variant="outline">{CATEGORY_LABELS[event.category]}</Badge>
          <Badge variant="outline">{event.type}</Badge>
        </div>

        <div className="grid gap-4">
          <DetailField label="Event-ID" value={event.id} />
          <DetailField label="Status" value={outcomeLabel(outcome)} />
          {event.deniedReason ? (
            <DetailField label="Ablehnungsgrund" value={event.deniedReason} />
          ) : null}
          <DetailField label="Actor" value={actorText(event.actor)} />
          <DetailField
            label="Organisation"
            value={event.org ? `${event.org.name} (${event.org.slug})` : "Keine Organisation"}
          />
          <DetailField
            label="Ziel"
            value={
              event.target.secondary
                ? `${targetKindLabel(event.target.kind)}: ${event.target.label} (${event.target.secondary})`
                : `${targetKindLabel(event.target.kind)}: ${event.target.label}`
            }
          />
          <DetailField label="IP" value={event.ip} />
          <DetailField label="Details" value={event.details} />
        </div>
      </SheetPanel>
    </>
  );
}

function ActorSheetContent({ actor, event }: { actor: Actor; event: AuditEvent }) {
  if (actor.kind === "system") {
    return (
      <>
        <SheetHeader>
          <SheetTitle>System</SheetTitle>
          <SheetDescription>Automatischer Actor für Plattformprozesse.</SheetDescription>
        </SheetHeader>
        <SheetPanel className="space-y-5">
          <DetailField label="Letztes Ereignis" value={event.action} />
          <DetailField label="Event-ID" value={event.id} />
          <DetailField label="Kategorie" value={CATEGORY_LABELS[event.category]} />
        </SheetPanel>
      </>
    );
  }

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-3">
          <UserAvatar className="size-10" image={actor.image} name={actor.name} seed={actor.id} />
          <div className="min-w-0">
            <SheetTitle>{actor.name}</SheetTitle>
            <SheetDescription>{actor.email}</SheetDescription>
          </div>
        </div>
      </SheetHeader>
      <SheetPanel className="space-y-5">
        <div className="grid gap-4">
          <DetailField label="User-ID" value={actor.id} />
          <DetailField label="Ausgelöstes Event" value={event.action} />
          <DetailField label="IP" value={event.ip} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline">
            <FileTextIcon />
            Profil
          </Button>
          <Button size="sm" variant="outline">
            <UserXIcon />
            Sessions
          </Button>
          <Button size="sm" variant="outline">
            <LogInIcon />
            Impersonieren
          </Button>
          <Button size="sm" variant="destructive">
            <BanIcon />
            Sperren
          </Button>
        </div>
      </SheetPanel>
    </>
  );
}

function OrgSheetContent({
  org,
  event,
}: {
  org: NonNullable<AuditEvent["org"]>;
  event: AuditEvent;
}) {
  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-3">
          <OrganizationAvatar
            className="size-10 rounded-md"
            id={org.id}
            logo={org.logo}
            name={org.name}
          />
          <div className="min-w-0">
            <SheetTitle>{org.name}</SheetTitle>
            <SheetDescription>{org.slug}</SheetDescription>
          </div>
        </div>
      </SheetHeader>
      <SheetPanel className="space-y-5">
        <div className="grid gap-4">
          <DetailField label="Org-ID" value={org.id} />
          <DetailField label="Kontext-Event" value={event.action} />
          <DetailField label="Kategorie" value={CATEGORY_LABELS[event.category]} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline">
            <Building2Icon />
            Profil
          </Button>
          <Button size="sm" variant="outline">
            <UsersIcon />
            Mitglieder
          </Button>
          <Button size="sm" variant="outline">
            <ReceiptIcon />
            Abrechnung
          </Button>
          <Button size="sm" variant="destructive">
            <UserMinusIcon />
            Zugriff
          </Button>
        </div>
      </SheetPanel>
    </>
  );
}

function TargetSheetContent({ target, event }: { target: Target; event: AuditEvent }) {
  return (
    <>
      <SheetHeader>
        <SheetTitle>{target.label}</SheetTitle>
        <SheetDescription>{targetKindLabel(target.kind)}</SheetDescription>
      </SheetHeader>
      <SheetPanel className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{targetKindLabel(target.kind)}</Badge>
          <Badge variant="outline">{CATEGORY_LABELS[event.category]}</Badge>
        </div>
        <div className="grid gap-4">
          <DetailField label="Zieltyp" value={targetKindLabel(target.kind)} />
          <DetailField label="Name" value={target.label} />
          {target.id ? <DetailField label="ID" value={target.id} /> : null}
          {target.secondary ? <DetailField label="Zusatz" value={target.secondary} /> : null}
          <DetailField label="Aus Ereignis" value={event.action} />
          <DetailField label="Details" value={event.details} />
        </div>
      </SheetPanel>
    </>
  );
}

function SheetSelectionContent({ selection }: { selection: SheetSelection }) {
  if (selection.kind === "event") return <EventSheetContent event={selection.event} />;
  if (selection.kind === "actor") {
    return <ActorSheetContent actor={selection.actor} event={selection.event} />;
  }
  if (selection.kind === "org") {
    return <OrgSheetContent event={selection.event} org={selection.org} />;
  }

  return <TargetSheetContent event={selection.event} target={selection.target} />;
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="break-words text-sm">{value}</p>
    </div>
  );
}

function RouteComponent() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | AuditCategory>("all");
  const [severity, setSeverity] = useState<"all" | AuditEvent["severity"]>("all");
  const [actorKind, setActorKind] = useState<"all" | Actor["kind"]>("all");
  const [orgId, setOrgId] = useState<"all" | string>("all");
  const [advanced, setAdvanced] = useState({
    criticalOnly: false,
    deniedOnly: false,
    systemOnly: false,
    adminOnly: false,
    todayOnly: false,
  });
  const [selection, setSelection] = useState<SheetSelection | null>(null);

  const events = useMemo(() => {
    const query = search.trim().toLowerCase();
    const todayPrefix = "2026-06-02";

    return MOCK_EVENTS.filter((event) => {
      if (category !== "all" && event.category !== category) return false;
      if (severity !== "all" && event.severity !== severity) return false;
      if (actorKind !== "all" && event.actor.kind !== actorKind) return false;
      if (orgId !== "all" && event.org?.id !== orgId) return false;
      if (advanced.criticalOnly && event.severity !== "critical") return false;
      if (advanced.deniedOnly && eventOutcome(event) !== "denied") return false;
      if (advanced.systemOnly && event.actor.kind !== "system") return false;
      if (advanced.adminOnly && event.category !== "admin") return false;
      if (advanced.todayOnly && !event.time.startsWith(todayPrefix)) return false;
      if (!query) return true;

      return [
        actorText(event.actor),
        event.action,
        event.target.label,
        event.target.secondary ?? "",
        event.org?.name ?? "",
        event.org?.slug ?? "",
        event.ip,
        event.details,
        eventOutcome(event),
        event.type,
        event.category,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [search, category, severity, actorKind, orgId, advanced]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sicherheitsrelevante Plattform- und Organisationsereignisse.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <InputGroup className="max-w-sm">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nach Actor, Ziel, Org, Aktion oder IP suchen..."
            value={search}
          />
        </InputGroup>

        <Menu>
          <MenuTrigger render={<Button size="sm" variant="outline" />}>
            <FilterIcon />
            Kategorie
          </MenuTrigger>
          <MenuPopup align="start">
            <MenuRadioGroup
              onValueChange={(value) => setCategory(value as typeof category)}
              value={category}
            >
              <MenuRadioItem value="all">Alle</MenuRadioItem>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <MenuRadioItem key={value} value={value}>
                  {label}
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          </MenuPopup>
        </Menu>

        <Menu>
          <MenuTrigger render={<Button size="sm" variant="outline" />}>Level</MenuTrigger>
          <MenuPopup align="start">
            <MenuRadioGroup
              onValueChange={(value) => setSeverity(value as typeof severity)}
              value={severity}
            >
              <MenuRadioItem value="all">Alle</MenuRadioItem>
              <MenuRadioItem value="critical">Kritisch</MenuRadioItem>
              <MenuRadioItem value="warning">Warnung</MenuRadioItem>
              <MenuRadioItem value="info">Info</MenuRadioItem>
            </MenuRadioGroup>
          </MenuPopup>
        </Menu>

        <Menu>
          <MenuTrigger render={<Button size="sm" variant="outline" />}>Actor</MenuTrigger>
          <MenuPopup align="start">
            <MenuRadioGroup
              onValueChange={(value) => setActorKind(value as typeof actorKind)}
              value={actorKind}
            >
              <MenuRadioItem value="all">Alle</MenuRadioItem>
              <MenuRadioItem value="user">Benutzer</MenuRadioItem>
              <MenuRadioItem value="system">System</MenuRadioItem>
            </MenuRadioGroup>
          </MenuPopup>
        </Menu>

        <Menu>
          <MenuTrigger render={<Button size="sm" variant="outline" />}>Organisation</MenuTrigger>
          <MenuPopup align="start">
            <MenuRadioGroup onValueChange={setOrgId} value={orgId}>
              <MenuRadioItem value="all">Alle</MenuRadioItem>
              {Object.values(ORGS).map((org) => (
                <MenuRadioItem key={org.id} value={org.id}>
                  {org.name}
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          </MenuPopup>
        </Menu>

        <Menu>
          <MenuTrigger render={<Button size="sm" variant="outline" />}>
            <SlidersHorizontalIcon />
            Erweitert
          </MenuTrigger>
          <MenuPopup align="start" className="min-w-56">
            <MenuGroupLabel>Zusätzliche Filter</MenuGroupLabel>
            <MenuCheckboxItem
              checked={advanced.criticalOnly}
              onCheckedChange={(checked) =>
                setAdvanced((current) => ({ ...current, criticalOnly: Boolean(checked) }))
              }
            >
              Nur kritische Events
            </MenuCheckboxItem>
            <MenuCheckboxItem
              checked={advanced.deniedOnly}
              onCheckedChange={(checked) =>
                setAdvanced((current) => ({ ...current, deniedOnly: Boolean(checked) }))
              }
            >
              Nur abgelehnte Events
            </MenuCheckboxItem>
            <MenuCheckboxItem
              checked={advanced.systemOnly}
              onCheckedChange={(checked) =>
                setAdvanced((current) => ({ ...current, systemOnly: Boolean(checked) }))
              }
            >
              Nur System-Actor
            </MenuCheckboxItem>
            <MenuCheckboxItem
              checked={advanced.adminOnly}
              onCheckedChange={(checked) =>
                setAdvanced((current) => ({ ...current, adminOnly: Boolean(checked) }))
              }
            >
              Nur Platform-Admin
            </MenuCheckboxItem>
            <MenuSeparator />
            <MenuCheckboxItem
              checked={advanced.todayOnly}
              onCheckedChange={(checked) =>
                setAdvanced((current) => ({ ...current, todayOnly: Boolean(checked) }))
              }
            >
              Nur heute
            </MenuCheckboxItem>
          </MenuPopup>
        </Menu>

        <Badge variant="outline">{events.length} Ereignisse</Badge>
      </div>

      <CardFrame className="w-full min-w-0 overflow-hidden">
        <Table className="min-w-[1120px]" variant="card">
          <TableHeader>
            <TableRow>
              <TableHead>Zeit</TableHead>
              <TableHead>Ereignis</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Organisation</TableHead>
              <TableHead>Ziel</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-center text-muted-foreground" colSpan={8}>
                  Keine Audit-Ereignisse gefunden.
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => {
                const Icon = EVENT_ICONS[event.type];
                const outcome = eventOutcome(event);

                return (
                  <TableRow key={event.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(event.time)}
                    </TableCell>
                    <TableCell>
                      <button
                        className="flex items-center gap-2 text-left hover:underline"
                        onClick={() => setSelection({ kind: "event", event })}
                        type="button"
                      >
                        <span
                          className={
                            outcome === "denied"
                              ? "flex size-7 shrink-0 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive"
                              : "flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground"
                          }
                        >
                          <Icon className="size-3.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{event.action}</span>
                          {outcome === "denied" ? (
                            <span className="block text-destructive text-xs">Abgelehnt</span>
                          ) : null}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell>
                      <ActorButton
                        actor={event.actor}
                        onClick={() => setSelection({ actor: event.actor, event, kind: "actor" })}
                      />
                    </TableCell>
                    <TableCell>
                      <OrgButton
                        onClick={(org) => setSelection({ event, kind: "org", org })}
                        org={event.org}
                      />
                    </TableCell>
                    <TableCell className="max-w-72">
                      <TargetButton
                        onClick={() =>
                          setSelection({ event, kind: "target", target: event.target })
                        }
                        target={event.target}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={severityVariant(event.severity)}>
                        {severityLabel(event.severity)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{event.ip}</TableCell>
                    <TableCell className="max-w-96 truncate text-muted-foreground">
                      {event.details}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardFrame>

      <Sheet onOpenChange={(open) => !open && setSelection(null)} open={Boolean(selection)}>
        <SheetPopup className="max-w-lg">
          {selection ? <SheetSelectionContent selection={selection} /> : null}
        </SheetPopup>
      </Sheet>
    </div>
  );
}
