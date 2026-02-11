"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import {
	countPermissions,
	flattenPermissions,
	formatRoleLabel,
	type PermissionMap,
} from "./role-utils";

const MAX_PERMISSION_PREVIEW = 6;

type RoleSummaryCardProps = {
	roleName: string;
	permission?: PermissionMap | null;
	isSystem?: boolean;
	canEdit?: boolean;
	canDelete?: boolean;
	canView?: boolean;
	onEdit?: () => void;
	onDelete?: () => void;
	onView?: () => void;
};

export function RoleSummaryCard({
	roleName,
	permission,
	isSystem = false,
	canEdit = false,
	canDelete = false,
	canView = true,
	onEdit,
	onDelete,
	onView,
}: RoleSummaryCardProps) {
	const permissionCount = countPermissions(permission ?? undefined);
	const permissionList = flattenPermissions(permission ?? undefined);
	const preview = permissionList.slice(0, MAX_PERMISSION_PREVIEW);
	const remaining = permissionList.length - preview.length;

	return (
		<div className="rounded-2xl border bg-background p-4 shadow-xs">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<div className="flex items-center gap-2">
						<div className="text-base font-semibold">
							{formatRoleLabel(roleName)}
						</div>
						<Badge variant={isSystem ? "secondary" : "outline"}>
							{isSystem ? "Built-in" : "Custom"}
						</Badge>
					</div>
					<div className="text-sm text-muted-foreground">
						{permissionCount === 0
							? "Keine Berechtigungen zugewiesen"
							: `${permissionCount} permission${
									permissionCount === 1 ? "" : "s"
								}`}
					</div>
				</div>
				{(onEdit || onDelete || onView) && (
					<div className="flex items-center gap-2">
						{onView && (
							<Button
								variant="outline"
								size="sm"
								onClick={onView}
								disabled={!canView}
							>
								<Eye className="size-4" />
								View
							</Button>
						)}
						{!isSystem && onEdit && (
							<Button
								variant="outline"
								size="sm"
								onClick={onEdit}
								disabled={!canEdit}
							>
								<Pencil className="size-4" />
								Edit
							</Button>
						)}
						{!isSystem && onDelete && (
							<Button
								variant="destructive-outline"
								size="sm"
								onClick={onDelete}
								disabled={!canDelete}
							>
								<Trash2 className="size-4" />
								Delete
							</Button>
						)}
					</div>
				)}
			</div>
			{preview.length > 0 && (
				<div className="mt-4 flex flex-wrap gap-2">
					{preview.map((item) => (
						<Badge key={item} variant="outline">
							{item}
						</Badge>
					))}
					{remaining > 0 && (
						<Badge variant="secondary">+{remaining} more</Badge>
					)}
				</div>
			)}
		</div>
	);
}
