"use client";

import { authClient } from "@repo/auth/client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { data: activeOrg, isPending } = authClient.useActiveOrganization();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (!isPending && !activeOrg) {
			const redirectUrl = encodeURIComponent(pathname);
			router.push(`/organizations?redirect=${redirectUrl}`);
		}
	}, [activeOrg, isPending, pathname, router]);

	if (!isPending && !activeOrg) {
		return null;
	}

	return <>{children}</>;
}
