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
			toast.error("Password is required");
			return;
		}

		setIsLoadingQr(true);

		try {
			const { data, error } = await authClient.twoFactor.getTotpUri({
				password,
			});

			if (error) {
				toast.error(error.message || "Failed to get QR code");
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
			toast.error("Failed to get QR code");
			console.error(error);
		} finally {
			setIsLoadingQr(false);
		}
	};

	const handleCopySecret = () => {
		if (totpSecret) {
			navigator.clipboard.writeText(totpSecret);
			setCopiedSecret(true);
			toast.success("Secret key copied to clipboard");
			setTimeout(() => setCopiedSecret(false), 2000);
		}
	};

	const handleEnableTwoFactor = async () => {
		if (!password.trim()) {
			toast.error("Password is required");
			return;
		}

		setIsEnabling(true);

		try {
			const { data, error } = await authClient.twoFactor.enable({
				password,
			});

			if (error) {
				toast.error(error.message || "Failed to enable 2FA");
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
			toast.error("Failed to enable 2FA");
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
				toast.error(error.message || "Invalid verification code");
				console.error(error);
			} else {
				toast.success("2FA enabled successfully!");
				setTwoFactorEnabled(true);
				setEnableDialogOpen(false);
				resetEnableForm();
			}
		} catch (error) {
			toast.error("Failed to verify code");
			console.error(error);
		} finally {
			setIsVerifying(false);
		}
	};

	const handleDisableTwoFactor = async () => {
		if (!password.trim()) {
			toast.error("Password is required");
			return;
		}

		setIsDisabling(true);

		try {
			const { data, error } = await authClient.twoFactor.disable({
				password,
			});

			if (error) {
				toast.error(error.message || "Failed to disable 2FA");
				console.error(error);
			} else {
				toast.success("2FA disabled successfully");
				setTwoFactorEnabled(false);
				setDisableDialogOpen(false);
				resetDisableForm();
			}
		} catch (error) {
			toast.error("Failed to disable 2FA");
			console.error(error);
		} finally {
			setIsDisabling(false);
		}
	};

	const handleGenerateBackupCodes = async () => {
		if (!password.trim()) {
			toast.error("Password is required");
			return;
		}

		setIsGeneratingCodes(true);

		try {
			const { data, error } = await authClient.twoFactor.generateBackupCodes({
				password,
			});

			if (error) {
				toast.error(error.message || "Failed to generate backup codes");
				console.error(error);
			} else if (data) {
				setBackupCodes(data.backupCodes || []);
				setPassword("");
				toast.success("New backup codes generated");
			}
		} catch (error) {
			toast.error("Failed to generate backup codes");
			console.error(error);
		} finally {
			setIsGeneratingCodes(false);
		}
	};

	const handleCopyBackupCodes = () => {
		const codesText = backupCodes.join("\n");
		navigator.clipboard.writeText(codesText);
		setCopiedCodes(true);
		toast.success("Backup codes copied to clipboard");
		setTimeout(() => setCopiedCodes(false), 2000);
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
		toast.success("Backup codes downloaded");
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
								Manage your two-factor authentication settings.
							</p>

							<div className="space-y-4">
								<div className="flex items-center justify-between p-4 rounded-lg border">
									<div>
										<p className="text-sm font-medium">Authenticator App</p>
										<p className="text-xs text-muted-foreground">
											Use your authenticator app to generate verification codes
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
										View QR Code
									</Button>
								</div>

								<div className="flex items-center justify-between p-4 rounded-lg border">
									<div>
										<p className="text-sm font-medium">Backup Codes</p>
										<p className="text-xs text-muted-foreground">
											Regenerate backup codes for account recovery
										</p>
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setBackupCodesDialogOpen(true)}
									>
										Regenerate
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
											This will remove the extra layer of security from your
											account. Enter your password to confirm.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<div className="px-6 py-4">
										<Field>
											<FieldLabel>Password</FieldLabel>
											<Input
												type="password"
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												placeholder="Enter your password"
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
									<DialogTitle>Regenerate Backup Codes</DialogTitle>
								</DialogHeader>
								<DialogPanel className="space-y-4">
									{backupCodes.length === 0 ? (
										<>
											<p className="text-sm text-muted-foreground">
												Backup codes can be used to access your account if you
												lose access to your authenticator app. Regenerating will
												replace any existing codes.
											</p>
											<Field>
												<FieldLabel>Password</FieldLabel>
												<Input
													type="password"
													value={password}
													onChange={(e) => setPassword(e.target.value)}
													placeholder="Enter your password"
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
													"Regenerate Codes"
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
												Done
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
										<Badge variant={"info"}>Recommended</Badge>
									</DialogTitle>
								</DialogHeader>
								<DialogPanel className="space-y-4">
									{!totpUri ? (
										<>
											<p className="text-sm text-muted-foreground">
												Enter your password to view the QR code for your
												authenticator app.
											</p>
											<Field>
												<FieldLabel>Password</FieldLabel>
												<Input
													type="password"
													value={password}
													onChange={(e) => setPassword(e.target.value)}
													placeholder="Enter your password"
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
														Scan this QR code with your authenticator app.
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
															If you can't scan the QR code, enter this secret
															key manually in your authenticator app:
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
														Loading...
													</>
												) : (
													"Show QR Code"
												)}
											</Button>
										</>
									) : (
										<DialogClose render={<Button />}>Done</DialogClose>
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
										Recommended
									</Badge>
									<EmptyTitle>Two-Factor Authentication</EmptyTitle>
									<EmptyDescription>
										Add an extra layer of security to your account with 2FA
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
									<span>What is 2FA?</span>
								</TooltipTrigger>
								<TooltipContent className="max-w-xs">
									<p className="text-xs">
										Two-factor authentication adds an extra security step when
										signing in. You'll need to provide a code from your
										authenticator app in addition to your password.
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
										<DialogTitle>Enable Two-Factor Authentication</DialogTitle>
									</DialogHeader>
									<DialogPanel className="space-y-4">
										{!totpUri ? (
											<>
												<p className="text-sm text-muted-foreground">
													Enter your password to generate a QR code for your
													authenticator app.
												</p>
												<Field>
													<FieldLabel>Password</FieldLabel>
													<Input
														type="password"
														value={password}
														onChange={(e) => setPassword(e.target.value)}
														placeholder="Enter your password"
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
																If you can't scan the QR code, enter this secret
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
															<FieldLabel>6-digit code</FieldLabel>
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
														"Continue"
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
														"Verify & Enable"
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
