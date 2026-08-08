import {
  type PermissionResource,
  type RoleName,
  permissionMetadata,
  roleHas,
  roleMetadata,
  roles,
} from "@matdesk/auth/permissions";
import { CardFrame } from "@matdesk/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@matdesk/ui/components/table";
import { CheckIcon, MinusIcon } from "lucide-react";
import { Fragment } from "react";

/** Current roles, in the order they widen: owner first, legacy roles hidden. */
const ROLE_COLUMNS = (Object.keys(roles) as RoleName[]).filter(
  (role) => role === "owner" || roleMetadata[role].assignable,
);

const RESOURCES = Object.entries(permissionMetadata) as [
  PermissionResource,
  (typeof permissionMetadata)[PermissionResource],
][];

/**
 * Better Auth owns these statements (they gate its own organization endpoints),
 * so they live outside `permissionMetadata` — but they are the ones that separate
 * Inhaber/Administrator from the operative roles, so they belong in the matrix.
 */
const TEAM_SECTION = {
  label: "Team & Organisation",
  actions: [
    {
      resource: "invitation",
      action: "create",
      label: "Einladen",
      description: "Neue Teammitglieder per E-Mail einladen.",
    },
    {
      resource: "member",
      action: "update",
      label: "Rollen ändern",
      description: "Rolle eines Teammitglieds ändern.",
    },
    {
      resource: "member",
      action: "delete",
      label: "Team­mitglieder entfernen",
      description: "Zugriff auf die Organisation entziehen.",
    },
    {
      resource: "organization",
      action: "update",
      label: "Organisation bearbeiten",
      description: "Name, Logo und Slug der Organisation ändern.",
    },
  ],
};

export function RolePermissions() {
  return (
    <CardFrame className="min-w-0 overflow-hidden">
      <Table className="min-w-[820px]" variant="card">
        <TableHeader>
          <TableRow>
            <TableHead>Berechtigung</TableHead>
            {ROLE_COLUMNS.map((role) => (
              <TableHead className="w-28 text-center" key={role}>
                {roleMetadata[role].label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {RESOURCES.map(([resource, def]) => (
            <Fragment key={resource}>
              <TableRow className="hover:bg-transparent">
                <TableCell
                  className="bg-muted/40! py-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide"
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
                  {ROLE_COLUMNS.map((role) => (
                    <TableCell className="text-center" key={role}>
                      {roleHas(role, resource, action) ? (
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
          <TableRow className="hover:bg-transparent">
            <TableCell
              className="bg-muted/40! py-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide"
              colSpan={1 + ROLE_COLUMNS.length}
            >
              {TEAM_SECTION.label}
            </TableCell>
          </TableRow>
          {TEAM_SECTION.actions.map((entry) => (
            <TableRow key={`${entry.resource}:${entry.action}`}>
              <TableCell>
                <p className="font-medium text-foreground text-sm">{entry.label}</p>
                <p className="text-muted-foreground text-xs">{entry.description}</p>
              </TableCell>
              {ROLE_COLUMNS.map((role) => (
                <TableCell className="text-center" key={role}>
                  {roleHas(role, entry.resource, entry.action) ? (
                    <CheckIcon className="mx-auto size-4 text-success" />
                  ) : (
                    <MinusIcon className="mx-auto size-4 text-muted-foreground/40" />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardFrame>
  );
}
