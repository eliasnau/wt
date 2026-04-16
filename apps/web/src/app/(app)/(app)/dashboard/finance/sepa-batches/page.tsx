"use client";

import { useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { getSepaBatchStatusLabel, type SepaBatchStatus } from "@/utils/billing";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../../_components/page-header";
import { GenerateSepaBatchButton } from "./_components/generate-sepa-batch-button";
import { SepaBatchDetailSheet } from "./_components/sepa-batch-detail-sheet";
import { SepaBatchesTable } from "./_components/sepa-batches-table";

export default function SepaBatchesPage() {
	const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [statusFilter, setStatusFilter] = useState<SepaBatchStatus | "all">(
		"all",
	);

	const handleSelectBatch = (batchId: string) => {
		setSelectedBatchId(batchId);
		setSheetOpen(true);
	};

	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Lastschriften</HeaderTitle>
					<HeaderDescription>
						Generierte SEPA-Lastschrift-Dateien. Jede Lastschrift ist nach der
						Generierung eingefroren.
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<Select
						value={statusFilter}
						onValueChange={(value) =>
							setStatusFilter(value as SepaBatchStatus | "all")
						}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Status filtern" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Alle Status</SelectItem>
							<SelectItem value="generated">
								{getSepaBatchStatusLabel("generated")}
							</SelectItem>
							<SelectItem value="downloaded">
								{getSepaBatchStatusLabel("downloaded")}
							</SelectItem>
							<SelectItem value="void">
								{getSepaBatchStatusLabel("void")}
							</SelectItem>
							<SelectItem value="superseded">
								{getSepaBatchStatusLabel("superseded")}
							</SelectItem>
						</SelectContent>
					</Select>
					<GenerateSepaBatchButton />
				</HeaderActions>
			</Header>

			<SepaBatchesTable
				onSelectBatch={handleSelectBatch}
				statusFilter={statusFilter === "all" ? undefined : statusFilter}
			/>

			<SepaBatchDetailSheet
				batchId={selectedBatchId}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</div>
	);
}
