"use client";

import { ArrowDownIcon, ArrowUpIcon, CornerDownLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { openOrganizationSwitcher } from "@/components/organization-switcher";
import { Button } from "@/components/ui/button";
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
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import type { Route } from "next";

export interface Item {
  value: string;
  label: string;
  shortcut?: string;
  href?: string;
  action?: () => void;
}

export interface Group {
  value: string;
  items: Item[];
}

export const pages: Item[] = [
  {
    value: "home",
    label: "Home",
    href: "/dashboard",
  },
  {
    value: "members",
    label: "Members",
    shortcut: "⇧M",
    href: "/dashboard/members",
  },
  {
    value: "groups",
    label: "Groups",
    shortcut: "⇧G",
    href: "/dashboard/groups",
  },
  {
    value: "statistics",
    label: "Statistics",
    href: "/dashboard/statistics/overview",
  },
  {
    value: "events",
    label: "Events",
    href: "/dashboard/events",
  },
];

export const settings: Item[] = [
  {
    value: "settings-general",
    label: "General",
    href: "/dashboard/settings/general",
  },
  {
    value: "settings-members",
    label: "Users",
    href: "/dashboard/settings/members",
  },
  {
    value: "settings-sepa",
    label: "SEPA",
    href: "/dashboard/settings/sepa",
  },
];

export function CommandSearch() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const commands: Item[] = [
    {
      value: "switch-org",
      label: "Switch Organization",
      shortcut: "⌘⇧O",
      action: () => openOrganizationSwitcher(),
    },
  ];

  const groupedItems: Group[] = [
    { items: pages, value: "Pages" },
    { items: commands, value: "Commands" },
    { items: settings, value: "Settings" },
  ];

  function handleItemClick(item: Item) {
    setOpen(false);

    // Handle href navigation
    if (item.href) {
      router.push(item.href as Route);
      return;
    }

    // Handle action execution
    if (item.action) {
      item.action();
      return;
    }
  }

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
        console.log("down");
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <CommandDialog onOpenChange={setOpen} open={open}>
        <CommandDialogTrigger render={<Button variant="outline" />}>
          Open Command Palette
          <Kbd>⌘K</Kbd>
        </CommandDialogTrigger>
        <CommandDialogPopup>
          <Command items={groupedItems}>
            <CommandInput placeholder="Search for pages and commands..." />
            <CommandPanel>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandList>
                {(group: Group, _index: number) => (
                  <React.Fragment key={group.value}>
                    <CommandGroup items={group.items}>
                      <CommandGroupLabel>{group.value}</CommandGroupLabel>
                      <CommandCollection>
                        {(item: Item) => (
                          <CommandItem
                            key={item.value}
                            onClick={() => handleItemClick(item)}
                            value={item.value}
                          >
                            <span className="flex-1">{item.label}</span>
                            {item.shortcut && (
                              <CommandShortcut>{item.shortcut}</CommandShortcut>
                            )}
                          </CommandItem>
                        )}
                      </CommandCollection>
                    </CommandGroup>
                    <CommandSeparator />
                  </React.Fragment>
                )}
              </CommandList>
            </CommandPanel>
            <CommandFooter>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <KbdGroup>
                    <Kbd>
                      <ArrowUpIcon />
                    </Kbd>
                    <Kbd>
                      <ArrowDownIcon />
                    </Kbd>
                  </KbdGroup>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-2">
                  <Kbd>
                    <CornerDownLeftIcon />
                  </Kbd>
                  <span>Open</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <KbdGroup>
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </KbdGroup>
                <span>Close</span>
              </div>
            </CommandFooter>
          </Command>
        </CommandDialogPopup>
      </CommandDialog>
    </>
  );
}
