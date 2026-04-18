"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  CornerDownLeftIcon,
  LoaderCircleIcon,
  SearchIcon,
  UserIcon,
} from "lucide-react";

import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandDialogTrigger,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useDebounce } from "@/hooks/use-debounce";
import { useOs } from "@/hooks/use-os";
import { orpc } from "@/utils/orpc";

import {
  commandGroups,
  type CommandGroupType,
  type CommandItemType,
  type IndexedCommandItem,
} from "./command-groups";

const iconClassName = "mr-2 h-4 w-4 shrink-0 opacity-80";
type MemberSearchItem = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  memberId: string;
  memberGroups: string[];
  isMemberResult: true;
};

type SearchCommandListItem = IndexedCommandItem | MemberSearchItem;
type SearchCommandListGroup = {
  value: string;
  items: SearchCommandListItem[];
};

function flattenGroups(groups: CommandGroupType[]): IndexedCommandItem[] {
  const flattened: IndexedCommandItem[] = [];

  function walk(item: CommandItemType, group: string, parents: string[] = []) {
    flattened.push({
      ...item,
      group,
      breadcrumb:
        parents.length > 0
          ? `${parents.join(" › ")} › ${item.label}`
          : undefined,
      isIndexedChild: parents.length > 0,
    });

    if (item.children) {
      for (const child of item.children) {
        walk(child, group, [...parents, item.label]);
      }
    }
  }

  for (const group of groups) {
    for (const item of group.items) {
      walk(item, group.value);
    }
  }

  return flattened;
}

function BreadcrumbLabel({
  label,
  breadcrumb,
}: {
  label: string;
  breadcrumb?: string;
}) {
  if (!breadcrumb) {
    return <span className="flex-1 truncate">{label}</span>;
  }

  const parts = breadcrumb.split(" › ");
  const last = parts.at(-1);
  const parent = parts.slice(0, -1).join(" › ");

  return (
    <span className="flex min-w-0 flex-1 items-center gap-1">
      <span className="truncate text-muted-foreground">{parent}</span>
      <span className="text-muted-foreground">›</span>
      <span className="truncate">{last}</span>
    </span>
  );
}

