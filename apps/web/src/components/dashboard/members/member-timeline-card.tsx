"use client";

import { Badge } from "@matdesk/ui/components/badge";
import { Button } from "@matdesk/ui/components/button";
import {
  Card,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@matdesk/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@matdesk/ui/components/empty";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuTrigger,
} from "@matdesk/ui/components/menu";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import { cn } from "@matdesk/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { parseError } from "evlog";
import {
  AwardIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  CircleDollarSignIcon,
  HistoryIcon,
  SparklesIcon,
  UserRoundIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { formatCents, formatDate } from "@/lib/format";
import { memberTimelineQueryOptions } from "@/queries/members";
import { client } from "@/utils/orpc";

type Timeline = Awaited<ReturnType<typeof client.members.timeline>>;
type TimelineCategory = Timeline[number]["category"];

const CATEGORY_META: Record<TimelineCategory, { label: string; icon: LucideIcon; node: string }> = {
  membership: {
    label: "Mitgliedschaft",
    icon: UserRoundIcon,
    node: "bg-primary/10 text-primary ring-primary/20",
  },
  group: {
    label: "Gruppen",
    icon: UsersIcon,
    node: "bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300",
  },
  progression: {
    label: "Graduierungen",
    icon: AwardIcon,
    node: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
  },
  event: {
    label: "Veranstaltungen",
    icon: CalendarDaysIcon,
    node: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300",
  },
  coaching: {
    label: "Einzelcoaching",
    icon: SparklesIcon,
    node: "bg-cyan-500/10 text-cyan-700 ring-cyan-500/20 dark:text-cyan-300",
  },
  billing: {
    label: "Finanzen",
    icon: CircleDollarSignIcon,
    node: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as TimelineCategory[];

export function MemberTimelineCard({ memberId }: { memberId: string }) {
  const timelineQuery = useQuery(memberTimelineQueryOptions(memberId));
  const [visibleCategories, setVisibleCategories] = useState(
    () => new Set<TimelineCategory>(ALL_CATEGORIES),
  );
  const entries = (timelineQuery.data ?? []).filter((entry) =>
    visibleCategories.has(entry.category),
  );
  const grouped = entries.reduce<Record<string, Timeline>>((years, entry) => {
    const year = entry.occurredOn.slice(0, 4);
    (years[year] ??= []).push(entry);
    return years;
  }, {});

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Verlauf</CardFrameTitle>
        <CardFrameDescription>
          Stationen dieser Mitgliedschaft in zeitlicher Folge.
        </CardFrameDescription>
        <CardFrameAction>
          <Menu>
            <MenuTrigger render={<Button size="sm" variant="outline" />}>
              Filtern
              <ChevronDownIcon />
            </MenuTrigger>
            <MenuPopup align="end" className="min-w-52">
              <MenuGroup>
                <MenuGroupLabel>Kategorien</MenuGroupLabel>
                {ALL_CATEGORIES.map((category) => (
                  <MenuCheckboxItem
                    checked={visibleCategories.has(category)}
                    closeOnClick={false}
                    key={category}
                    onCheckedChange={(checked) =>
                      setVisibleCategories((current) => {
                        const next = new Set(current);
                        if (checked) next.add(category);
                        else next.delete(category);
                        return next;
                      })
                    }
                  >
                    {CATEGORY_META[category].label}
                  </MenuCheckboxItem>
                ))}
              </MenuGroup>
            </MenuPopup>
          </Menu>
        </CardFrameAction>
      </CardFrameHeader>
      <Card>
        <CardPanel>
          {timelineQuery.isPending ? (
            <TimelineSkeleton />
          ) : timelineQuery.isError ? (
            <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
              <p className="text-muted-foreground text-sm">
                {parseError(timelineQuery.error).message}
              </p>
              <Button onClick={() => timelineQuery.refetch()} size="sm" variant="outline">
                Erneut versuchen
              </Button>
            </div>
          ) : entries.length === 0 ? (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HistoryIcon />
                </EmptyMedia>
                <EmptyTitle>Keine Einträge für diese Auswahl</EmptyTitle>
                <EmptyDescription>Aktiviere weitere Kategorien im Filter.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped)
                .sort(([left], [right]) => right.localeCompare(left))
                .map(([year, yearEntries]) => (
                  <section key={year}>
                    <h3 className="mb-3 text-muted-foreground text-xs font-semibold tracking-wide">
                      {year}
                    </h3>
                    <div>
                      {yearEntries.map((entry, index) => (
                        <TimelineNode
                          entry={entry}
                          key={entry.id}
                          last={index === yearEntries.length - 1}
                        />
                      ))}
                    </div>
                  </section>
                ))}
            </div>
          )}
        </CardPanel>
      </Card>
    </CardFrame>
  );
}

function TimelineNode({ entry, last }: { entry: Timeline[number]; last: boolean }) {
  const meta = CATEGORY_META[entry.category];
  const Icon = meta.icon;

  return (
    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "relative z-10 flex size-9 items-center justify-center rounded-full ring-1",
            meta.node,
          )}
        >
          <Icon className="size-4" />
        </span>
        {last ? null : <span aria-hidden="true" className="min-h-5 w-px flex-1 bg-border" />}
      </div>
      <div className={cn("min-w-0 pb-5", last && "pb-0")}>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <p className="font-medium text-sm">{entry.title}</p>
            {entry.description ? (
              <p className="mt-0.5 text-muted-foreground text-sm">{entry.description}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {entry.amountCents == null ? null : (
              <Badge variant="secondary">{formatCents(entry.amountCents)}</Badge>
            )}
            <time className="text-muted-foreground text-xs" dateTime={entry.occurredOn}>
              {formatDate(entry.occurredOn)}
            </time>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-3 w-10" />
      {Array.from({ length: 5 }, (_, index) => (
        <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3" key={index}>
          <div className="flex flex-col items-center">
            <Skeleton className="size-9 rounded-full" />
            {index < 4 ? <span className="min-h-5 w-px flex-1 bg-border" /> : null}
          </div>
          <div className="space-y-2 pb-5">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
