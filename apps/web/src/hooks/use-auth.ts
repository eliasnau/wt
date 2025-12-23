"use client";

import { authClient } from "@repo/auth/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { use } from "react";
import { AuthContext } from "@/providers/auth-provider";

export function useAuth() {
  const context = use(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const queryClient = useQueryClient();
  const router = useRouter();

  const switchOrganization = async (organizationId: string) => {
    const { error, data } = await authClient.organization.setActive({
      organizationId,
    });

    if (error) {
      throw new Error(error.message || "Failed to switch organization");
    }

    context.activeOrganization = data;

    await queryClient.resetQueries();

    router.refresh();
  };

  return {
    session: context.session,
    activeOrganization: context.activeOrganization,
    switchOrganization,
  };
}
