"use client";

import {
  Command,
  CommandCollection,
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
import { Popover, PopoverContent, PopoverTrigger } from "@matdesk/ui/components/popover";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@matdesk/ui/components/sidebar";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { parseError } from "evlog";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  CornerDownLeftIcon,
  Loader2Icon,
  PlusIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { NoOrganization } from "@/components/auth/no-organization";
import { OrganizationAvatar } from "@/components/auth/organization-avatar";

const CREATE_ITEM_VALUE = "create-new";

type OrgItem = {
  value: string;
  label: string;
  slug?: string | null;
  logo?: string | null;
  isActive: boolean;
};

type OrgGroup = {
  value: string;
  label: string;
  items: OrgItem[];
};

/**
 * Imperative opener so other UI (command palettes, shortcuts elsewhere) can pop
 * the switcher. wt keeps a single module-level `setGlobalOpen` ref, which breaks
 * as soon as a second instance mounts (last one wins) or unmounts (opener goes
 * dead). A subscriber set stays correct for any number of mounted switchers.
 */
const openSubscribers = new Set<(open: boolean) => void>();

export function openOrgSwitcher(): void {
  for (const setOpen of openSubscribers) {
    setOpen(true);
  }
}

export function OrgSwitcher() {
  const { organizations, activeOrganization, isOrganizationsPending, setActiveOrganization } =
    useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  // Display falls back to the first organization when none is active yet, so the
  // trigger is never empty. Switching still compares against the *real* active
  // organization below, otherwise the fallback row would short-circuit itself.
  const activeOrg = activeOrganization ?? organizations[0] ?? null;

  React.useEffect(() => {
    openSubscribers.add(setOpen);
    return () => {
      openSubscribers.delete(setOpen);
    };
  }, []);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "o" && event.shiftKey && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const switchOrganization = useMutation({
    mutationFn: (organizationId: string) => setActiveOrganization(organizationId),
    onSuccess: () => setOpen(false),
    onError: (error) => toast.error(parseError(error).message),
  });

  const orgItems: OrgItem[] = organizations.map((org) => ({
    value: org.id,
    label: org.name,
    slug: org.slug,
    logo: org.logo,
    isActive: org.id === activeOrg?.id,
  }));

  const groupedItems: OrgGroup[] = [
    { value: "organizations", label: "Organisationen", items: orgItems },
    {
      value: "actions",
      label: "Aktionen",
      items: [
        {
          value: CREATE_ITEM_VALUE,
          label: "Organisation erstellen",
          isActive: false,
        },
      ],
    },
  ];

  function handleCreate() {
    setOpen(false);
    // `/organizations` owns the organization overview and the create entry point.
    void navigate({ to: "/organizations" });
  }

  function handleItemClick(item: OrgItem) {
    if (item.value === CREATE_ITEM_VALUE) {
      handleCreate();
      return;
    }
    if (activeOrganization?.id === item.value) {
      setOpen(false);
      return;
    }
    switchOrganization.mutate(item.value);
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <SidebarMenu className="w-full">
        <SidebarMenuItem>
          <PopoverTrigger
            render={
              <SidebarMenuButton className="group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:px-0!" />
            }
          >
            <OrganizationAvatar
              className="size-5 shrink-0 rounded-md"
              id={activeOrg?.id ?? "none"}
              logo={activeOrg?.logo}
              name={activeOrg?.name ?? "Organisation"}
            />
            <span className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">
              {activeOrg?.name ?? "Organisation wählen"}
            </span>
            <ChevronsUpDownIcon className="ml-auto text-muted-foreground/60 group-data-[collapsible=icon]:hidden" />
          </PopoverTrigger>
        </SidebarMenuItem>
      </SidebarMenu>
      <PopoverContent
        align="start"
        className="w-80 p-0 before:bg-muted/72 [&>[data-slot=popover-viewport]]:p-0"
        side="bottom"
        sideOffset={8}
      >
        <Command items={groupedItems}>
          <div className="relative">
            <CommandInput placeholder="Organisationen durchsuchen..." size="sm" />
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>⇧</Kbd>
                <Kbd>O</Kbd>
              </KbdGroup>
            </div>
          </div>
          <CommandPanel>
            {isOrganizationsPending ? (
              <div className="flex items-center justify-center py-4">
                <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : organizations.length === 0 ? (
              <NoOrganization onCreate={handleCreate} />
            ) : (
              <>
                <CommandEmpty>Keine Organisationen gefunden.</CommandEmpty>
                <CommandList>
                  {(group: OrgGroup, _index: number) => (
                    <React.Fragment key={group.value}>
                      <CommandGroup items={group.items}>
                        <CommandGroupLabel>{group.label}</CommandGroupLabel>
                        <CommandCollection>
                          {(item: OrgItem) => {
                            const isSwitching =
                              switchOrganization.isPending &&
                              switchOrganization.variables === item.value;

                            return (
                              <CommandItem
                                className="flex items-center gap-3"
                                disabled={switchOrganization.isPending}
                                key={item.value}
                                onClick={() => handleItemClick(item)}
                                value={item.value}
                              >
                                {item.value === CREATE_ITEM_VALUE ? (
                                  <>
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                      <PlusIcon className="size-4 text-primary" />
                                    </div>
                                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                                  </>
                                ) : (
                                  <>
                                    <OrganizationAvatar
                                      className="size-8 shrink-0"
                                      id={item.value}
                                      logo={item.logo}
                                      name={item.label}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate font-medium">{item.label}</p>
                                      {item.slug ? (
                                        <p className="truncate text-muted-foreground text-xs">
                                          {item.slug}
                                        </p>
                                      ) : null}
                                    </div>
                                    {isSwitching ? (
                                      <Loader2Icon className="size-4 shrink-0 animate-spin" />
                                    ) : item.isActive ? (
                                      <CheckIcon className="size-4 shrink-0 text-primary" />
                                    ) : null}
                                  </>
                                )}
                              </CommandItem>
                            );
                          }}
                        </CommandCollection>
                      </CommandGroup>
                      <CommandSeparator />
                    </React.Fragment>
                  )}
                </CommandList>
              </>
            )}
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
                <span>Navigieren</span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>
                  <CornerDownLeftIcon />
                </Kbd>
                <span>Auswählen</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Kbd>Esc</Kbd>
              <span>Schließen</span>
            </div>
          </CommandFooter>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
