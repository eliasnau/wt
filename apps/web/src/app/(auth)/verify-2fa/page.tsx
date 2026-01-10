"use client";

import { Button } from "@/components/ui/button";
import { Frame, FramePanel, FrameFooter } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { useState } from "react";
import { Loader2, ArrowLeft, Shield, ChevronRight } from "lucide-react";
import { authClient } from "@repo/auth/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Route } from "next";
import { useQueryState } from "nuqs";
import { Key } from "@/components/animate-ui/icons/key";
import { Binary } from "@/components/animate-ui/icons/binary";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";

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
			toast.error(error.message || "Invalid verification code");
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
			toast.error(error.message || "Invalid backup code");
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
				return "Enter backup code";
			default:
				return "Enter verification code";
		}
	};

	const getDescription = () => {
		switch (method) {
			case "totp":
				return "Enter the 6-digit code from your authenticator app to continue.";
			case "backup":
				return "Enter one of your backup codes to access your account.";
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
							className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							<ArrowLeft className="h-4 w-4" />
							Back
						</button>
					</div>
					<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
						<FramePanel>
							<div className="mb-6">
								<h1 className="font-heading text-2xl">
									Choose Verification Method
								</h1>
							</div>

							<div className="space-y-0 border border-border rounded-lg overflow-hidden">
								<AnimateIcon animateOnHover asChild>
									<button
										type="button"
										onClick={() => handleMethodSelect("totp")}
										className="w-full px-4 py-4 flex items-center gap-3 hover:bg-accent transition-colors border-b border-border"
									>
										<Key className="h-5 w-5 flex-shrink-0" />
										<span className="flex-1 text-left font-normal">
											Authenticator App
										</span>
										<ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
									</button>
								</AnimateIcon>

								<AnimateIcon animateOnHover asChild>
									<button
										type="button"
										onClick={() => handleMethodSelect("backup")}
										className="w-full px-4 py-4 flex items-center gap-3 hover:bg-accent transition-colors"
									>
										<Binary className="h-5 w-5 flex-shrink-0" />
										<span className="flex-1 text-left font-normal">
											Backup Code
										</span>
										<ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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
						className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Sign In
					</Link>
				</div>
				<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel>
						<div className="flex items-center gap-2 mb-4">
							<Shield className="h-6 w-6 text-primary" />
							<h1 className="font-heading text-2xl">
								Two-Factor Authentication
							</h1>
						</div>

						<p className="text-sm text-muted-foreground mb-6">
							{getDescription()}
						</p>

						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="code">
									{method === "backup" ? "Backup Code" : "Verification Code"}
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
									"Verify"
								)}
							</Button>
						</form>
					</FramePanel>

					<FrameFooter className="flex-row items-center justify-center">
						<p className="text-sm text-muted-foreground">
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
