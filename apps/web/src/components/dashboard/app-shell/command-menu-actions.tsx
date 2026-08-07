import {
  Building2Icon,
  CalendarPlusIcon,
  DumbbellIcon,
  FolderPlusIcon,
  HandCoinsIcon,
  UserPlusIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";

import type { FileRouteTypes } from "@/routeTree.gen";

type CustomCommandBase = {
  label: string;
  description?: string;
  icon: LucideIcon;
  keywords?: string[];
};

type CustomCommandLink = CustomCommandBase & {
  href: FileRouteTypes["to"];
  action?: never;
};

type CustomCommandCallback = CustomCommandBase & {
  action: (context: CommandActionContext) => CommandActionResult | Promise<CommandActionResult>;
  href?: never;
};

export type CustomCommandAction = CustomCommandLink | CustomCommandCallback;

export type MemberCommandAction = "credit" | "assign-group";

export type CommandActionResult = { keepOpen?: boolean } | void;

export type CommandActionContext = {
  openCreateGroup: () => void;
  openCreateEvent: () => void;
  openCreateCoaching: () => void;
  openOrganizationSwitcher: () => void;
  startMemberAction: (action: MemberCommandAction) => CommandActionResult;
};

/**
 * Commands that do not belong in the sidebar. Add an `href` for navigation or
 * an `action` for an immediate command. The type intentionally prevents both.
 */
export const customCommandActions: CustomCommandAction[] = [
  {
    label: "Neues Mitglied anlegen",
    description: "Mitglieder",
    icon: UserPlusIcon,
    keywords: ["erstellen", "person", "aufnahme"],
    href: "/dashboard/members/new",
  },
  {
    label: "Neue Gruppe anlegen",
    description: "Gruppen",
    icon: FolderPlusIcon,
    keywords: ["erstellen", "team", "mannschaft"],
    action: ({ openCreateGroup }) => openCreateGroup(),
  },
  {
    label: "Neue Veranstaltung anlegen",
    description: "Veranstaltungen",
    icon: CalendarPlusIcon,
    keywords: ["erstellen", "event", "termin"],
    action: ({ openCreateEvent }) => openCreateEvent(),
  },
  {
    label: "Neues Einzelcoaching anlegen",
    description: "Einzelcoaching",
    icon: DumbbellIcon,
    keywords: ["erstellen", "training", "termin"],
    action: ({ openCreateCoaching }) => openCreateCoaching(),
  },
  {
    label: "Guthaben für Mitglied erstellen",
    description: "Mitglied auswählen",
    icon: HandCoinsIcon,
    keywords: ["gutschrift", "geld", "freie monate"],
    action: ({ startMemberAction }) => startMemberAction("credit"),
  },
  {
    label: "Mitglied einer Gruppe zuweisen",
    description: "Mitglied auswählen",
    icon: UsersRoundIcon,
    keywords: ["gruppe", "zuordnen", "aufnahme"],
    action: ({ startMemberAction }) => startMemberAction("assign-group"),
  },
  {
    label: "Organisation wechseln",
    description: "Arbeitsbereich",
    icon: Building2Icon,
    keywords: ["verein", "workspace"],
    action: ({ openOrganizationSwitcher }) => openOrganizationSwitcher(),
  },
];
