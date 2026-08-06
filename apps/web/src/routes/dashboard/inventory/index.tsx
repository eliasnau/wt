import { Button } from "@matdesk/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { InventoryCard } from "@/components/dashboard/inventory/inventory-card";
import { ProductSheet } from "@/components/dashboard/inventory/product-sheet";

export const Route = createFileRoute("/dashboard/inventory/")({
	component: RouteComponent,
});

function RouteComponent() {
	const [createOpen, setCreateOpen] = useState(false);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Inventar</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Produkte, Varianten und Bestände deiner Organisation.
					</p>
				</div>
				<Button onClick={() => setCreateOpen(true)}>
					<PlusIcon />
					Produkt hinzufügen
				</Button>
			</div>

			<InventoryCard />

			<ProductSheet onOpenChange={setCreateOpen} open={createOpen} />
		</div>
	);
}
