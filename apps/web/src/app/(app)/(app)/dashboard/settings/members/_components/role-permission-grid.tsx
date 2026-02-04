"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { permissionResources, permissionResourceGroups } from "./role-utils";
import type { PermissionCheck } from "@repo/auth/permissions";

function toggleAction(
	permissions: PermissionCheck,
	resource: string,
	action: string,
) {
	const current = permissions[resource as keyof PermissionCheck] ?? [];
	const hasAction = current.includes(action);
	const nextActions = hasAction
		? current.filter((value) => value !== action)
		: [...current, action];
	const nextPermissions = { ...permissions };
	if (nextActions.length === 0) {
		delete nextPermissions[resource as keyof PermissionCheck];
	} else {
		nextPermissions[resource as keyof PermissionCheck] = nextActions;
	}
	return nextPermissions;
}

function setAllActions(
	permissions: PermissionCheck,
	resource: string,
	actions: string[],
	enabled: boolean,
) {
	const nextPermissions = { ...permissions };
	if (!enabled) {
		delete nextPermissions[resource as keyof PermissionCheck];
		return nextPermissions;
	}
	nextPermissions[resource as keyof PermissionCheck] = actions;
	return nextPermissions;
}

type RolePermissionGridProps = {
	value: PermissionCheck;
	onChange: (value: PermissionCheck) => void;
	disabled?: boolean;
	grouped?: boolean;
};

export function RolePermissionGrid({
	value,
	onChange,
	disabled = false,
	grouped = false,
}: RolePermissionGridProps) {
	const resourcesToRender = grouped
		? permissionResourceGroups
		: [
				{
					id: "all",
					title: undefined,
					description: undefined,
					resources: permissionResources,
				},
			];

	return (
		<div className="grid gap-4">
			{resourcesToRender.map((group, index) => (
				<div key={group.id} className="grid gap-4">
					{group.title && (
						<div className="flex flex-col gap-1">
							<div className="text-sm font-semibold">{group.title}</div>
							{group.description && (
								<div className="text-xs text-muted-foreground">
									{group.description}
								</div>
							)}
						</div>
					)}
					{group.resources.map(({ resource, actions }) => {
						const selected = new Set(
							value[resource as keyof PermissionCheck] ?? [],
						);
						const allSelected = actions.every((action) =>
							selected.has(action),
						);
						const hasAny = actions.some((action) => selected.has(action));
						const toggleAllLabel = allSelected ? "Clear" : "Select all";
						const showAccessControlInfo = resource === "ac";

						return (
							<div
								key={resource}
								className="rounded-xl border bg-muted/30 p-4"
							>
								<div className="flex items-center justify-between gap-2">
									<div>
										<div className="text-sm font-semibold capitalize">
											{resource}
										</div>
										<div className="text-xs text-muted-foreground">
											{hasAny
												? `${selected.size} selected`
												: "No permissions selected"}
										</div>
									</div>
									<Button
										variant="ghost"
										size="sm"
										disabled={disabled}
										onClick={() =>
											onChange(
												setAllActions(value, resource, actions, !allSelected),
											)
										}
									>
										{toggleAllLabel}
									</Button>
								</div>
								{showAccessControlInfo && (
									<div className="mt-3 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
										Access control (AC) permissions govern who can create,
										edit, and manage roles and access rules.
									</div>
								)}
								<div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
									{actions.map((action) => {
										const checked = selected.has(action);
										return (
											<label
												key={`${resource}-${action}`}
												className="flex items-center gap-2 rounded-md border border-transparent px-2 py-1 text-sm text-muted-foreground hover:border-border"
											>
												<Checkbox
													checked={checked}
													disabled={disabled}
													onCheckedChange={(nextChecked) => {
														if (nextChecked === "indeterminate") return;
														onChange(
															toggleAction(value, resource, action),
														);
													}}
												/>
												<span className="capitalize text-foreground">
													{action.replace(/_/g, " ")}
												</span>
											</label>
										);
									})}
								</div>
							</div>
						);
					})}
					{grouped && index < resourcesToRender.length - 1 && (
						<div className="border-t" />
					)}
				</div>
			))}
		</div>
	);
}
