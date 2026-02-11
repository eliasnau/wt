"use client";

import { CopyIcon, ExternalLinkIcon, QrCodeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetPopup,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetPanel,
	SheetFooter,
} from "@/components/ui/sheet";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateRegistrationCode() {
	return Array.from({ length: 8 })
		.map(() => CHARSET.charAt(Math.floor(Math.random() * CHARSET.length)))
		.join("");
}

interface GenerateQRSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function GenerateQRSheet({ open, onOpenChange }: GenerateQRSheetProps) {
	const [isMobile, setIsMobile] = useState(false);
	const [registrationCode, setRegistrationCode] = useState(() =>
		generateRegistrationCode(),
	);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 640);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	useEffect(() => {
		if (open) {
			setRegistrationCode(generateRegistrationCode());
		}
	}, [open]);

	const registrationUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/register-membership?code=${registrationCode}`;

	const handleCopyUrl = async () => {
		try {
			await navigator.clipboard.writeText(registrationUrl);
			toast.success("Registration link copied");
		} catch (error) {
			console.error("Registrierungslink konnte nicht kopiert werden", error);
			toast.error("Registrierungslink konnte nicht kopiert werden");
		}
	};

	const handleOpenInNewTab = () => {
		window.open(registrationUrl, "_blank");
	};

	const handleRevokeCode = () => {
		setRegistrationCode(generateRegistrationCode());
		onOpenChange(false);
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetPopup inset side={isMobile ? "bottom" : "right"}>
				<SheetHeader>
					<SheetTitle>Mitgliederregistrierung</SheetTitle>
					<SheetDescription>
						Share this with the new member to complete their registration.
					</SheetDescription>
				</SheetHeader>
				<SheetPanel>
					<div className="space-y-8">
						<div className="flex flex-col items-center gap-4">
							<div className="flex size-64 items-center justify-center rounded-lg border-2 border-dashed bg-muted">
								<QrCodeIcon className="size-32 text-muted-foreground" />
							</div>
							<p className="text-center text-muted-foreground text-sm">
								Scan this QR code to register
							</p>
						</div>

						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-2 text-muted-foreground">
									Or
								</span>
							</div>
						</div>

						<div className="space-y-6">
							<div className="text-center space-y-2">
								<p className="text-base">Visit</p>
								<p className="font-semibold text-foreground text-lg">
									{typeof window !== "undefined" ? window.location.origin : ""}
									/register-membership
								</p>
								<p className="text-base">und gib diesen Code ein</p>
							</div>

							<div className="flex items-center justify-center gap-2">
								{registrationCode.split("").map((digit, index) => (
									<div
										key={index}
										className="flex size-14 items-center justify-center rounded-lg border-2 bg-muted font-mono text-2xl font-bold"
									>
										{digit}
									</div>
								))}
							</div>

							<div className="flex gap-2 pt-2">
								<Button
									variant="outline"
									className="flex-1"
									onClick={handleOpenInNewTab}
								>
									<ExternalLinkIcon />
									Open in New Tab
								</Button>
								<Button
									variant="outline"
									className="flex-1"
									onClick={handleCopyUrl}
								>
									<CopyIcon />
									Copy Link
								</Button>
							</div>
						</div>
					</div>
				</SheetPanel>
				<SheetFooter className="justify-between max-sm:hidden">
					<Button variant="destructive" onClick={handleRevokeCode}>
						Revoke Code
					</Button>
					<Button onClick={() => onOpenChange(false)}>Schließen</Button>
				</SheetFooter>
			</SheetPopup>
		</Sheet>
	);
}
