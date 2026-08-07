import { Button } from "@matdesk/ui/components/button";
import {
  CardFrame,
  CardFrameAction,
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
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { CoachingDialog } from "@/components/dashboard/coaching/coaching-dialog";
import { orpc } from "@/utils/orpc";

export function MemberCoachingCard({
  memberId,
  memberName,
}: {
  memberId: string;
  memberName: string;
}) {
  const [open, setOpen] = useState(false);
  const query = useQuery(orpc.coaching.list.queryOptions({ input: { memberId } }));
  const rows = [...(query.data ?? [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  return (
    <>
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Einzelcoaching</CardFrameTitle>
          <CardFrameDescription>
            {query.data?.filter((row) => row.status === "attended").length ?? 0} absolvierte
            Termine.
          </CardFrameDescription>
          <CardFrameAction>
            <Button onClick={() => setOpen(true)} size="sm" variant="outline">
              <PlusIcon />
              Coaching anlegen
            </Button>
          </CardFrameAction>
        </CardFrameHeader>
        <Table variant="card">
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Trainer</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {new Date(`${row.date}T12:00:00`).toLocaleDateString("de-DE")} ·{" "}
                    {row.startTime.slice(0, 5)}
                  </TableCell>
                  <TableCell>{row.coach.name}</TableCell>
                  <TableCell>
                    {row.status === "attended"
                      ? "Teilgenommen"
                      : row.status === "no_show"
                        ? "Nicht erschienen"
                        : row.status === "cancelled"
                          ? "Abgesagt"
                          : "Geplant"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="py-8 text-center text-muted-foreground" colSpan={3}>
                  Noch keine Coachings.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="border-t p-3 text-right">
          <Button render={<Link to="/dashboard/coaching" />} size="sm" variant="ghost">
            Alle Coachings
          </Button>
        </div>
      </CardFrame>
      <CoachingDialog
        initialMemberId={memberId}
        initialMemberName={memberName}
        onOpenChange={setOpen}
        open={open}
      />
    </>
  );
}
