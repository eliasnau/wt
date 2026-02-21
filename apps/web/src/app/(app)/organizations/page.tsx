"use client";

import { ORPCError } from "@orpc/client";
import { authClient } from "@repo/auth/client";
import { Building2, ChevronRight, Loader2, Plus, Settings } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

export default function OrganizationsPage() {
  const {
    data: organizations,
    isPending,
    refetch,
  } = authClient.useListOrganizations();
  const { session, switchOrganization } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const router = useRouter();
  const [redirectUrl] = useQueryState("redirectUrl", {
    defaultValue: "/dashboard",
  });

  const handleCreateOrganization = async () => {
    if (!orgName.trim() || !orgSlug.trim()) {
      toast.error("Bitte fülle alle Felder aus");
      return;
    }

    // Validate slug format (lowercase, alphanumeric, hyphens)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(orgSlug)) {
      toast.error(
        "Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten",
      );
      return;
    }

    setIsCreating(true);

    try {
      const { data, error } = await authClient.organization.create({
        name: orgName.trim(),
        slug: orgSlug.trim(),
      });

      if (error) {
        let errorMessage = "Organisation konnte nicht erstellt werden";
        if (error.message) {
          errorMessage = error.message;
        }
        toast.error(errorMessage);
        setIsCreating(false);
        return;
      }

      toast.success("Organisation erfolgreich erstellt");
      setIsCreateDialogOpen(false);
      setOrgName("");
      setOrgSlug("");
      refetch();
      setIsCreating(false);
    } catch (error) {
      toast.error("Organisation konnte nicht erstellt werden");
      console.error(error);
      setIsCreating(false);
    }
  };

  const handleSetActiveOrg = async (organizationId: string) => {
    setIsSwitching(true);
    try {
      await switchOrganization(organizationId, "organizations_page");
      let targetUrl = "/dashboard";
      if (redirectUrl) {
        targetUrl = redirectUrl;
      }
      router.push(targetUrl as Route);
      setIsSwitching(false);
    } catch (error) {
      let errorMessage = "Aktive Organisation konnte nicht gesetzt werden";
      if (error instanceof ORPCError) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      setIsSwitching(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setOrgName(value);
    if (!orgSlug || orgSlug === orgName.toLowerCase().replace(/\s+/g, "-")) {
      setOrgSlug(
        value
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
      );
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar p-4">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar p-4">
      <div className="w-full max-w-2xl">
        <Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
          <FramePanel>
            <div className="mb-6">
              <h1 className="font-heading text-2xl">Organisation auswählen</h1>
              <p className="text-muted-foreground text-sm">
                Wähle eine Organisation, um fortzufahren
              </p>
            </div>

            {organizations && organizations.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Building2 />
                  </EmptyMedia>
                  <EmptyTitle>Noch keine Organisationen</EmptyTitle>
                  <EmptyDescription>
                    Lege los, indem du deine erste Organisation erstellst
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="size-4" />
                    <span className="ml-2">Organisation erstellen</span>
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="space-y-2">
                {organizations?.map((org) => {
                  const isActive =
                    session?.session?.activeOrganizationId === org.id;

                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => handleSetActiveOrg(org.id)}
                      disabled={isSwitching}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {org.logo ? (
                        <img
                          src={org.logo}
                          alt={org.name}
                          className="size-10 flex-shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
                          <Building2 className="size-5 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate font-medium">{org.name}</p>
                        <p className="truncate text-muted-foreground text-sm">
                          {org.slug}
                        </p>
                      </div>
                      {isActive && (
                        <Badge
                          variant="secondary"
                          className="flex-shrink-0 text-xs"
                        >
                          Active
                        </Badge>
                      )}
                      <ChevronRight className="size-5 flex-shrink-0 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            )}
          </FramePanel>

          {organizations && organizations.length > 0 && (
            <FrameFooter className="flex-row justify-between">
              <Button variant="ghost" onClick={() => router.push("/account")}>
                <Settings className="size-4" />
                <span className="ml-2">Konto verwalten</span>
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="size-4" />
                <span className="ml-2">Organisation erstellen</span>
              </Button>
            </FrameFooter>
          )}
        </Frame>
      </div>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Organisation erstellen</DialogTitle>
          </DialogHeader>
          <DialogPanel className="space-y-4">
            <Field>
              <FieldLabel>Organisationsname</FieldLabel>
              <Input
                value={orgName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Acme Inc."
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel>Organisations-Slug</FieldLabel>
              <Input
                value={orgSlug}
                onChange={(e) =>
                  setOrgSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, ""),
                  )
                }
                placeholder="acme-inc"
              />
              <p className="mt-2 text-muted-foreground text-xs">
                Used in URLs. Only lowercase letters, numbers, and hyphens
                allowed.
              </p>
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose
              render={<Button variant="ghost" />}
              disabled={isCreating}
            >
              Cancel
            </DialogClose>
            <Button
              onClick={handleCreateOrganization}
              disabled={isCreating || !orgName.trim() || !orgSlug.trim()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Organisation erstellen"
              )}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
