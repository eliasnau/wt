"use client";

import { APIError, authClient } from "@repo/auth/client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardFrame,
	CardFrameDescription,
	CardFrameHeader,
	CardFrameTitle,
	CardPanel,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface OrganizationInfoFrameProps {
	organizationId: string;
	initialName: string;
}

export function OrganizationInfoFrame({
	organizationId,
	initialName,
}: OrganizationInfoFrameProps) {
	const [orgName, setOrgName] = useState(initialName);
	const [isUpdating, setIsUpdating] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!orgName.trim()) {
			toast.error("Organisationsname darf nicht leer sein");
			return;
		}

		if (orgName.trim() === initialName) {
			return;
		}

		setIsUpdating(true);

		try {
			const { error } = await authClient.organization.update({
				data: {
					name: orgName,
				},
				organizationId,
			});

			if (error) {
				let errorMessage = "Organisationsname konnte nicht aktualisiert werden";
				if (error.message) {
					errorMessage = error.message;
				}
				toast.error(errorMessage);
				setIsUpdating(false);
				return;
			}
			router.refresh();
			setIsUpdating(false);
		} catch (error) {
			if (error instanceof APIError) {
				toast.error(error.message);
			} else {
				toast.error("Etwas ist schiefgelaufen");
			}
			console.error(error);
			setIsUpdating(false);
		}
	};

	const handleReset = () => {
		setOrgName(initialName);
	};

	return (
		<CardFrame>
			<CardFrameHeader>
				<CardFrameTitle>Organization Information</CardFrameTitle>
				<CardFrameDescription>
					Aktualisiere die Details deiner Organisation und öffentliche
					Informationen
				</CardFrameDescription>
			</CardFrameHeader>
			<Card>
				<CardPanel>
					<form id="org-info-form" onSubmit={handleSubmit} className="space-y-4">
						<Field>
							<FieldLabel>Organisationsname</FieldLabel>
							<Input
								placeholder="Acme Inc."
								value={orgName}
								onChange={(e) => setOrgName(e.target.value)}
								disabled={isUpdating}
							/>
						</Field>
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								onClick={handleReset}
								variant="ghost"
								disabled={isUpdating}
							>
								Reset
							</Button>
							<Button
								type="submit"
								disabled={isUpdating || orgName.trim() === initialName}
							>
								{isUpdating ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Saving...
									</>
								) : (
									"Änderungen speichern"
								)}
							</Button>
						</div>
					</form>
				</CardPanel>
			</Card>
		</CardFrame>
	);
}
