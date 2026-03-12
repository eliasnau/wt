"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, RefreshCw, Search, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { orpc } from "@/utils/orpc";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../../_components/page-header";

export default function ValidateSepaPage() {
	const [search, setSearch] = useState("");

	const { data, isPending, error, refetch, isFetching } = useQuery(
		orpc.members.validateSepa.queryOptions({
			input: {},
		}),
	);

	const filteredMembers = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return data?.members ?? [];
		return (data?.members ?? []).filter((member) => {
			const reasons = member.reasons.join(" ").toLowerCase();
			const email = member.email?.toLowerCase() ?? "";
			return (
				member.memberName.toLowerCase().includes(term) ||
				email.includes(term) ||
				reasons.includes(term)
			);
		});
	}, [data?.members, search]);

	return (
		<div className="flex flex-col gap-6">
			<Header>
				<HeaderContent>
					<HeaderTitle>SEPA Member Validation</HeaderTitle>
					<HeaderDescription>
						Check all members for SEPA-ready debtor and mandate data
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
						<RefreshCw className={isFetching ? "animate-spin" : ""} />
						Refresh
					</Button>
				</HeaderActions>
			</Header>

			<Frame>
				<FramePanel className="flex flex-col gap-4">
					{error ? (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<AlertCircle />
								</EmptyMedia>
								<EmptyTitle>Validation failed</EmptyTitle>
								<EmptyDescription>
									{error instanceof Error
										? error.message
										: "Unable to validate member SEPA data."}
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						<>
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="secondary">Total: {data?.total ?? 0}</Badge>
								<Badge variant="secondary" className="gap-1">
									<CheckCircle2 className="size-3" />
									Valid: {data?.validCount ?? 0}
								</Badge>
								<Badge variant="destructive" className="gap-1">
									<XCircle className="size-3" />
									Invalid: {data?.invalidCount ?? 0}
								</Badge>
							</div>

							<div className="relative max-w-sm">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
								<Input
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder="Search member or issue"
									className="pl-9"
								/>
							</div>

							{isPending ? (
								<div className="py-10 text-center text-muted-foreground text-sm">
									Validating members...
								</div>
							) : filteredMembers.length === 0 ? (
								<div className="py-10 text-center text-muted-foreground text-sm">
									No members match your search.
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Member</TableHead>
											<TableHead>Email</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Issues</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredMembers.map((member) => (
											<TableRow key={member.memberId}>
												<TableCell className="font-medium">
													{member.memberName}
												</TableCell>
												<TableCell className="text-muted-foreground text-sm">
													{member.email || "—"}
												</TableCell>
												<TableCell>
													{member.valid ? (
														<Badge variant="secondary" className="gap-1">
															<CheckCircle2 className="size-3" />
															Valid
														</Badge>
													) : (
														<Badge variant="destructive" className="gap-1">
															<XCircle className="size-3" />
															Invalid
														</Badge>
													)}
												</TableCell>
												<TableCell className="text-sm">
													{member.reasons.length === 0
														? "—"
														: member.reasons.join(", ")}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</>
					)}
				</FramePanel>
			</Frame>
		</div>
	);
}