export function SearchCommand() {
  const router = useRouter();
  const { isMac } = useOs();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [memberSearchQuery, setMemberSearchQuery] = React.useState("");
  const [pageStack, setPageStack] = React.useState<
    { items: CommandItemType[]; title: string }[]
  >([]);

  const indexedItems = React.useMemo(() => flattenGroups(commandGroups), []);
  const isSubpage = pageStack.length > 0;
  const showDeepSearch = query.trim().length >= 2;
  const normalizedQuery = query.trim();
  const shouldSearchMembers = !isSubpage && normalizedQuery.length >= 4;
  const debouncedSetMemberSearchQuery = useDebounce(
    (nextQuery: string) => setMemberSearchQuery(nextQuery),
    300,
  );

  React.useEffect(() => {
    if (!open || !shouldSearchMembers) {
      setMemberSearchQuery("");
      debouncedSetMemberSearchQuery.cancel?.();
      return;
    }

    debouncedSetMemberSearchQuery(normalizedQuery);

    return () => {
      debouncedSetMemberSearchQuery.cancel?.();
    };
  }, [
    debouncedSetMemberSearchQuery,
    normalizedQuery,
    open,
    shouldSearchMembers,
  ]);

  const { data: memberSearchData, isFetching: isMemberSearchFetching } = useQuery(
    {
      ...orpc.members.search.queryOptions({
        input: {
          query: memberSearchQuery,
          limit: 8,
        },
      }),
      enabled: open && shouldSearchMembers && memberSearchQuery.length >= 4,
      placeholderData: (previousData) => previousData,
    },
  );
  const memberResults = memberSearchData?.data ?? [];
  const isMemberSearchPending =
    shouldSearchMembers &&
    (memberSearchQuery.length === 0 || isMemberSearchFetching);
  const memberSearchCharsRemaining = !isSubpage
    ? Math.max(0, 4 - normalizedQuery.length)
    : 0;
  const emptyMessage =
    isMemberSearchPending
      ? "Mitglieder werden gesucht..."
      : memberSearchCharsRemaining > 0 && normalizedQuery.length > 0
      ? `Gib noch ${memberSearchCharsRemaining} Zeichen${
          memberSearchCharsRemaining === 1 ? "" : "s"
        } ein, um Mitglieder zu suchen.`
      : "Keine Ergebnisse gefunden.";

  const visibleGroups = React.useMemo<SearchCommandListGroup[]>(() => {
    if (isSubpage) {
      return [
        {
          value: pageStack[pageStack.length - 1]!.title,
          items: pageStack[pageStack.length - 1]!
            .items as unknown as SearchCommandListItem[],
        },
      ];
    }

    if (!showDeepSearch) {
      return commandGroups as SearchCommandListGroup[];
    }

    const groups = commandGroups
      .map((group) => {
        const topLevelItems = indexedItems.filter(
          (item) => item.group === group.value && !item.isIndexedChild,
        );
        const indexedChildren = indexedItems.filter(
          (item) => item.group === group.value && item.isIndexedChild,
        );

        return {
          value: group.value,
          items: [...topLevelItems, ...indexedChildren],
        };
      })
      .filter((group) => group.items.length > 0);

    if (shouldSearchMembers && memberResults.length > 0) {
      groups.push({
        value: "Mitglieder",
        items: memberResults.map((member) => ({
          value: `member-${member.id}`,
          label: member.name,
          group: "Mitglieder",
          memberId: member.id,
          memberGroups: member.groups,
          isMemberResult: true,
        })),
      });
    }

    return groups;
  }, [
    indexedItems,
    isSubpage,
    isMemberSearchPending,
    memberResults,
    pageStack,
    shouldSearchMembers,
    showDeepSearch,
  ]);

  const goBack = React.useCallback(() => {
    setPageStack((prev) => prev.slice(0, -1));
    setQuery("");
  }, []);

  const handleItemClick = React.useCallback(
    (item: IndexedCommandItem | CommandItemType) => {
      if (
        "children" in item &&
        item.children &&
        !("isIndexedChild" in item && item.isIndexedChild)
      ) {
        setPageStack((prev) => [
          ...prev,
          { items: item.children!, title: item.label },
        ]);
        setQuery("");
        return;
      }

      if (item.path) {
        router.push(item.path as Route);
        setOpen(false);
      }
    },
    [router],
  );

  const handleMemberClick = React.useCallback(
    (memberId: string) => {
      router.push(`/dashboard/members/${memberId}` as Route);
      setOpen(false);
    },
    [router],
  );

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setPageStack([]);
    }
  }, [open]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandDialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="min-w-0 justify-between px-2 md:min-w-48 md:px-3"
          />
        }
      >
        <span className="flex items-center gap-1 text-muted-foreground">
          <SearchIcon className="h-4 w-4 shrink-0 opacity-80" />
          <span>Suche</span>
        </span>

        <KbdGroup className="hidden md:flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </CommandDialogTrigger>

      <CommandDialogPopup className="overflow-hidden p-0">
        <Command
          key={`${pageStack.length}-${showDeepSearch ? "deep" : "shallow"}`}
          items={visibleGroups}
          value={query}
          onValueChange={setQuery}
        >
          <CommandInput
            placeholder={
              isSubpage
                ? `${pageStack[pageStack.length - 1]?.title ?? ""} suchen...`
                : "Suchen..."
            }
            startAddon={
              isSubpage ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex cursor-pointer items-center"
                  aria-label="Zurück"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </button>
              ) : isMemberSearchPending ? (
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
              ) : (
                <SearchIcon className="h-4 w-4" />
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Backspace" && query === "" && isSubpage) {
                e.preventDefault();
                goBack();
              }
            }}
          />

          <CommandPanel>
            <CommandEmpty>{emptyMessage}</CommandEmpty>

            <CommandList>
              {(group: SearchCommandListGroup, index: number) => (
                <React.Fragment key={group.value}>
                  <CommandGroup items={group.items}>
                    <CommandGroupLabel>{group.value}</CommandGroupLabel>

                    <CommandCollection>
                      {(item: SearchCommandListItem) => {
                        if ("isMemberResult" in item && item.isMemberResult) {
                          return (
                            <CommandItem
                              key={item.value}
                              value={`${item.label} ${item.memberGroups.join(" ")}`}
                              onClick={() => handleMemberClick(item.memberId)}
                            >
                              <UserIcon className="mr-2 h-5 w-5 shrink-0 opacity-80" />
                              <span className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate">{item.label}</span>
                                <span className="truncate text-muted-foreground text-xs">
                                  {item.memberGroups.length > 0
                                    ? item.memberGroups.join(", ")
                                    : "Keine Gruppe"}
                                </span>
                              </span>
                            </CommandItem>
                          );
                        }

                        const indexedItem = item as IndexedCommandItem;

                        return (
                          <CommandItem
                            key={indexedItem.value}
                            value={indexedItem.value}
                            onClick={() => handleItemClick(indexedItem)}
                          >
                            {indexedItem.icon}
                            <BreadcrumbLabel
                              label={indexedItem.label}
                              breadcrumb={
                                !isSubpage && indexedItem.isIndexedChild
                                  ? indexedItem.breadcrumb
                                  : undefined
                              }
                            />
                            {!isSubpage &&
                            indexedItem.children &&
                            !indexedItem.isIndexedChild ? (
                              <CommandShortcut>
                                <ChevronRightIcon className="h-4 w-4" />
                              </CommandShortcut>
                            ) : null}
                          </CommandItem>
                        );
                      }}
                    </CommandCollection>
                  </CommandGroup>

                  {index < visibleGroups.length - 1 ? (
                    <CommandSeparator />
                  ) : null}
                </React.Fragment>
              )}
            </CommandList>
          </CommandPanel>

          <CommandFooter>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <KbdGroup>
                  <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
                  <Kbd>K</Kbd>
                </KbdGroup>
                <span>Navigieren</span>
              </div>

              <div className="flex items-center gap-2">
                <Kbd>
                  <CornerDownLeftIcon />
                </Kbd>
                <span>Öffnen</span>
              </div>

              {isSubpage ? (
                <div className="flex items-center gap-2">
                  <Kbd>⌫</Kbd>
                  <span>Zurück</span>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Kbd>Esc</Kbd>
              <span>Schließen</span>
            </div>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  );
}
