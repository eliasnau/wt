"use client";

import { authClient } from "@repo/auth/client";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Frame, FramePanel } from "@/components/ui/frame";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
	const { setTheme, theme } = useTheme();
	const [isSaving, setIsSaving] = useState(false);
	const themeOptions = [
		{ value: "light", label: "Hell" },
		{ value: "dark", label: "Dunkel" },
		{ value: "system", label: "System" },
	] as const;

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
	type AuthCallbackContext = { error: { message?: string } };
	const selectedTheme = theme ?? "system";

	const handleChange = async (checked: boolean) => {
		setIsSaving(true);

		try {
			await authClient.updateUser(
				{ hideSensitiveInformatoin: checked },
				{
					onSuccess: () => {
						toast.success("Einstellung gespeichert");
					},
					onError: (context: AuthCallbackContext) => {
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

			<Frame stackedPanels>
				<FramePanel className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="font-heading text-foreground text-lg">Design</h2>
						<p className="text-muted-foreground text-sm">
							Wähle zwischen hellem, dunklem oder dem System-Design.
						</p>
					</div>
						<Select
							items={themeOptions}
							value={selectedTheme}
							onValueChange={(value) =>
								setTheme(value as (typeof themeOptions)[number]["value"])
							}
						>
						<SelectTrigger
							className="w-full sm:w-44"
							aria-label="Theme auswählen"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{themeOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</FramePanel>

				<FramePanel className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
