"use client";

import { useState } from "react";
import { authClient } from "@repo/auth/client";
import { Button } from "@/components/ui/button";
import { Frame, FramePanel, FrameFooter } from "@/components/ui/frame";
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { OrganizationSettingsSheet } from "./organization-settings-sheet";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Building2,
  Users,
  Trash2,
  Settings,
  Check,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ORPCError } from "@orpc/client";

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date | string;
  members?: any[];
};

export function OrganizationsFrame() {
  const {
    data: organizationsData,
    isPending,
    refetch,
  } = authClient.useListOrganizations();
  const organizations = organizationsData as Organization[] | undefined;
  const { session, switchOrganization } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);

  const handleCreateOrganization = async () => {
    if (!orgName.trim() || !orgSlug.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(orgSlug)) {
      toast.error(
        "Slug must contain only lowercase letters, numbers, and hyphens",
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
        toast.error(error.message || "Failed to create organization");
        return;
      }

      toast.success("Organization created successfully");
      setIsCreateDialogOpen(false);
      setOrgName("");
      setOrgSlug("");
      refetch();
    } catch (error) {
      toast.error("Failed to create organization");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSetActiveOrg = async (organizationId: string) => {
    try {
      await switchOrganization(organizationId);
    } catch (error) {
      toast.error(
        error instanceof ORPCError
          ? error.message
          : "Failed to set active organization",
      );
    }
  };

  const handleDeleteOrganization = async (organizationId: string) => {
    setDeletingOrgId(organizationId);

    try {
      const { error } = await authClient.organization.delete({
        organizationId,
      });

      if (error) {
        toast.error(error.message || "Failed to delete organization");
        return;
      }

      toast.success("Organization deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete organization");
      console.error(error);
    } finally {
      setDeletingOrgId(null);
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

  const handleOpenSettings = (org: Organization) => {
    setSelectedOrg(org);
    setIsSettingsSheetOpen(true);
  };

  if (isPending) {
    return (
      <Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
        <FramePanel>
          <h2 className="font-heading text-xl mb-2 text-foreground">
            Organizations
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Manage your organizations and collaborate with your team
          </p>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        </FramePanel>
      </Frame>
    );
  }

  if (organizations && organizations.length === 0) {
    return (
      <>
        <Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
          <FramePanel>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2 />
                </EmptyMedia>
                <EmptyTitle>Organizations</EmptyTitle>
                <EmptyDescription>
                  Create an organization to collaborate with your team
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </FramePanel>

          <FrameFooter className="flex-row justify-end">
            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
              <Plus className="mr-2 size-4" />
              Create Organization
            </Button>
          </FrameFooter>
        </Frame>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogPopup>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
            </DialogHeader>
            <DialogPanel className="space-y-4">
              <Field>
                <FieldLabel>Organization Name</FieldLabel>
                <Input
                  value={orgName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Acme Inc."
                  autoFocus
                />
              </Field>
              <Field>
                <FieldLabel>Organization Slug</FieldLabel>
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
                <p className="text-xs text-muted-foreground mt-2">
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
                  "Create Organization"
                )}
              </Button>
            </DialogFooter>
          </DialogPopup>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
        <FramePanel>
          <h2 className="font-heading text-xl mb-2 text-foreground">
            Organizations
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Manage your organizations and collaborate with your team
          </p>

          <div className="space-y-3">
            {organizations?.map((org) => {
              const isActive =
                session?.session?.activeOrganizationId === org.id;
              const isDeleting = deletingOrgId === org.id;

              return (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {org.logo ? (
                      <img
                        src={org.logo}
                        alt={org.name}
                        className="size-10 rounded-md object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="size-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="size-5 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{org.name}</p>
                        {isActive && (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary whitespace-nowrap">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="truncate">{org.slug}</span>
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <Users className="size-3" />
                          {org.members?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isActive ? (
                      <Button variant="outline" size="sm" disabled>
                        <Check className="mr-2 size-4" />
                        Selected
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActiveOrg(org.id)}
                      >
                        Select
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenSettings(org)}
                    >
                      <Settings className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteOrganization(org.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </FramePanel>

        <FrameFooter className="flex-row justify-end">
          <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
            <Plus className="mr-2 size-4" />
            Create Organization
          </Button>
        </FrameFooter>
      </Frame>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
          </DialogHeader>
          <DialogPanel className="space-y-4">
            <Field>
              <FieldLabel>Organization Name</FieldLabel>
              <Input
                value={orgName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Acme Inc."
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel>Organization Slug</FieldLabel>
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
              <p className="text-xs text-muted-foreground mt-2">
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
                "Create Organization"
              )}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      <OrganizationSettingsSheet
        open={isSettingsSheetOpen}
        onOpenChange={setIsSettingsSheetOpen}
        organization={selectedOrg}
        userRole="owner"
        onLeave={refetch}
      />
    </>
  );
}
