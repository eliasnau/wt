import { Suspense } from "react";
import { NoPermission } from "@/components/dashboard/no-permission";
import { hasPermission } from "@/lib/auth";
import { SelfServiceRegistrationDetailPageClient } from "./self-service-registration-detail-page-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SelfServiceRegistrationDetailPage({
  params,
}: PageProps) {
  const result = await hasPermission({ member: ["update"] });

  if (!result.success) {
    return (
      <NoPermission
        title="Kein Zugriff auf Self-Service"
        description="Du hast nicht die nötigen Berechtigungen, um Self-Service-Registrierungen zu verwalten."
      />
    );
  }

  const { id } = await params;

  return (
    <Suspense>
      <SelfServiceRegistrationDetailPageClient id={id} />
    </Suspense>
  );
}
