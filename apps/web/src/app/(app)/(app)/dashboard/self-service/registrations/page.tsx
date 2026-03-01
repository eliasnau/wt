import { Suspense } from "react";
import { NoPermission } from "@/components/dashboard/no-permission";
import { hasPermission } from "@/lib/auth";
import { SelfServiceRegistrationsPageClient } from "./self-service-registrations-page-client";

export default async function SelfServiceRegistrationsPage() {
  const result = await hasPermission({ member: ["update"] });

  if (!result.success) {
    return (
      <NoPermission
        title="Kein Zugriff auf Self-Service"
        description="Du hast nicht die nötigen Berechtigungen, um Self-Service-Registrierungen zu verwalten."
      />
    );
  }

  return (
    <Suspense>
      <SelfServiceRegistrationsPageClient />
    </Suspense>
  );
}
