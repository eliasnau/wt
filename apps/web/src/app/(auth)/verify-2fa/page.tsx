"use client";

import { authClient } from "@repo/auth/client";
import { ArrowLeft, ChevronRight, Loader2, Shield } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { Binary } from "@/components/animate-ui/icons/binary";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Key } from "@/components/animate-ui/icons/key";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

type VerificationMethod = "totp" | "backup";
type View = "verify" | "method-selection";

export default function Verify2FA() {
	const [code, setCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [trustDevice, setTrustDevice] = useState(false);
	const [method, setMethod] = useState<VerificationMethod>("totp");
	const [view, setView] = useState<View>("verify");
	const router = useRouter();
	const [redirectUrl] = useQueryState("redirectUrl", {
		defaultValue: "/dashboard",
	});

	const handleVerifyTOTP = async () => {
		setLoading(true);
		const { data, error } = await authClient.twoFactor.verifyTotp({
			code,
			trustDevice,
		});

		setLoading(false);

		if (error) {
			toast.error(error.message || "Ungültiger Verifizierungscode");
			return;
		}

		if (data) {
			router.push(redirectUrl as Route);
		}
	};

	const handleVerifyBackupCode = async () => {
		setLoading(true);
		const { data, error } = await authClient.twoFactor.verifyBackupCode({
			code,
			trustDevice,
		});

		setLoading(false);

		if (error) {
			toast.error(error.message || "Ungültiger Backup-Code");
			return;
		}

		if (data) {
			router.push(redirectUrl as Route);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (method === "totp") {
			await handleVerifyTOTP();
		} else if (method === "backup") {
			await handleVerifyBackupCode();
		}
	};

	const getInputPlaceholder = () => {
		switch (method) {
			case "totp":
				return "Enter 6-digit code from authenticator app";
			case "backup":
				return "Backup-Code eingeben";
			default:
				return "Enter verification code";
		}
	};

	const getDescription = () => {
		switch (method) {
			case "totp":
				return "Gib den 6-stelligen Code aus deiner Authenticator-App ein, um fortzufahren.";
			case "backup":
				return "Gib einen deiner Backup-Codes ein, um auf dein Konto zuzugreifen.";
			default:
				return "";
		}
	};

	const handleMethodSelect = (selectedMethod: VerificationMethod) => {
		setMethod(selectedMethod);
		setCode("");
		setView("verify");
	};

	if (view === "method-selection") {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<div className="w-full max-w-md">
					<div className="mb-4">
						<button
							onClick={() => setView("verify")}
							className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
						>
							<ArrowLeft className="h-4 w-4" />
							Back
						</button>
					</div>
					<Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
						<FramePanel>
							<div className="mb-6">
								<h1 className="font-heading text-2xl">
									Choose Verification Method
								</h1>
							</div>

							<div className="space-y-0 overflow-hidden rounded-lg border border-border">
								<AnimateIcon animateOnHover asChild>
									<button
										type="button"
										onClick={() => handleMethodSelect("totp")}
										className="flex w-full items-center gap-3 border-border border-b px-4 py-4 transition-colors hover:bg-accent"
									>
										<Key className="h-5 w-5 flex-shrink-0" />
										<span className="flex-1 text-left font-normal">
											Authenticator App
										</span>
										<ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
									</button>
								</AnimateIcon>

								<AnimateIcon animateOnHover asChild>
									<button
										type="button"
										onClick={() => handleMethodSelect("backup")}
										className="flex w-full items-center gap-3 px-4 py-4 transition-colors hover:bg-accent"
									>
										<Binary className="h-5 w-5 flex-shrink-0" />
										<span className="flex-1 text-left font-normal">
											Backup Code
										</span>
										<ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
									</button>
								</AnimateIcon>
							</div>
						</FramePanel>
					</Frame>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="mb-4">
					<Link
						href={"/sign-in" as Route}
						className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
					>
						<ArrowLeft className="h-4 w-4" />
						Zurück zur Anmeldung
					</Link>
				</div>
				<Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel>
						<div className="mb-4 flex items-center gap-2">
							<Shield className="h-6 w-6 text-primary" />
							<h1 className="font-heading text-2xl">
								Two-Factor Authentication
							</h1>
						</div>

						<p className="mb-6 text-muted-foreground text-sm">
							{getDescription()}
						</p>

						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="code">
									{method === "backup" ? "Backup-Code" : "Verification Code"}
								</Label>
								{method === "totp" ? (
									<div className="flex justify-center py-2">
										<InputOTP
											maxLength={6}
											value={code}
											onChange={(value) => setCode(value)}
										>
											<InputOTPGroup>
												<InputOTPSlot index={0} className="size-12 text-lg" />
												<InputOTPSlot index={1} className="size-12 text-lg" />
												<InputOTPSlot index={2} className="size-12 text-lg" />
												<InputOTPSlot index={3} className="size-12 text-lg" />
												<InputOTPSlot index={4} className="size-12 text-lg" />
												<InputOTPSlot index={5} className="size-12 text-lg" />
											</InputOTPGroup>
										</InputOTP>
									</div>
								) : (
									<Input
										id="code"
										type="text"
										placeholder={getInputPlaceholder()}
										required
										onChange={(e) => setCode(e.target.value)}
										value={code}
										autoComplete="off"
									/>
								)}
							</div>

							<div className="flex items-center gap-2">
								<Checkbox
									id="trust"
									checked={trustDevice}
									onCheckedChange={(checked) =>
										setTrustDevice(checked as boolean)
									}
								/>
								<Label htmlFor="trust" className="text-sm">
									Trust this device for 30 days
								</Label>
							</div>

							<Button type="submit" className="w-full" disabled={loading}>
								{loading ? (
									<Loader2 size={16} className="animate-spin" />
								) : (
									"Verifizieren"
								)}
							</Button>
						</form>
					</FramePanel>

					<FrameFooter className="flex-row items-center justify-center">
						<p className="text-muted-foreground text-sm">
							<button
								type="button"
								onClick={() => setView("method-selection")}
								className="text-foreground hover:underline"
							>
								Use a different method
							</button>
						</p>
					</FrameFooter>
				</Frame>
			</div>
		</div>
	);
}
