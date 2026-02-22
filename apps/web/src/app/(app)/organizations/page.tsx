"use client";

import { ORPCError } from "@orpc/client";
import { authClient } from "@repo/auth/client";
import { Building2, ChevronRight, Loader2, Plus } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { FloatingPaths } from "@/components/floating-paths";
import { Logo } from "@/components/logo";
import { OrganizationAvatar } from "@/components/organization-avatar";
import { UserAccountMenu } from "@/components/user-account-menu";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [returnUrl] = useQueryState("returnUrl", {
    defaultValue: "/dashboard",
  });

  const handleCreateOrganization = async () => {
    if (!orgName.trim() || !orgSlug.trim()) {
      toast.error("Bitte fülle alle Felder aus");
      return;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(orgSlug)) {
      toast.error(
        "Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten",
      );
      return;
    }

    setIsCreating(true);

    try {
      const { error } = await authClient.organization.create({
        name: orgName.trim(),
        slug: orgSlug.trim(),
      });

      if (error) {
        toast.error(
          error.message || "Organisation konnte nicht erstellt werden",
        );
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
      router.push((returnUrl || "/dashboard") as Route);
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

  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      <div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
        <Logo className="mr-auto h-4.5" monochrome />

        <div className="z-10 mt-auto">
          <div className="font-mono font-semibold text-sm">
            Wussten sie schon?
          </div>
          <p className="text-sm">You can...</p>
        </div>

        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      <div className="relative flex min-h-screen flex-col justify-center px-8 py-10 lg:py-0">
        <div
          aria-hidden
          className="absolute inset-0 isolate -z-10 opacity-60 contain-strict"
        >
          <div className="absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
          <div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
        </div>

        <UserAccountMenu
          className="absolute top-7 right-5"
          user={session?.user}
        />

        <div className="mx-auto w-full max-w-2xl space-y-4">
          {isPending ? (
            <>
              <Skeleton className="h-4.5 w-24 lg:hidden" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-80" />
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border bg-background/40 p-2">
                  <div className="space-y-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={`org-skeleton-${i}`}
                        className="flex items-center gap-3 rounded-lg p-3"
                      >
                        <Skeleton className="size-10 rounded-md" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="size-4 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Skeleton className="h-9 w-48" />
                </div>
              </div>
            </>
          ) : (
            <>
              <Logo className="h-4.5 lg:hidden" monochrome />
              <div className="flex flex-col space-y-1">
                <h1 className="font-bold text-2xl tracking-wide">
                  Organisation auswählen
                </h1>
                <p className="text-base text-muted-foreground">
                  Wähle eine Organisation, um fortzufahren
                </p>
              </div>

              {organizations && organizations.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
                    <Building2 className="size-6 text-primary" />
                  </div>
                  <p className="font-medium">Noch keine Organisationen</p>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Lege los, indem du deine erste Organisation erstellst.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="size-4" />
                    <span className="ml-2">Organisation erstellen</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border bg-background/40 p-2">
                    {organizations?.map((org) => {
                      const isActive =
                        session?.session?.activeOrganizationId === org.id;

                      return (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => handleSetActiveOrg(org.id)}
                          disabled={isSwitching}
                          className={`group flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            isActive
                              ? "bg-primary/[0.08]"
                              : "hover:bg-accent/50"
                          }`}
                        >
                          <OrganizationAvatar
                            name={org.name}
                            logo={org.logo}
                            id={org.id}
                            className="size-10"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{org.name}</p>
                            <p className="truncate text-muted-foreground text-sm">
                              {org.slug}
                            </p>
                          </div>
                          {isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Active
                            </Badge>
                          )}
                          <ChevronRight className="size-4.5 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {organizations && organizations.length > 0 && (
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="size-4" />
                    <span className="ml-2">Organisation erstellen</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
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
    </main>
  );
}
