"use client";

import { authClient } from "@repo/auth/client";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../../_components/page-header";

export default function CustomizationPage() {
	const { session } = useAuth();
	const [isSaving, setIsSaving] = useState(false);

	if (!session?.user) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const hideSensitiveInformatoin = Boolean(
		session.user.hideSensitiveInformatoin,
	);

	const handleChange = async (checked: boolean) => {
		setIsSaving(true);

		try {
			await authClient.updateUser(
				{ hideSensitiveInformatoin: checked },
				{
					onSuccess: () => {
						toast.success("Einstellung gespeichert");
					},
					onError: (context) => {
						toast.error(
							context.error.message ||
								"Einstellung konnte nicht gespeichert werden",
						);
					},
				},
			);
			setIsSaving(false);
		} catch {
			setIsSaving(false);
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<Header>
				<HeaderContent>
					<HeaderTitle>Customization</HeaderTitle>
					<HeaderDescription>
						Steuere, wie sensible Informationen in der Oberfläche angezeigt
						werden.
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions />
			</Header>

			<Frame>
				<FramePanel className="flex items-center justify-between gap-4">
					<div>
						<h2 className="font-heading text-foreground text-lg">
							Sensitive Daten ausblenden
						</h2>
						<p className="text-muted-foreground text-sm">
							Blendet Name und E-Mail in der Navigation und im Account-Profil
							aus.
						</p>
					</div>
					<Switch
						checked={hideSensitiveInformatoin}
						disabled={isSaving}
						onCheckedChange={handleChange}
						aria-label="Sensitive Daten ausblenden"
					/>
				</FramePanel>
			</Frame>
		</div>
	);
}
