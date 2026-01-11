"use client";

import { APIError, authClient } from "@repo/auth/client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
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
			toast.error("Organization name cannot be empty");
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
				toast.error(error.message || "Failed to update organization name");
				return;
			}
			router.refresh();
		} catch (error) {
			if (error instanceof APIError) {
				toast.error(error.message);
			} else {
				toast.error("Something went wrong");
			}
			console.error(error);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleReset = () => {
		setOrgName(initialName);
	};

	return (
		<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
			<FramePanel>
				<h2 className="mb-2 font-heading text-foreground text-xl">
					Organization Information
				</h2>
				<p className="mb-6 text-muted-foreground text-sm">
					Update your organization details and public information
				</p>
				<form id="org-info-form" onSubmit={handleSubmit} className="space-y-4">
					<Field>
						<FieldLabel>Organization Name</FieldLabel>
						<Input
							placeholder="Acme Inc."
							value={orgName}
							onChange={(e) => setOrgName(e.target.value)}
							disabled={isUpdating}
						/>
					</Field>
				</form>
			</FramePanel>
			<FrameFooter className="flex-row justify-end gap-2">
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
					form="org-info-form"
					disabled={isUpdating || orgName.trim() === initialName}
				>
					{isUpdating ? (
						<>
							<Loader2 className="mr-2 size-4 animate-spin" />
							Saving...
						</>
					) : (
						"Save Changes"
					)}
				</Button>
			</FrameFooter>
		</Frame>
	);
}
