"use client";

import { Button } from "@matdesk/ui/components/button";
import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandDialogPrimitive,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
} from "@matdesk/ui/components/command";
import { Kbd, KbdGroup } from "@matdesk/ui/components/kbd";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxesIcon,
  CornerDownLeftIcon,
  SearchIcon,
} from "lucide-react";
import { Fragment, createElement, type ReactNode, useEffect, useState } from "react";

import {
  type CommandActionContext,
  type CommandActionResult,
  type CustomCommandAction,
  type MemberCommandAction,
  customCommandActions,
} from "@/components/dashboard/app-shell/command-menu-actions";
import { navGroups } from "@/components/dashboard/app-shell/app-shared";
import { openOrgSwitcher } from "@/components/auth/org-switcher";
import { UserAvatar } from "@/components/auth/user-avatar";
import { CoachingDialog } from "@/components/dashboard/coaching/coaching-dialog";
import { EventDialog } from "@/components/dashboard/events/event-dialog";
import { GroupDialog, type GroupRow } from "@/components/dashboard/groups/group-dialog";
import { AssignGroupDialog } from "@/components/dashboard/members/assign-group-dialog";
import { CreditGrantDialog } from "@/components/dashboard/members/credit-grant-dialog";
import { groupsQueryOptions } from "@/queries/groups";
import { membersListQueryOptions } from "@/queries/members";
import type { FileRouteTypes } from "@/routeTree.gen";
import { client } from "@/utils/orpc";

type MemberSearchResult = Awaited<ReturnType<typeof client.members.query>>["data"][number];

type CommandOption = {
  value: string;
  label: string;
  description?: string;
  icon: ReactNode;
} & (
  | { href: FileRouteTypes["to"]; action?: never }
  | { action: () => CommandActionResult | Promise<CommandActionResult>; href?: never }
);

type CommandGroupOption = {
  value: string;
  label: string;
  items: CommandOption[];
};

function toCustomCommandOption(
  command: CustomCommandAction,
  context: CommandActionContext,
): CommandOption {
  const option = {
    value: [command.label, command.description, ...(command.keywords ?? [])]
      .filter(Boolean)
      .join(" "),
    label: command.label,
    description: command.description,
    icon: createElement(command.icon),
  };

  return command.href !== undefined
    ? { ...option, href: command.href }
    : { ...option, action: () => command.action(context) };
}

function createStaticCommandGroups(context: CommandActionContext): CommandGroupOption[] {
  return [
    {
      value: "quick-actions",
      label: "Schnellaktionen",
      items: customCommandActions.map((command) => toCustomCommandOption(command, context)),
    },
    ...navGroups.map((group, groupIndex) => ({
      value: `navigation-${group.label ?? groupIndex}`,
      label: group.label ?? "Navigation",
      items: group.items
        .flatMap((item) => [item, ...(item.subItems ?? [])])
        .map((item) => ({
          value: `${item.title} ${group.label ?? "Navigation"} öffnen`,
          label: item.title,
          description: group.label ?? "Navigation",
          icon: item.icon,
          href: item.path,
        })),
    })),
  ];
}

