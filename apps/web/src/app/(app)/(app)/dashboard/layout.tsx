import { getServerSession } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session?.session.activeOrganizationId) {
    const h = await headers();
    const pathname = h.get("x-pathname") || "/dashboard";
    redirect(`/organizations?returnUrl=${encodeURIComponent(pathname)}`);
  }
  return <>{children}</>;
}
