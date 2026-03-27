"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	formatBillingDateShort,
	formatCents,
	getCreditGrantTypeLabel,
	type CreditGrantType,
} from "@/utils/billing";
import { orpc } from "@/utils/orpc";

interface CreditGrantsTableProps {
	onSelectGrant: (grantId: string) => void;
}

export function CreditGrantsTable({ onSelectGrant }: CreditGrantsTableProps) {
	const { data, isPending, error, refetch } = useQuery(
		orpc.billing.listCreditGrants.queryOptions({
			input: {},
		}),
	);

	if (isPending) {
		return (
			<Frame>
				<FramePanel className="p-0">
					<div className="p-4">
						<Skeleton className="h-8 w-full" />
					</div>
					<div className="space-y-2 p-4 pt-0">
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
					</div>
				</FramePanel>
			</Frame>
		);
	}

	if (error) {
		return (
			<Frame>
				<FramePanel>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<AlertCircle />
							</EmptyMedia>
							<EmptyTitle>Guthaben konnten nicht geladen werden</EmptyTitle>
							<EmptyDescription>
								{error instanceof Error
									? error.message
									: "Ein Fehler ist aufgetreten."}
							</EmptyDescription>
						</EmptyHeader>
						<Button onClick={() => refetch()}>Erneut versuchen</Button>
					</Empty>
				</FramePanel>
			</Frame>
		);
	}

	if (!data?.length) {
		return (
			<Frame>
				<FramePanel>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<Gift />
							</EmptyMedia>
							<EmptyTitle>Keine Guthaben</EmptyTitle>
							<EmptyDescription>
								Es wurden noch keine Guthaben vergeben.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</FramePanel>
			</Frame>
		);
	}

	// Determine if grant is exhausted
	const isExhausted = (grant: (typeof data)[0]) => {
		if (grant.type === "money") {
			return (grant.remainingAmountCents ?? 0) <= 0;
		}
		return (grant.remainingCycles ?? 0) <= 0;
	};

	// Determine if grant is expired
	const isExpired = (grant: (typeof data)[0]) => {
		if (!grant.expiresAt) return false;
		return new Date(grant.expiresAt) < new Date();
	};

	// Format remaining value
	const formatRemaining = (grant: (typeof data)[0]) => {
		if (grant.type === "money") {
			return formatCents(grant.remainingAmountCents ?? 0);
		}
		return `${grant.remainingCycles ?? 0} Monate`;
	};

	// Format original value
	const formatOriginal = (grant: (typeof data)[0]) => {
		if (grant.type === "money") {
			return formatCents(grant.originalAmountCents ?? 0);
		}
		return `${grant.originalCycles ?? 0} Monate`;
	};

	return (
		<Frame>
			<FramePanel className="p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Typ</TableHead>
							<TableHead>Beschreibung</TableHead>
							<TableHead>Original</TableHead>
							<TableHead>Verbleibend</TableHead>
							<TableHead>Gültig ab</TableHead>
							<TableHead>Gültig bis</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((grant) => {
							const exhausted = isExhausted(grant);
							const expired = isExpired(grant);
							return (
								<TableRow
									key={grant.id}
									className="cursor-pointer"
									onClick={() => onSelectGrant(grant.id)}
								>
									<TableCell>
										<Badge variant="outline">
											{getCreditGrantTypeLabel(grant.type as CreditGrantType)}
										</Badge>
									</TableCell>
									<TableCell className="max-w-[200px] truncate">
										{grant.description || "-"}
									</TableCell>
									<TableCell className="font-mono">
										{formatOriginal(grant)}
									</TableCell>
									<TableCell className="font-mono">
										{formatRemaining(grant)}
									</TableCell>
									<TableCell>
										{grant.validFrom
											? formatBillingDateShort(grant.validFrom)
											: "-"}
									</TableCell>
									<TableCell>
										{grant.expiresAt
											? formatBillingDateShort(grant.expiresAt)
											: "-"}
									</TableCell>
									<TableCell>
										{exhausted ? (
											<Badge variant="outline">Aufgebraucht</Badge>
										) : expired ? (
											<Badge variant="error">Abgelaufen</Badge>
										) : (
											<Badge variant="success">Aktiv</Badge>
										)}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</FramePanel>
		</Frame>
	);
}
