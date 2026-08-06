"use client";

import { Button } from "@matdesk/ui/components/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@matdesk/ui/components/card";
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

import { useAuth } from "@/components/auth/auth-provider";
import { OrganizationAvatar } from "@/components/auth/organization-avatar";
import UserMenu from "@/components/auth/user-menu";
import { Logo } from "@/components/logo";
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
    <div className="relative min-h-svh overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,var(--color-muted),transparent_70%)] opacity-70"
      />
      <header className="relative flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-8">
        <Link aria-label="matdesk home" to="/">
          <Logo className="h-5 w-auto" />
        </Link>
        <UserMenu />
      </header>

      <main className="relative mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 md:px-6 md:py-20">
        <div className="flex flex-col gap-2">
          <p className="font-medium text-muted-foreground text-sm">Workspace</p>
          <h1 className="font-heading font-semibold text-3xl tracking-tight md:text-4xl">
            Choose an organization
          </h1>
          <p className="max-w-lg text-muted-foreground">
            Select the organization you want to work in. You can switch again later from the
            dashboard.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your organizations</CardTitle>
            <CardDescription>
              {isOrganizationsPending
                ? "Loading organizations..."
                : `${organizations.length} available`}
            </CardDescription>
            {user?.role === "admin" ? (
              <CardAction>
                <Button render={<Link to="/admin/organizations" />} size="sm" variant="outline">
                  <PlusIcon data-icon="inline-start" />
                  Create
                </Button>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardPanel className="flex flex-col gap-3">
            {isOrganizationsPending ? (
              <OrganizationListSkeleton />
            ) : organizationsError ? (
              <Empty className="py-10 md:py-10">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Building2Icon />
                  </EmptyMedia>
                  <EmptyTitle>Organizations unavailable</EmptyTitle>
                  <EmptyDescription>
                    We could not load your organizations. Refresh the page to try again.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : organizations.length === 0 ? (
              <Empty className="py-10 md:py-10">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Building2Icon />
                  </EmptyMedia>
                  <EmptyTitle>No organizations yet</EmptyTitle>
                  <EmptyDescription>
                    Ask an administrator to add you to an organization.
                  </EmptyDescription>
                </EmptyHeader>
                {user?.role === "admin" ? (
                  <EmptyContent>
                    <Button render={<Link to="/admin/organizations" />}>
                      <PlusIcon data-icon="inline-start" />
                      Create organization
                    </Button>
                  </EmptyContent>
                ) : null}
              </Empty>
            ) : (
              organizations.map((organization) => (
                <Button
                  className="h-auto w-full justify-start p-4 text-left"
                  disabled={activatingId !== null}
                  key={organization.id}
                  onClick={() => selectOrganization(organization.id)}
                  variant="outline"
                >
                  <OrganizationAvatar
                    className="size-10 shrink-0"
                    id={organization.id}
                    logo={organization.logo}
                    name={organization.name}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{organization.name}</span>
                    <span className="block truncate font-normal text-muted-foreground text-xs">
                      {organization.slug}
                    </span>
                  </span>
                  {activatingId === organization.id ? (
                    <span className="text-muted-foreground text-xs">Opening...</span>
                  ) : (
                    <ArrowRightIcon data-icon="inline-end" />
                  )}
                </Button>
              ))
            )}
          </CardPanel>
        </Card>
      </main>
    </div>
  );
}

function OrganizationListSkeleton() {
  return Array.from({ length: 2 }, (_, index) => (
    <div className="flex items-center gap-3 rounded-lg border p-4" key={index}>
      <Skeleton className="size-10 rounded-md" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  ));
}