export function GlobalCommandMenu() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editingGroup, setEditingGroup] = useState<GroupRow | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [coachingDialogOpen, setCoachingDialogOpen] = useState(false);
  const [memberAction, setMemberAction] = useState<MemberCommandAction | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [assignGroupDialogOpen, setAssignGroupDialogOpen] = useState(false);
  const navigate = useNavigate();
  const remoteSearchEnabled = open && debouncedSearch.trim().length > 4;
  const membersQuery = useQuery({
    ...membersListQueryOptions({
      page: 1,
      limit: 8,
      search: debouncedSearch.trim(),
      statuses: ["active", "cancelled_but_active"],
    }),
    enabled: remoteSearchEnabled,
  });
  const groupsQuery = useQuery({
    ...groupsQueryOptions(),
    enabled: remoteSearchEnabled && memberAction === null,
  });

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
      setMemberAction(null);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const runCommand = async (option: CommandOption) => {
    if (option.href !== undefined) {
      setOpen(false);
      void navigate({ to: option.href });
      return;
    }
    const result = await option.action();
    if (!result?.keepOpen) setOpen(false);
  };

  const memberCommands: CommandOption[] = (membersQuery.data?.data ?? []).map((member) => ({
    value: `${member.firstName} ${member.lastName} ${member.email ?? ""}`,
    label: `${member.firstName} ${member.lastName}`,
    description: member.email || "Mitglied",
    icon: (
      <UserAvatar
        className="size-5"
        name={`${member.firstName} ${member.lastName}`}
        seed={member.id}
      />
    ),
    action: () => {
      if (memberAction === "credit") {
        setSelectedMember(member);
        setCreditDialogOpen(true);
        setMemberAction(null);
        return;
      }
      if (memberAction === "assign-group") {
        setSelectedMember(member);
        setAssignGroupDialogOpen(true);
        setMemberAction(null);
        return;
      }
      return navigate({
        to: "/dashboard/members/$memberId",
        params: { memberId: member.id },
      });
    },
  }));
  const normalizedSearch = debouncedSearch.trim().toLocaleLowerCase("de-DE");
  const groupCommands: CommandOption[] = (groupsQuery.data ?? [])
    .filter(
      (group) =>
        group.name.toLocaleLowerCase("de-DE").includes(normalizedSearch) ||
        (group.description ?? "").toLocaleLowerCase("de-DE").includes(normalizedSearch),
    )
    .slice(0, 8)
    .map((group) => ({
      value: `${group.name} ${group.description ?? ""}`,
      label: group.name,
      description: group.description || "Gruppe bearbeiten",
      icon: <BoxesIcon style={{ color: group.color }} />,
      action: () => {
        setEditingGroup(group);
        setGroupDialogOpen(true);
      },
    }));
  const staticCommandGroups = createStaticCommandGroups({
    openCreateGroup: () => {
      setEditingGroup(null);
      setGroupDialogOpen(true);
    },
    openCreateEvent: () => setEventDialogOpen(true),
    openCreateCoaching: () => setCoachingDialogOpen(true),
    openOrganizationSwitcher: () => setTimeout(openOrgSwitcher, 0),
    startMemberAction: (action) => {
      setMemberAction(action);
      setSearch("");
      setDebouncedSearch("");
      return { keepOpen: true };
    },
  });
  const commandGroups: CommandGroupOption[] = memberAction
    ? memberCommands.length > 0
      ? [{ value: "member-action-results", label: "Mitglied auswählen", items: memberCommands }]
      : []
    : remoteSearchEnabled
      ? [
          ...staticCommandGroups,
          ...(memberCommands.length > 0
            ? [{ value: "member-results", label: "Mitglieder", items: memberCommands }]
            : []),
          ...(groupCommands.length > 0
            ? [{ value: "group-results", label: "Gruppen", items: groupCommands }]
            : []),
        ]
      : staticCommandGroups;
  const remoteSearchPending =
    remoteSearchEnabled &&
    (membersQuery.isFetching || (memberAction === null && groupsQuery.isFetching));
  const remoteSearchError = membersQuery.isError || (memberAction === null && groupsQuery.isError);

  return (
    <>
      <Button
        aria-label="Befehlsmenü öffnen"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        size="icon-sm"
        variant="outline"
      >
        <SearchIcon />
      </Button>
      <Button
        className="hidden lg:inline-flex"
        onClick={() => setOpen(true)}
        size="sm"
        variant="outline"
      >
        <SearchIcon data-icon="inline-start" />
        <span>Suchen</span>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>

      <CommandDialog onOpenChange={setOpen} open={open}>
        <CommandDialogPopup>
          <CommandDialogPrimitive.Title className="sr-only">
            Befehlsmenü
          </CommandDialogPrimitive.Title>
          <Command items={commandGroups} onValueChange={setSearch} value={search}>
            <CommandInput
              loading={remoteSearchPending}
              placeholder={
                memberAction
                  ? "Mitglied suchen (mindestens 5 Zeichen)…"
                  : "Suchen oder Befehl eingeben…"
              }
            />
            <CommandPanel>
              <CommandEmpty>
                {!remoteSearchEnabled && memberAction
                  ? "Gib mindestens 5 Zeichen ein, um Mitglieder zu suchen."
                  : remoteSearchPending
                    ? "Mitglieder und Gruppen werden durchsucht…"
                    : remoteSearchError
                      ? "Die Suche ist gerade nicht verfügbar."
                      : "Keine passenden Befehle, Mitglieder oder Gruppen gefunden."}
              </CommandEmpty>
              <CommandList>
                {(group: CommandGroupOption, index: number) => (
                  <Fragment key={group.value}>
                    <CommandGroup items={group.items}>
                      <CommandGroupLabel>{group.label}</CommandGroupLabel>
                      <CommandCollection>
                        {(option: CommandOption) => (
                          <CommandItem
                            className="gap-3"
                            key={option.value}
                            onClick={() => void runCommand(option)}
                            value={option.value}
                          >
                            <span className="shrink-0 text-muted-foreground [&_svg]:size-4">
                              {option.icon}
                            </span>
                            <span className="min-w-0 flex-1 truncate font-medium">
                              {option.label}
                            </span>
                            {option.description ? (
                              <span className="text-muted-foreground text-xs">
                                {option.description}
                              </span>
                            ) : null}
                          </CommandItem>
                        )}
                      </CommandCollection>
                    </CommandGroup>
                    {index < commandGroups.length - 1 ? <CommandSeparator /> : null}
                  </Fragment>
                )}
              </CommandList>
            </CommandPanel>
            <CommandFooter>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <KbdGroup>
                    <Kbd>
                      <ArrowUpIcon />
                    </Kbd>
                    <Kbd>
                      <ArrowDownIcon />
                    </Kbd>
                  </KbdGroup>
                  Navigieren
                </span>
                <span className="flex items-center gap-2">
                  <Kbd>
                    <CornerDownLeftIcon />
                  </Kbd>
                  Öffnen
                </span>
              </div>
              <span className="flex items-center gap-2">
                <Kbd>Esc</Kbd>
                Schließen
              </span>
            </CommandFooter>
          </Command>
        </CommandDialogPopup>
      </CommandDialog>
      {groupDialogOpen ? (
        <GroupDialog
          group={editingGroup}
          onOpenChange={(nextOpen) => {
            setGroupDialogOpen(nextOpen);
            if (!nextOpen) setEditingGroup(null);
          }}
          open
        />
      ) : null}
      {eventDialogOpen ? <EventDialog onOpenChange={setEventDialogOpen} open /> : null}
      {coachingDialogOpen ? <CoachingDialog onOpenChange={setCoachingDialogOpen} open /> : null}
      {selectedMember && creditDialogOpen ? (
        <CreditGrantDialog
          contractId={selectedMember.contract.id}
          memberId={selectedMember.id}
          memberName={`${selectedMember.firstName} ${selectedMember.lastName}`}
          onOpenChange={setCreditDialogOpen}
          open
        />
      ) : null}
      {selectedMember && assignGroupDialogOpen ? (
        <AssignGroupDialog
          assignedGroupIds={selectedMember.groupMembers.map((membership) => membership.groupId)}
          memberId={selectedMember.id}
          onOpenChange={setAssignGroupDialogOpen}
          open
        />
      ) : null}
    </>
  );
}
