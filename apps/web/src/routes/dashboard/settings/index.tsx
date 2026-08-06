import { Button } from "@matdesk/ui/components/button";
import {
	Card,
	CardFrame,
	CardFrameDescription,
	CardFrameFooter,
	CardFrameHeader,
	CardFrameTitle,
	CardPanel,
} from "@matdesk/ui/components/card";
import { Field, FieldDescription, FieldLabel } from "@matdesk/ui/components/field";
import { Input } from "@matdesk/ui/components/input";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { parseError } from "evlog";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/settings/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { activeOrganization, refetch } = useAuth();

	const [name, setName] = useState("");
	const [logo, setLogo] = useState("");
	const [slug, setSlug] = useState("");

	useEffect(() => {
		setName(activeOrganization?.name ?? "");
		setLogo(activeOrganization?.logo ?? "");
		setSlug(activeOrganization?.slug ?? "");
	}, [activeOrganization]);

	const orgId = activeOrganization?.id;

	const infoMutation = useMutation({
		mutationFn: async () => {
			const { error } = await authClient.organization.update({
				organizationId: orgId,
				data: { name: name.trim(), logo: logo.trim() || undefined },
			});
			if (error) throw new Error(error.message);
		},
		onSuccess: async () => {
			toast.success("Organisation aktualisiert");
			await refetch();
		},
		onError: (error) => toast.error(parseError(error).message),
	});

	const slugMutation = useMutation({
		mutationFn: async () => {
			const { error } = await authClient.organization.update({
				organizationId: orgId,
				data: { slug: slug.trim() },
			});
			if (error) throw new Error(error.message);
		},
		onSuccess: async () => {
			toast.success("Slug aktualisiert");
			await refetch();
		},
		onError: (error) => toast.error(parseError(error).message),
	});

	const infoChanged =
		name.trim() !== (activeOrganization?.name ?? "") ||
		logo.trim() !== (activeOrganization?.logo ?? "");
	const slugChanged = slug.trim() !== (activeOrganization?.slug ?? "");

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="font-semibold text-2xl tracking-tight">Allgemein</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Name, Logo und Slug deiner Organisation.
				</p>
			</div>

			<CardFrame>
				<CardFrameHeader>
					<CardFrameTitle>Organisation</CardFrameTitle>
					<CardFrameDescription>Name und Logo deiner Organisation.</CardFrameDescription>
				</CardFrameHeader>
				<Card>
					<CardPanel className="flex flex-col gap-4">
						<Field>
							<FieldLabel>Name</FieldLabel>
							<Input onChange={(e) => setName(e.target.value)} value={name} />
						</Field>
						<Field>
							<FieldLabel>Logo-URL</FieldLabel>
							<Input
								onChange={(e) => setLogo(e.target.value)}
								placeholder="https://…"
								value={logo}
							/>
							<FieldDescription>Optional — Link zu einem Logo-Bild.</FieldDescription>
						</Field>
					</CardPanel>
				</Card>
				<CardFrameFooter className="flex justify-end">
					<Button
						disabled={!infoChanged || name.trim() === ""}
						loading={infoMutation.isPending}
						onClick={() => infoMutation.mutate()}
						size="sm"
					>
						Speichern
					</Button>
				</CardFrameFooter>
			</CardFrame>

			<CardFrame>
				<CardFrameHeader>
					<CardFrameTitle>Slug</CardFrameTitle>
					<CardFrameDescription>
						Eindeutige Kennung deiner Organisation in URLs.
					</CardFrameDescription>
				</CardFrameHeader>
				<Card>
					<CardPanel>
						<Field>
							<FieldLabel>Slug</FieldLabel>
							<Input
								className="font-mono"
								onChange={(e) => setSlug(e.target.value)}
								value={slug}
							/>
						</Field>
					</CardPanel>
				</Card>
				<CardFrameFooter className="flex justify-end">
					<Button
						disabled={!slugChanged || slug.trim() === ""}
						loading={slugMutation.isPending}
						onClick={() => slugMutation.mutate()}
						size="sm"
					>
						Speichern
					</Button>
				</CardFrameFooter>
			</CardFrame>
		</div>
	);
}
