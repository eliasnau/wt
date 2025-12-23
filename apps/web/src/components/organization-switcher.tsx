"use client";

import { authClient } from "@repo/auth/client";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Building2,
  Check,
  CornerDownLeftIcon,
  Loader2,
  Plus,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
} from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { ORPCError } from "@orpc/client";

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

let setGlobalOpen: ((open: boolean) => void) | null = null;
let globalOpenState = false;

export function openOrganizationSwitcher() {
  if (setGlobalOpen) {
    globalOpenState = true;
    setGlobalOpen(true);
  }
}

// export function closeOrganizationSwitcher() {
//   if (setGlobalOpen) {
//     globalOpenState = false;
//     setGlobalOpen(false);
//   }
// }

// export function toggleOrganizationSwitcher() {
//   if (setGlobalOpen) {
//     globalOpenState = !globalOpenState;
//     setGlobalOpen(globalOpenState);
//   }
// }

export function OrganizationSwitcher() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const { session, switchOrganization } = useAuth();

  React.useEffect(() => {
    setGlobalOpen = setOpen;
    globalOpenState = open;
    return () => {
      setGlobalOpen = null;
    };
  }, [open]);

  const { data: organizationsData, isPending } =
    authClient.useListOrganizations();
  const organizations = organizationsData as Organization[] | undefined;

  const setActiveOrgMutation = useMutation({
    mutationFn: switchOrganization,
    onSuccess: () => {
      setOpen(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof ORPCError
          ? error.message
          : "Failed to switch organization",
      );
    },
  });

  const handleSwitchOrg = (organizationId: string) => {
    if (session?.session?.activeOrganizationId === organizationId) {
      setOpen(false);
      return;
    }
    setActiveOrgMutation.mutate(organizationId);
  };

  const handleCreateNew = () => {
    setOpen(false);
    router.push("/account/organizations");
  };

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "o" && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prevOpen) => !prevOpen);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const orgItems =
    organizations?.map((org) => ({
      value: org.id,
      label: org.name,
      slug: org.slug,
      logo: org.logo,
      isActive: session?.session?.activeOrganizationId === org.id,
    })) || [];

  const createNewItem = {
    value: "create-new",
    label: "Create New Organization",
  };

  const groupedItems = [
    {
      value: "Organizations",
      items: orgItems,
    },
    {
      value: "Actions",
      items: [createNewItem],
    },
  ];

  function handleItemClick(item: { value: string }) {
    if (item.value === "create-new") {
      handleCreateNew();
    } else {
      handleSwitchOrg(item.value);
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandDialogPopup>
        <Command items={groupedItems}>
          <CommandInput placeholder="Search organizations..." />
          <CommandPanel>
            {isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>No organizations found.</CommandEmpty>
                <CommandList>
                  {(
                    group: { value: string; items: typeof orgItems },
                    _index: number,
                  ) => (
                    <React.Fragment key={group.value}>
                      <CommandGroup items={group.items}>
                        <CommandGroupLabel>{group.value}</CommandGroupLabel>
                        <CommandCollection>
                          {(item: (typeof orgItems)[0]) => {
                            const isSwitching =
                              setActiveOrgMutation.isPending &&
                              setActiveOrgMutation.variables === item.value;

                            return (
                              <CommandItem
                                key={item.value}
                                onClick={() => handleItemClick(item)}
                                value={item.value}
                                disabled={setActiveOrgMutation.isPending}
                                className="flex items-center gap-3"
                              >
                                {item.value === "create-new" ? (
                                  <>
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                      <Plus className="size-4 text-primary" />
                                    </div>
                                    <span className="flex-1">{item.label}</span>
                                  </>
                                ) : (
                                  <>
                                    {item.logo ? (
                                      <Image
                                        src={item.logo}
                                        alt={item.label}
                                        width={32}
                                        height={32}
                                        className="size-8 shrink-0 rounded-md object-cover"
                                      />
                                    ) : (
                                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                        <Building2 className="size-4 text-primary" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate font-medium">
                                        {item.label}
                                      </p>
                                      {item.slug && (
                                        <p className="truncate text-muted-foreground text-xs">
                                          {item.slug}
                                        </p>
                                      )}
                                    </div>
                                    {isSwitching ? (
                                      <Loader2 className="size-4 shrink-0 animate-spin" />
                                    ) : item.isActive ? (
                                      <Check className="size-4 shrink-0 text-primary" />
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
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>
                  <CornerDownLeftIcon />
                </Kbd>
                <span>Select</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>⇧</Kbd>
                <Kbd>O</Kbd>
              </KbdGroup>
              <span>Close</span>
            </div>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  );
}
