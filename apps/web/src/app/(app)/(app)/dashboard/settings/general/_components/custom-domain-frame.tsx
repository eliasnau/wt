"use client";

import {
	AlertCircle,
	CheckCircle2,
	Globe,
	Loader2,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type DNSRecord, DNSTable } from "@/components/dns-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogPopup,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { client } from "@/utils/orpc";

export function CustomDomainFrame() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [domain, setDomain] = useState("");
	const [isAdding, setIsAdding] = useState(false);
	const [isRemoving, setIsRemoving] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [verificationRequired, setVerificationRequired] = useState(false);
	const [currentDomain, setCurrentDomain] = useState<string | null>(null);
	const [isVerified, setIsVerified] = useState(false);
	const [verificationRecords, setVerificationRecords] = useState<DNSRecord[]>(
		[],
	);
	const router = useRouter();

	// Fetch current domain status on mount
	useEffect(() => {
		const fetchDomainStatus = async () => {
			try {
				const status = await client.organizations.getDomainStatus();
				setCurrentDomain(status.domain);
				let verified = false;
				if (status.verified) {
					verified = true;
				}
				setIsVerified(verified);
				let verificationReq = false;
				if (status.verificationRequired) {
					verificationReq = true;
				}
				setVerificationRequired(verificationReq);

				// Convert dnsRecordsToSet to DNSRecord format
				if (status.dnsRecordsToSet) {
					const record: DNSRecord = {
						type: status.dnsRecordsToSet.type,
						name: status.dnsRecordsToSet.name,
						value: status.dnsRecordsToSet.value,
					};
					setVerificationRecords([record]);
				} else {
					setVerificationRecords([]);
				}
				setIsLoading(false);
			} catch (error) {
				console.error("Domain-Status konnte nicht abgerufen werden:", error);
				setIsLoading(false);
			}
		};

		fetchDomainStatus();
	}, []);

	const handleOpenDialog = () => {
		setDomain("");
		setDialogOpen(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!domain.trim()) {
			toast.error("Domain darf nicht leer sein");
			return;
		}

		const domainRegex = /^[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
		if (!domainRegex.test(domain.trim())) {
			toast.error(
				"Bitte gib eine gültige Domain ein (z. B. members.example.com)",
			);
			return;
		}

		setIsAdding(true);

		try {
			const result = await client.organizations.addDomain({
				domain: domain.trim().toLowerCase(),
			});

			setCurrentDomain(result.domain);
			setIsVerified(result.verified);
			setVerificationRequired(result.verificationRequired);

			if (result.dnsRecordsToSet) {
				const record: DNSRecord = {
					type: result.dnsRecordsToSet.type,
					name: result.dnsRecordsToSet.name,
					value: result.dnsRecordsToSet.value,
				};
				setVerificationRecords([record]);
			} else {
				setVerificationRecords([]);
			}

			if (result.verified) {
				toast.success("Domain erfolgreich hinzugefügt und verifiziert!");
			} else {
				let statusMessage =
					"Domain hinzugefügt! Bitte konfiguriere deine DNS-Einstellungen.";
				if (result.status === "Pending Verification") {
					statusMessage =
						"Domain hinzugefügt! Bitte verifiziere den Besitz, indem du den erforderlichen DNS-Eintrag hinzufügst.";
				}
				toast.warning(statusMessage);
			}

			setDialogOpen(false);
			router.refresh();
			setIsAdding(false);
		} catch (error: any) {
			let errorMessage = "Domain konnte nicht hinzugefügt werden";
			if (error && error.message) {
				errorMessage = error.message;
			}
			toast.error(errorMessage);
			console.error(error);
			setIsAdding(false);
		}
	};

	const handleRemoveDomain = async () => {
		if (
			!confirm(
				"Möchtest du diese benutzerdefinierte Domain wirklich entfernen?",
			)
		) {
			return;
		}

		setIsRemoving(true);

		try {
			await client.organizations.removeDomain();

			toast.success("Domain erfolgreich entfernt!");
			setCurrentDomain(null);
			setIsVerified(false);
			setVerificationRequired(false);
			setVerificationRecords([]);
			router.refresh();
			setIsRemoving(false);
		} catch (error: any) {
			let errorMessage = "Domain konnte nicht entfernt werden";
			if (error && error.message) {
				errorMessage = error.message;
			}
			toast.error(errorMessage);
			console.error(error);
			setIsRemoving(false);
		}
	};

	// Use the verification records from state
	const dnsRecords: DNSRecord[] = verificationRecords;

	if (isLoading) {
		return (
			<Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
				<FramePanel className="flex items-center justify-center py-8">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</FramePanel>
			</Frame>
		);
	}

	return (
		<>
			<Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
				<FramePanel>
					{!currentDomain ? (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<Globe />
								</EmptyMedia>
								<EmptyTitle>
									Keine benutzerdefinierte Domain konfiguriert
								</EmptyTitle>
								<EmptyDescription>
									You haven't set up a custom domain yet. Add one to use your
									own domain for your organization's member area.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						<div className="space-y-4">
							<div className="flex items-start justify-between">
								<div>
									<h2 className="mb-2 font-heading text-foreground text-xl">
										Custom Domain
									</h2>
									<p className="mb-4 text-muted-foreground text-sm">
										Your organization is accessible via this custom domain
									</p>
								</div>
								<Badge
									variant={isVerified ? "default" : "secondary"}
									className="flex items-center gap-1"
								>
									{isVerified ? (
										<>
											<CheckCircle2 className="h-3 w-3" />
											Verified
										</>
									) : (
										<>
											<AlertCircle className="h-3 w-3" />
											Pending
										</>
									)}
								</Badge>
							</div>

							<div className="rounded-lg border bg-muted/50 p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium text-sm">Domain</p>
										<p className="font-mono text-muted-foreground text-sm">
											{currentDomain}
										</p>
									</div>
								</div>
							</div>

							{verificationRequired && !isVerified && (
								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertTitle>DNS Configuration Required</AlertTitle>
									<AlertDescription className="mt-2 space-y-3">
										<p className="text-sm">
											To verify domain ownership, add the following DNS record
											to your domain provider:
										</p>
										<DNSTable records={dnsRecords} />
										<p className="text-muted-foreground text-xs">
											DNS changes can take up to 48 hours to propagate. The
											domain will be automatically verified once the records are
											detected.
										</p>
									</AlertDescription>
								</Alert>
							)}

							{isVerified && (
								<Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
									<CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
									<AlertTitle className="text-green-900 dark:text-green-100">
										Domain Verified
									</AlertTitle>
									<AlertDescription className="text-green-800 dark:text-green-200">
										Your custom domain is properly configured and verified. SSL
										certificate has been automatically issued.
									</AlertDescription>
								</Alert>
							)}
						</div>
					)}
				</FramePanel>
				<FrameFooter className="flex-row justify-end gap-2">
					{currentDomain ? (
						<Button
							variant="destructive"
							size="sm"
							onClick={handleRemoveDomain}
							disabled={isRemoving}
						>
							{isRemoving ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Removing...
								</>
							) : (
								<>
									<Trash2 className="mr-2 h-4 w-4" />
									Remove Domain
								</>
							)}
						</Button>
					) : (
						<Button variant="outline" size="sm" onClick={handleOpenDialog}>
							Add Domain
						</Button>
					)}
				</FrameFooter>
			</Frame>

			{/* Add Domain Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogPopup>
					<DialogHeader>
						<DialogTitle>Benutzerdefinierte Domain hinzufügen</DialogTitle>
						<DialogDescription>
							Enter the domain you want to use for your organization
						</DialogDescription>
					</DialogHeader>
					<form className="contents" onSubmit={handleSubmit}>
						<DialogPanel>
							<Field>
								<FieldLabel>Domainname</FieldLabel>
								<Input
									value={domain}
									onChange={(e) =>
										setDomain(e.target.value.toLowerCase().trim())
									}
									placeholder="members.example.com"
									autoFocus
									disabled={isAdding}
									type="text"
								/>
								<p className="mt-2 text-muted-foreground text-xs">
									Enter your full domain (e.g., members.example.com or
									portal.yourdomain.com)
								</p>
							</Field>
						</DialogPanel>
						<DialogFooter>
							<DialogClose
								render={<Button variant="ghost" />}
								disabled={isAdding}
							>
								Cancel
							</DialogClose>
							<Button type="submit" disabled={isAdding || !domain.trim()}>
								{isAdding ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Adding...
									</>
								) : (
									"Domain hinzufügen"
								)}
							</Button>
						</DialogFooter>
					</form>
				</DialogPopup>
			</Dialog>
		</>
	);
}
