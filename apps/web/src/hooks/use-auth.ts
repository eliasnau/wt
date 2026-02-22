"use client";

import { authClient } from "@repo/auth/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { use } from "react";
import { AuthContext } from "@/providers/auth-provider";

export function useAuth() {
  const context = use(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const queryClient = useQueryClient();
  const router = useRouter();

  const switchOrganization = async (
    organizationId: string,
    source?: string,
  ) => {
    const prevOrganizationId = context.activeOrganization?.id;

    if (prevOrganizationId === organizationId) {
      return;
    }

    const { error, data } = await authClient.organization.setActive({
      organizationId,
    });

    if (error) {
      throw new Error(error.message || "Failed to switch organization");
    }

    context.activeOrganization = data;

    posthog.capture("organization:switch", {
      organization_id: organizationId,
      prev_organization_id: prevOrganizationId,
      switch_source: source || "unknown",
    });

    await queryClient.resetQueries();

    router.refresh();
  };

  const signOut = async () => {
    posthog.capture("auth:sign_out");
    posthog.reset();

    const { error } = await authClient.signOut();

    if (error) {
      throw new Error(error.message || "Failed to sign out");
    }

    router.push("/sign-in");
  };

  return {
    session: context.session,
    activeOrganization: context.activeOrganization,
    switchOrganization,
    signOut,
  };
}
