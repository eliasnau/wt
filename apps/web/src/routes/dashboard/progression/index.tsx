import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@matdesk/ui/components/alert-dialog";
import { Badge } from "@matdesk/ui/components/badge";
import { Button } from "@matdesk/ui/components/button";
import { CardFrame } from "@matdesk/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@matdesk/ui/components/empty";
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from "@matdesk/ui/components/menu";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@matdesk/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { parseError } from "evlog";
import { AwardIcon, EditIcon, MoreVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  SystemDialog,
  type ProgressionSystemRow,
} from "@/components/dashboard/progression/system-dialog";
import { progressionSystemsQueryOptions } from "@/queries/progression";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/progression/")({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(progressionSystemsQueryOptions());
  },
  pendingComponent: ProgressionPageSkeleton,
  component: RouteComponent,
});

function ProgressionPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-balance font-semibold text-2xl tracking-tight">Graduierungen</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Verwalte Graduierungssysteme für alle angebotenen Sportarten.
          </p>
        </div>
        <Button disabled><PlusIcon /> System hinzufügen</Button>
      </div>
      <SystemsTableSkeleton />
    </div>
  );
}

function SystemsTableSkeleton() {
  return (
    <CardFrame className="w-full min-w-0 overflow-hidden">
      <Table className="min-w-[680px]" variant="card">
        <TableHeader>
          <TableRow>
            <TableHead>System</TableHead>
            <TableHead>Art</TableHead>
            <TableHead>Stufen</TableHead>
            <TableHead>Gruppen</TableHead>
            <TableHead className="w-px text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 4 }).map((_, index) => (
            <TableRow key={index}>
              {Array.from({ length: 5 }).map((__, cell) => (
                <TableCell key={cell}><Skeleton className="h-4 w-24" /></TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardFrame>
  );
}

function RouteComponent() {
  const queryClient = useQueryClient();
  const systemsQuery = useQuery(progressionSystemsQueryOptions());
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProgressionSystemRow | null>(null);
  const [deleting, setDeleting] = useState<ProgressionSystemRow | null>(null);
  const deleteMutation = useMutation(
    orpc.progression.deleteSystem.mutationOptions({
      onSuccess: () => {
        toast.success("Graduierungssystem gelöscht");
        queryClient.invalidateQueries({ queryKey: orpc.progression.key() });
        setDeleting(null);
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-balance font-semibold text-2xl tracking-tight">Graduierungen</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Verwalte Graduierungssysteme für alle angebotenen Sportarten.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <PlusIcon /> System hinzufügen
        </Button>
      </div>

      <CardFrame className="w-full min-w-0 overflow-hidden">
        <Table className="min-w-[680px]" variant="card">
          <TableHeader>
            <TableRow>
              <TableHead>System</TableHead>
              <TableHead>Art</TableHead>
              <TableHead>Stufen</TableHead>
              <TableHead>Gruppen</TableHead>
              <TableHead className="w-px text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {systemsQuery.isError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="py-14 text-center" colSpan={5}>
                  <p className="mb-3 text-muted-foreground text-sm">
                    {parseError(systemsQuery.error).message}
                  </p>
                  <Button onClick={() => systemsQuery.refetch()} size="sm" variant="outline">
                    Erneut versuchen
                  </Button>
                </TableCell>
              </TableRow>
            ) : systemsQuery.isPending ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 5 }).map((__, cell) => (
                    <TableCell key={cell}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : systemsQuery.data?.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="p-0" colSpan={5}>
                  <Empty className="py-14">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <AwardIcon />
                      </EmptyMedia>
                      <EmptyTitle>Noch keine Graduierungssysteme</EmptyTitle>
                      <EmptyDescription>
                        Lege das erste System für eine Sportart an.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              systemsQuery.data?.map((system) => (
                <TableRow
                  className="cursor-pointer"
                  key={system.id}
                  onClick={() =>
                    navigate({
                      to: "/dashboard/progression/$systemId",
                      params: { systemId: system.id },
                    })
                  }
                >
                  <TableCell>
                    <div className="max-w-xs truncate font-medium text-foreground">
                      {system.name}
                    </div>
                    <div className="text-muted-foreground text-xs">Einheit: {system.unitLabel}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {system.mode === "sequential" ? "Aufeinanderfolgend" : "Sammlung"}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{system.ranks.length}</TableCell>
                  <TableCell className="tabular-nums">{system.groups.length}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Menu>
                        <MenuTrigger
                          render={
                            <Button
                              aria-label="Weitere Aktionen"
                              onClick={(event) => event.stopPropagation()}
                              size="icon-sm"
                              variant="outline"
                            >
                              <MoreVerticalIcon />
                            </Button>
                          }
                        />
                        <MenuPopup align="end">
                          <MenuItem
                            onClick={() => {
                              setEditing(system);
                              setDialogOpen(true);
                            }}
                          >
                            <EditIcon />
                            Bearbeiten
                          </MenuItem>
                          <MenuSeparator />
                          <MenuItem onClick={() => setDeleting(system)} variant="destructive">
                            <Trash2Icon />
                            Löschen
                          </MenuItem>
                        </MenuPopup>
                      </Menu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardFrame>

      <SystemDialog onOpenChange={setDialogOpen} open={dialogOpen} system={editing} />
      <AlertDialog onOpenChange={(open) => !open && setDeleting(null)} open={Boolean(deleting)}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Graduierungssystem löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              „{deleting?.name}“ und alle noch nicht verliehenen Stufen werden dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Abbrechen</AlertDialogClose>
            <Button
              loading={deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate({ systemId: deleting.id })}
              variant="destructive"
            >
              Löschen
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
