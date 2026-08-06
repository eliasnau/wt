import {
	CardFrame,
	CardFrameDescription,
	CardFrameHeader,
	CardFrameTitle,
} from "@matdesk/ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@matdesk/ui/components/table";
import {
	admin,
	member,
	owner,
	type PermissionResource,
	permissionMetadata,
} from "@matdesk/auth/permissions";
import { CheckIcon, MinusIcon } from "lucide-react";
import { Fragment } from "react";

type Statements = Record<string, readonly string[] | undefined>;

const ROLE_COLUMNS: { key: string; label: string; statements: Statements }[] = [
	{ key: "owner", label: "Inhaber", statements: owner.statements as Statements },
	{ key: "admin", label: "Admin", statements: admin.statements as Statements },
	{ key: "member", label: "Mitglied", statements: member.statements as Statements },
];

function roleHas(statements: Statements, resource: string, action: string) {
	return statements[resource]?.includes(action) ?? false;
}

const RESOURCES = Object.entries(permissionMetadata) as [
	PermissionResource,
	(typeof permissionMetadata)[PermissionResource],
][];

export function RolePermissions() {
	return (
		<CardFrame>
			<CardFrameHeader>
				<CardFrameTitle>Rollen & Berechtigungen</CardFrameTitle>
				<CardFrameDescription>
					Welche Aktionen die jeweilige Rolle in dieser Organisation ausführen darf.
				</CardFrameDescription>
			</CardFrameHeader>
			<Table className="min-w-[640px]" variant="card">
				<TableHeader>
					<TableRow>
						<TableHead>Berechtigung</TableHead>
						{ROLE_COLUMNS.map((column) => (
							<TableHead className="w-24 text-center" key={column.key}>
								{column.label}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{RESOURCES.map(([resource, def]) => (
						<Fragment key={resource}>
							<TableRow className="hover:bg-transparent">
								<TableCell
									className="bg-muted/30 py-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide"
									colSpan={1 + ROLE_COLUMNS.length}
								>
									{def.label}
								</TableCell>
							</TableRow>
							{Object.entries(def.actions).map(([action, meta]) => (
								<TableRow key={action}>
									<TableCell>
										<p className="font-medium text-foreground text-sm">{meta.label}</p>
										<p className="text-muted-foreground text-xs">{meta.description}</p>
									</TableCell>
									{ROLE_COLUMNS.map((column) => (
										<TableCell className="text-center" key={column.key}>
											{roleHas(column.statements, resource, action) ? (
												<CheckIcon className="mx-auto size-4 text-success" />
											) : (
												<MinusIcon className="mx-auto size-4 text-muted-foreground/40" />
											)}
										</TableCell>
									))}
								</TableRow>
							))}
						</Fragment>
					))}
				</TableBody>
			</Table>
		</CardFrame>
	);
}
