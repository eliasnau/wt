"use client";

import { Button } from "@matdesk/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@matdesk/ui/components/empty";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { ArrowRightIcon, Building2Icon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-context";
import { AuthSplitShell } from "@/components/auth/auth-split-shell";
import { OrganizationAvatar } from "@/components/auth/organization-avatar";
import UserMenu from "@/components/auth/user-menu";
import { getUser } from "@/functions/get-user";

type OrganizationsSearch = {
  redirect?: string;
};

export const Route = createFileRoute("/organizations")({
  beforeLoad: async ({ location }) => {
    const session = await getUser();
    if (!session) {
      throw redirect({ search: { redirectUrl: location.href }, to: "/sign-in" });
    }
    return { session };
  },
  validateSearch: (search: Record<string, unknown>): OrganizationsSearch => ({
    redirect:
      typeof search.redirect === "string" &&
      (search.redirect === "/dashboard" || search.redirect.startsWith("/dashboard/"))
        ? search.redirect
        : undefined,
  }),
  component: OrganizationsPage,
});

function OrganizationsPage() {
  const search = Route.useSearch();
  const { organizations, organizationsError, isOrganizationsPending, setActiveOrganization, user } =
    useAuth();
  const [activatingId, setActivatingId] = useState<string | null>(null);

  async function selectOrganization(organizationId: string) {
    setActivatingId(organizationId);
    try {
      await setActiveOrganization(organizationId);
      window.location.assign(search.redirect ?? "/dashboard");
    } catch (error) {
      setActivatingId(null);
      toast.error(error instanceof Error ? error.message : "Could not activate organization");
    }
  }

  return (
    <AuthSplitShell rightAction={<UserMenu />}>
      <div>
        <h1 className="font-bold text-2xl tracking-wide">Organisation auswählen</h1>
      </div>

      <section aria-label="Organisationen" className="pt-2">
        <div className="flex flex-col gap-2">
          {isOrganizationsPending ? (
            <OrganizationListSkeleton />
          ) : organizationsError ? (
            <Empty className="rounded-xl border bg-muted/20 py-10 md:py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2Icon />
                </EmptyMedia>
                <EmptyTitle>Organisationen nicht verfügbar</EmptyTitle>
                <EmptyDescription>
                  Die Organisationen konnten nicht geladen werden. Lade die Seite erneut.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : organizations.length === 0 ? (
            <Empty className="rounded-xl border bg-muted/20 py-10 md:py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2Icon />
                </EmptyMedia>
                <EmptyTitle>Noch keine Organisation</EmptyTitle>
                <EmptyDescription>
                  Bitte einen Administrator, dich zu einer Organisation hinzuzufügen.
                </EmptyDescription>
              </EmptyHeader>
              {user?.role === "admin" ? (
                <EmptyContent>
                  <Button render={<Link to="/admin/organizations" />}>
                    <PlusIcon data-icon="inline-start" />
                    Organisation erstellen
                  </Button>
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            organizations.map((organization) => (
              <Button
                className="group grid h-auto w-full grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl p-3 text-left sm:h-auto"
                disabled={activatingId !== null}
                key={organization.id}
                onClick={() => selectOrganization(organization.id)}
                variant="outline"
              >
                <OrganizationAvatar
                  className="size-10"
                  id={organization.id}
                  logo={organization.logo}
                  name={organization.name}
                />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{organization.name}</span>
                  <span className="block truncate font-normal text-muted-foreground text-xs">
                    {organization.slug}
                  </span>
                </span>
                {activatingId === organization.id ? (
                  <span className="text-muted-foreground text-xs">Wird geöffnet …</span>
                ) : (
                  <ArrowRightIcon className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
                )}
              </Button>
            ))
          )}
        </div>
      </section>
    </AuthSplitShell>
  );
}

function OrganizationListSkeleton() {
  return Array.from({ length: 2 }, (_, index) => (
    <div className="flex items-center gap-3 rounded-xl border p-3" key={index}>
      <Skeleton className="size-10 rounded-md" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  ));
}
