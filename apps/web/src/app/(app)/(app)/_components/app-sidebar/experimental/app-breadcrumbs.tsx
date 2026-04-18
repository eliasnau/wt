import type { ReactNode } from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from "@/components/ui/breadcrumb";

export type AppBreadcrumbPage = {
	title: string;
	icon?: ReactNode;
};

export function AppBreadcrumbs({ page }: { page?: AppBreadcrumbPage | null }) {
	if (!page?.title) {
		return null;
	}

	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbPage className="flex items-center gap-2 [&>svg]:size-3.5">
						{page.icon}
						{page.title}
					</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	);
}
