"use client";

import { useState } from "react";
import { authClient } from "@repo/auth/client";
import { Button } from "@/components/ui/button";
import { Frame, FramePanel, FrameFooter } from "@/components/ui/frame";
import {
	Dialog,
	DialogClose,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogPopup,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogPopup,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { toast } from "sonner";
import { Loader2, Shield, Info, Copy, Check, Download } from "lucide-react";
import QRCode from "react-qr-code";

interface TwoFactorFrameProps {
	twoFactorEnabled: boolean;
}

export function TwoFactorFrame({
	twoFactorEnabled: initialEnabled,
}: TwoFactorFrameProps) {
	const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialEnabled);
	const [enableDialogOpen, setEnableDialogOpen] = useState(false);
	const [disableDialogOpen, setDisableDialogOpen] = useState(false);
	const [backupCodesDialogOpen, setBackupCodesDialogOpen] = useState(false);
	const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);

	const [password, setPassword] = useState("");
	const [verificationCode, setVerificationCode] = useState("");
	const [totpUri, setTotpUri] = useState<string | null>(null);
	const [totpSecret, setTotpSecret] = useState<string | null>(null);
	const [backupCodes, setBackupCodes] = useState<string[]>([]);
	const [copiedCodes, setCopiedCodes] = useState(false);
	const [copiedSecret, setCopiedSecret] = useState(false);

	const [isEnabling, setIsEnabling] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [isDisabling, setIsDisabling] = useState(false);
	const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);
	const [isLoadingQr, setIsLoadingQr] = useState(false);

	const resetEnableForm = () => {
		setPassword("");
		setVerificationCode("");
		setTotpUri(null);
		setTotpSecret(null);
		setBackupCodes([]);
	};

	const resetDisableForm = () => {
		setPassword("");
	};

	const handleGetQrCode = async () => {
		if (!password.trim()) {
			toast.error("Passwort ist erforderlich");
			return;
		}

		setIsLoadingQr(true);

		try {
			const { data, error } = await authClient.twoFactor.getTotpUri({
				password,
			});

			if (error) {
				toast.error(error.message || "QR-Code konnte nicht geladen werden");
				console.error(error);
			} else if (data) {
				setTotpUri(data.totpURI);
				// Extract secret from URI (format: otpauth://totp/...?secret=XXXXX&issuer=...)
				const secretMatch = data.totpURI.match(/secret=([^&]+)/);
				if (secretMatch) {
					setTotpSecret(secretMatch[1]);
				}
				setPassword("");
			}
		} catch (error) {
			toast.error("QR-Code konnte nicht geladen werden");
			console.error(error);
		} finally {
			setIsLoadingQr(false);
		}
	};

	const handleCopySecret = async () => {
		if (totpSecret) {
			try {
				await navigator.clipboard.writeText(totpSecret);
				setCopiedSecret(true);
				toast.success("Secret key copied to clipboard");
				setTimeout(() => setCopiedSecret(false), 2000);
			} catch (error) {
				toast.error("Geheimschlüssel konnte nicht kopiert werden");
				console.error(error);
			}
		}
	};

	const handleEnableTwoFactor = async () => {
		if (!password.trim()) {
			toast.error("Passwort ist erforderlich");
			return;
		}

		setIsEnabling(true);

		try {
			const { data, error } = await authClient.twoFactor.enable({
				password,
			});

			if (error) {
				toast.error(error.message || "2FA konnte nicht aktiviert werden");
				console.error(error);
			} else if (data) {
				setTotpUri(data.totpURI);
				setBackupCodes(data.backupCodes || []);
				// Extract secret from URI for manual entry
				const secretMatch = data.totpURI.match(/secret=([^&]+)/);
				if (secretMatch) {
					setTotpSecret(secretMatch[1]);
				}
			}
		} catch (error) {
			toast.error("2FA konnte nicht aktiviert werden");
			console.error(error);
		} finally {
			setIsEnabling(false);
		}
	};

	const handleVerifyTotp = async () => {
		if (!verificationCode.trim()) {
			toast.error("Verification code is required");
			return;
		}

		if (verificationCode.length !== 6) {
			toast.error("Verification code must be 6 digits");
			return;
		}

		setIsVerifying(true);

		try {
			const { data, error } = await authClient.twoFactor.verifyTotp({
				code: verificationCode,
			});

			if (error) {
				toast.error(error.message || "Ungültiger Verifizierungscode");
				console.error(error);
			} else {
				toast.success("2FA enabled successfully!");
				setTwoFactorEnabled(true);
				setEnableDialogOpen(false);
				resetEnableForm();
			}
		} catch (error) {
			toast.error("Code konnte nicht verifiziert werden");
			console.error(error);
		} finally {
			setIsVerifying(false);
		}
	};

	const handleDisableTwoFactor = async () => {
		if (!password.trim()) {
			toast.error("Passwort ist erforderlich");
			return;
		}

		setIsDisabling(true);

		try {
			const { data, error } = await authClient.twoFactor.disable({
				password,
			});

			if (error) {
				toast.error(error.message || "2FA konnte nicht deaktiviert werden");
				console.error(error);
			} else {
				toast.success("2FA disabled successfully");
				setTwoFactorEnabled(false);
				setDisableDialogOpen(false);
				resetDisableForm();
			}
		} catch (error) {
			toast.error("2FA konnte nicht deaktiviert werden");
			console.error(error);
		} finally {
			setIsDisabling(false);
		}
	};

	const handleGenerateBackupCodes = async () => {
		if (!password.trim()) {
			toast.error("Passwort ist erforderlich");
			return;
		}

		setIsGeneratingCodes(true);

		try {
			const { data, error } = await authClient.twoFactor.generateBackupCodes({
				password,
			});

			if (error) {
				toast.error(error.message || "Backup-Codes konnten nicht erstellt werden");
				console.error(error);
			} else if (data) {
				setBackupCodes(data.backupCodes || []);
				setPassword("");
				toast.success("New backup codes generated");
			}
		} catch (error) {
			toast.error("Backup-Codes konnten nicht erstellt werden");
			console.error(error);
		} finally {
			setIsGeneratingCodes(false);
		}
	};

	const handleCopyBackupCodes = async () => {
		const codesText = backupCodes.join("\n");
		try {
			await navigator.clipboard.writeText(codesText);
			setCopiedCodes(true);
			toast.success("Backup-Codes in die Zwischenablage kopiert");
			setTimeout(() => setCopiedCodes(false), 2000);
		} catch (error) {
			toast.error("Backup-Codes konnten nicht kopiert werden");
			console.error(error);
		}
	};

	const handleDownloadBackupCodes = () => {
		const codesText = backupCodes.join("\n");
		const blob = new Blob([codesText], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "backup-codes.txt";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		toast.success("Backup-Codes heruntergeladen");
	};

	return (
		<>
			<Frame
				data-2fa-frame
				className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72"
			>
				{twoFactorEnabled ? (
					<>
						<FramePanel>
							<h2 className="font-heading text-xl mb-2 text-foreground">
								Two-Factor Authentication
							</h2>
							<p className="text-sm text-muted-foreground mb-6">
								Verwalte deine Zwei-Faktor-Authentifizierungseinstellungen.
							</p>

							<div className="space-y-4">
								<div className="flex items-center justify-between p-4 rounded-lg border">
									<div>
										<p className="text-sm font-medium">Authenticator-App</p>
										<p className="text-xs text-muted-foreground">
											Nutze deine Authenticator-App, um Verifizierungscodes zu generieren
										</p>
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setTotpUri(null);
											setQrCodeDialogOpen(true);
										}}
									>
										QR-Code anzeigen
									</Button>
								</div>

								<div className="flex items-center justify-between p-4 rounded-lg border">
									<div>
										<p className="text-sm font-medium">Backup-Codes</p>
										<p className="text-xs text-muted-foreground">
											Backup-Codes für die Kontowiederherstellung neu erzeugen
										</p>
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setBackupCodesDialogOpen(true)}
									>
										Neu erzeugen
									</Button>
								</div>
							</div>
						</FramePanel>

						<FrameFooter className="flex-row justify-end items-center">
							<AlertDialog
								open={disableDialogOpen}
								onOpenChange={setDisableDialogOpen}
							>
								<AlertDialogTrigger
									render={<Button variant="destructive" size="sm" />}
								>
									Disable 2FA
								</AlertDialogTrigger>
								<AlertDialogPopup>
									<AlertDialogHeader>
										<AlertDialogTitle>
											Disable Two-Factor Authentication
										</AlertDialogTitle>
										<AlertDialogDescription>
											Dadurch wird die zusätzliche Sicherheitsebene von deinem
											Konto. Gib dein Passwort zur Bestätigung ein.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<div className="px-6 py-4">
										<Field>
											<FieldLabel>Passwort</FieldLabel>
											<Input
												type="password"
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												placeholder="Gib dein Passwort ein"
											/>
										</Field>
									</div>
									<AlertDialogFooter>
										<AlertDialogClose
											render={<Button variant="ghost" />}
											disabled={isDisabling}
										>
											Cancel
										</AlertDialogClose>
										<Button
											variant="destructive"
											onClick={handleDisableTwoFactor}
											disabled={isDisabling}
										>
											{isDisabling ? (
												<>
													<Loader2 className="mr-2 size-4 animate-spin" />
													Disabling...
												</>
											) : (
												"Disable 2FA"
											)}
										</Button>
									</AlertDialogFooter>
								</AlertDialogPopup>
							</AlertDialog>
						</FrameFooter>

						<Dialog
							open={backupCodesDialogOpen}
							onOpenChange={setBackupCodesDialogOpen}
						>
							<DialogPopup>
								<DialogHeader>
									<DialogTitle>Backup-Codes neu erzeugen</DialogTitle>
								</DialogHeader>
								<DialogPanel className="space-y-4">
									{backupCodes.length === 0 ? (
										<>
											<p className="text-sm text-muted-foreground">
												Backup-Codes können verwendet werden, um auf dein Konto zuzugreifen, wenn du
												den Zugriff auf deine Authenticator-App verlierst. Eine Neuerzeugung wird
												replace any existing codes.
											</p>
											<Field>
												<FieldLabel>Passwort</FieldLabel>
												<Input
													type="password"
													value={password}
													onChange={(e) => setPassword(e.target.value)}
													placeholder="Gib dein Passwort ein"
												/>
											</Field>
										</>
									) : (
										<>
											<div className="space-y-2">
												<p className="text-sm font-medium">
													Save these backup codes in a safe place:
												</p>
												<div className="p-4 rounded-lg bg-muted font-mono text-sm space-y-1">
													{backupCodes.map((code, index) => (
														<div key={index}>{code}</div>
													))}
												</div>
												<p className="text-xs text-muted-foreground">
													Each code can only be used once. Keep them safe and
													secure.
												</p>
											</div>
										</>
									)}
								</DialogPanel>
								<DialogFooter>
									{backupCodes.length === 0 ? (
										<>
											<DialogClose
												render={<Button variant="ghost" />}
												disabled={isGeneratingCodes}
											>
												Cancel
											</DialogClose>
											<Button
												onClick={handleGenerateBackupCodes}
												disabled={isGeneratingCodes}
											>
												{isGeneratingCodes ? (
													<>
														<Loader2 className="mr-2 size-4 animate-spin" />
														Regenerating...
													</>
												) : (
													"Neu erzeugen Codes"
												)}
											</Button>
										</>
									) : (
										<>
											<Button variant="outline" onClick={handleCopyBackupCodes}>
												{copiedCodes ? (
													<>
														<Check className="mr-2 size-4" />
														Copied!
													</>
												) : (
													<>
														<Copy className="mr-2 size-4" />
														Copy
													</>
												)}
											</Button>
											<Button
												variant="outline"
												onClick={handleDownloadBackupCodes}
											>
												<Download className="mr-2 size-4" />
												Download
											</Button>
											<DialogClose
												render={<Button />}
												onClick={() => {
													setBackupCodes([]);
													setPassword("");
												}}
											>
												Fertig
											</DialogClose>
										</>
									)}
								</DialogFooter>
							</DialogPopup>
						</Dialog>

						<Dialog
							open={qrCodeDialogOpen}
							onOpenChange={(open) => {
								setQrCodeDialogOpen(open);
								if (!open) {
									setTotpUri(null);
									setTotpSecret(null);
									setPassword("");
									setCopiedSecret(false);
								}
							}}
						>
							<DialogPopup>
								<DialogHeader>
									<DialogTitle>
										Authenticator QR Code
										<Badge variant={"info"}>Empfohlen</Badge>
									</DialogTitle>
								</DialogHeader>
								<DialogPanel className="space-y-4">
									{!totpUri ? (
										<>
											<p className="text-sm text-muted-foreground">
												Gib dein Passwort ein, um den QR-Code für dein
												authenticator app.
											</p>
											<Field>
												<FieldLabel>Passwort</FieldLabel>
												<Input
													type="password"
													value={password}
													onChange={(e) => setPassword(e.target.value)}
													placeholder="Gib dein Passwort ein"
												/>
											</Field>
										</>
									) : (
										<>
											<div className="space-y-4">
												<div>
													<p className="text-sm font-medium mb-2">
														Scan QR Code
													</p>
													<p className="text-xs text-muted-foreground mb-4">
														Scanne diesen QR-Code mit deiner Authenticator-App.
													</p>
													<div className="flex justify-center p-4 bg-white rounded-lg">
														<QRCode value={totpUri} size={200} />
													</div>
												</div>

												{totpSecret && (
													<div>
														<p className="text-sm font-medium mb-2">
															Or enter manually
														</p>
														<p className="text-xs text-muted-foreground mb-2">
															Wenn du den QR-Code nicht scannen kannst, gib diesen geheimen
															Schlüssel manuell in deiner Authenticator-App ein:
														</p>
														<div className="flex items-center gap-2">
															<div className="flex-1 p-3 rounded-lg bg-muted font-mono text-sm overflow-x-auto whitespace-nowrap">
																{totpSecret}
															</div>
															<Button
																variant="outline"
																size="sm"
																onClick={handleCopySecret}
															>
																{copiedSecret ? (
																	<>
																		<Check className="size-4" />
																	</>
																) : (
																	<>
																		<Copy className="size-4" />
																	</>
																)}
															</Button>
														</div>
													</div>
												)}
											</div>
										</>
									)}
								</DialogPanel>
								<DialogFooter>
									{!totpUri ? (
										<>
											<DialogClose
												render={<Button variant="ghost" />}
												disabled={isLoadingQr}
											>
												Cancel
											</DialogClose>
											<Button onClick={handleGetQrCode} disabled={isLoadingQr}>
												{isLoadingQr ? (
													<>
														<Loader2 className="mr-2 size-4 animate-spin" />
														Lädt...
													</>
												) : (
													"Show QR Code"
												)}
											</Button>
										</>
									) : (
										<DialogClose render={<Button />}>Fertig</DialogClose>
									)}
								</DialogFooter>
							</DialogPopup>
						</Dialog>
					</>
				) : (
					<>
						<FramePanel>
							<Empty>
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<Shield />
									</EmptyMedia>
									<Badge variant={"info"} className="mb-2">
										Empfohlen
									</Badge>
									<EmptyTitle>Zwei-Faktor-Authentifizierung</EmptyTitle>
									<EmptyDescription>
										Füge deinem Konto mit 2FA eine zusätzliche Sicherheitsebene hinzu
									</EmptyDescription>
								</EmptyHeader>
							</Empty>
						</FramePanel>

						<FrameFooter className="flex-row justify-between items-center">
							<Tooltip>
								<TooltipTrigger
									render={
										<button
											type="button"
											className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
										/>
									}
								>
									<Info className="size-3.5" />
									<span>Was ist 2FA?</span>
								</TooltipTrigger>
								<TooltipContent className="max-w-xs">
									<p className="text-xs">
										Two-factor authentication adds an extra security step when
										bei der Anmeldung. Du musst einen Code aus deiner
										Authenticator-App zusätzlich zu deinem Passwort eingeben.
									</p>
								</TooltipContent>
							</Tooltip>

							<Dialog
								open={enableDialogOpen}
								onOpenChange={(open) => {
									setEnableDialogOpen(open);
									if (!open) resetEnableForm();
								}}
							>
								<DialogTrigger render={<Button variant="outline" size="sm" />}>
									<Shield className="mr-2 size-4" />
									Enable 2FA
								</DialogTrigger>
								<DialogPopup>
									<DialogHeader>
										<DialogTitle>Zwei-Faktor-Authentifizierung aktivieren</DialogTitle>
									</DialogHeader>
									<DialogPanel className="space-y-4">
										{!totpUri ? (
											<>
												<p className="text-sm text-muted-foreground">
													Gib dein Passwort ein, um einen QR-Code für dein
													authenticator app.
												</p>
												<Field>
													<FieldLabel>Passwort</FieldLabel>
													<Input
														type="password"
														value={password}
														onChange={(e) => setPassword(e.target.value)}
														placeholder="Gib dein Passwort ein"
													/>
												</Field>
											</>
										) : (
											<>
												<div className="space-y-4">
													<div>
														<p className="text-sm font-medium mb-2">
															Step 1: Scan QR Code
														</p>
														<div className="flex justify-center p-4 bg-white rounded-lg">
															<QRCode value={totpUri} size={200} />
														</div>
														<p className="text-xs text-muted-foreground mt-2">
															Scan this QR code with your authenticator app
															(Google Authenticator, Authy, etc.)
														</p>
													</div>

													{totpSecret && (
														<div>
															<p className="text-sm font-medium mb-2">
																Or enter manually
															</p>
															<p className="text-xs text-muted-foreground mb-2">
																Wenn du den QR-Code nicht scannen kannst, gib diesen geheimen
																key manually:
															</p>
															<div className="flex items-center gap-2">
																<div className="flex-1 p-3 rounded-lg bg-muted font-mono text-xs overflow-x-auto whitespace-nowrap">
																	{totpSecret}
																</div>
																<Button
																	variant="outline"
																	size="sm"
																	onClick={handleCopySecret}
																>
																	{copiedSecret ? (
																		<>
																			<Check className="size-4" />
																		</>
																	) : (
																		<>
																			<Copy className="size-4" />
																		</>
																	)}
																</Button>
															</div>
														</div>
													)}

													{backupCodes.length > 0 && (
														<div className="rounded-lg border p-4 bg-muted/50">
															<div className="flex items-center justify-between mb-3">
																<p className="text-sm font-medium">
																	Backup Codes
																</p>
																<div className="flex gap-2">
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={handleCopyBackupCodes}
																	>
																		{copiedCodes ? (
																			<>
																				<Check className="mr-2 size-3" />
																				Copied
																			</>
																		) : (
																			<>
																				<Copy className="mr-2 size-3" />
																				Copy
																			</>
																		)}
																	</Button>
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={handleDownloadBackupCodes}
																	>
																		<Download className="mr-2 size-3" />
																		Download
																	</Button>
																</div>
															</div>
															<div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-background font-mono text-xs">
																{backupCodes.map((code, index) => (
																	<div key={index} className="text-center py-1">
																		{code}
																	</div>
																))}
															</div>
															<p className="text-xs text-muted-foreground mt-3">
																Save these backup codes securely. Each code can
																only be used once for account recovery.
															</p>
														</div>
													)}

													<div>
														<p className="text-sm font-medium mb-2">
															Step 2: Enter Verification Code
														</p>
														<Field>
															<FieldLabel>6-stelliger Code</FieldLabel>
															<InputOTP
																maxLength={6}
																value={verificationCode}
																onChange={(value) => setVerificationCode(value)}
															>
																<InputOTPGroup>
																	<InputOTPSlot index={0} />
																	<InputOTPSlot index={1} />
																	<InputOTPSlot index={2} />
																	<InputOTPSlot index={3} />
																	<InputOTPSlot index={4} />
																	<InputOTPSlot index={5} />
																</InputOTPGroup>
															</InputOTP>
														</Field>
													</div>
												</div>
											</>
										)}
									</DialogPanel>
									<DialogFooter>
										{!totpUri ? (
											<>
												<DialogClose
													render={<Button variant="ghost" />}
													disabled={isEnabling}
												>
													Cancel
												</DialogClose>
												<Button
													onClick={handleEnableTwoFactor}
													disabled={isEnabling}
												>
													{isEnabling ? (
														<>
															<Loader2 className="mr-2 size-4 animate-spin" />
															Generating...
														</>
													) : (
														"Weiter"
													)}
												</Button>
											</>
										) : (
											<>
												<DialogClose
													render={<Button variant="ghost" />}
													disabled={isVerifying}
												>
													Cancel
												</DialogClose>
												<Button
													onClick={handleVerifyTotp}
													disabled={
														isVerifying || verificationCode.length !== 6
													}
												>
													{isVerifying ? (
														<>
															<Loader2 className="mr-2 size-4 animate-spin" />
															Verifying...
														</>
													) : (
														"Verifizieren & aktivieren"
													)}
												</Button>
											</>
										)}
									</DialogFooter>
								</DialogPopup>
							</Dialog>
						</FrameFooter>
					</>
				)}
			</Frame>
		</>
	);
}
