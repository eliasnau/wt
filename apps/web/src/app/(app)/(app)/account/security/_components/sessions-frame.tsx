"use client";

import { APIError, authClient } from "@repo/auth/client";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Laptop, Loader2 } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { UAParser } from "ua-parser-js";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { Arc } from "@/components/ui/icons/browser/arc";
import { BraveBrowser } from "@/components/ui/icons/browser/brave";
import { Chrome } from "@/components/ui/icons/browser/chrome";
import { Edge } from "@/components/ui/icons/browser/edge";
import { Firefox } from "@/components/ui/icons/browser/firefox";
import { Opera } from "@/components/ui/icons/browser/opera";
import { Safari } from "@/components/ui/icons/browser/safari";
import { ZenBrowser } from "@/components/ui/icons/browser/zen";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type RawSession = {
	id: string;
	userAgent: string | null;
	ipAddress: string | null;
	createdAt: string | Date;
	updatedAt?: string | Date | null;
	token?: string | null;
};

type Session = {
	id: string;
	userAgent: string | null;
	ipAddress: string | null;
	createdAt: Date;
	updatedAt?: Date | null;
	token: string | null;
};

export function SessionsFrame({
	currentSessionId: initialSessionId,
}: {
	currentSessionId: string;
}) {
	const router = useRouter();
	const [currentSessionId, setCurrentSessionId] =
		useState<string>(initialSessionId);
	const [isRevokingAll, setIsRevokingAll] = useState(false);
	const [includeCurrentDevice, setIncludeCurrentDevice] = useState(false);

	const {
		data: sessions = [],
		isPending,
		error,
		refetch,
	} = useQuery({
		queryKey: ["sessions", currentSessionId],
		retry: 1,
		queryFn: async () => {
			const listRes = await authClient.listSessions();
			if (listRes?.error) {
				throw new Error(
					listRes.error.message || "Sitzungen konnten nicht geladen werden",
				);
			}
			const raw = (listRes?.data ?? []) as RawSession[];
			return raw.map(normalizeSession);
		},
	});

	const toDate = (v: string | Date | undefined | null): Date | null => {
		if (!v) return null;
		const d = v instanceof Date ? v : new Date(v);
		return Number.isFinite(d.getTime()) ? d : null;
	};

	const normalizeSession = (s: RawSession): Session => ({
		id: s.id,
		userAgent: s.userAgent ?? null,
		ipAddress: s.ipAddress ?? null,
		createdAt: toDate(s.createdAt) ?? new Date(0),
		updatedAt: toDate(s.updatedAt ?? null),
		token: s.token ?? null,
	});

	const sortedSessions = useMemo(() => {
		return [...sessions].sort((a, b) => {
			const aIsCurrent = currentSessionId === a.id;
			const bIsCurrent = currentSessionId === b.id;
			if (aIsCurrent && !bIsCurrent) return -1;
			if (bIsCurrent && !aIsCurrent) return 1;
			return (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0);
		});
	}, [sessions, currentSessionId]);

	const handleRevokeSession = useCallback(
		async (session: Session) => {
			try {
				const { error } = await authClient.revokeSessionById({
					sessionId: session.id,
				});
				if (error) {
					if (error instanceof APIError) {
						toast.error(error.message);
					} else {
						toast.error("Etwas ist schiefgelaufen");
					}
					return;
				}
				toast.success("Sitzung widerrufen!");
				await refetch();
			} catch {
				toast.error("Etwas ist schiefgelaufen");
			}
		},
		[refetch],
	);

	const handleRevokeAllSessions = useCallback(async () => {
		setIsRevokingAll(true);
		try {
			if (includeCurrentDevice) {
				await authClient.revokeSessions({
					fetchOptions: {
						onSuccess: () => {
							toast.success("Alle Sitzungen widerrufen. Abmeldung läuft...");
							router.push("/sign-in" as Route);
						},
						onError: () => {
							toast.error("Sitzungen konnten nicht widerrufen werden");
						},
					},
				});
			} else {
				await authClient.revokeOtherSessions({
					fetchOptions: {
						onSuccess: () => {
							toast.success("Alle anderen Sitzungen erfolgreich widerrufen");
							refetch();
						},
						onError: () => {
							toast.error("Sitzungen konnten nicht widerrufen werden");
						},
					},
				});
			}
			if (!includeCurrentDevice) setIsRevokingAll(false);
			setIncludeCurrentDevice(false);
		} catch {
			toast.error("Sitzungen konnten nicht widerrufen werden");
			if (!includeCurrentDevice) setIsRevokingAll(false);
			setIncludeCurrentDevice(false);
		}
	}, [includeCurrentDevice, refetch, router]);

	const getBrowserIcon = (userAgent: string | null) => {
		if (!userAgent) return <Laptop className="size-6" />;
		const parser = new UAParser(userAgent);
		const browser = parser.getBrowser().name?.toLowerCase() || "";

		if (browser.includes("edg")) {
			return <Edge className="size-6" />;
		}
		if (browser.includes("firefox")) {
			return <Firefox className="size-6" />;
		}
		if (browser.includes("chrome") || browser.includes("chromium")) {
			return <Chrome className="size-6" />;
		}
		if (browser.includes("safari")) {
			return <Safari className="size-6" />;
		}
		if (browser.includes("opera")) {
			return <Opera className="size-6" />;
		}
		if (browser.includes("arc")) {
			return <Arc className="size-6" />;
		}
		if (browser.includes("brave")) {
			return <BraveBrowser className="size-6" />;
		}
		if (browser.includes("zen")) {
			return <ZenBrowser className="size-6" />;
		}
		return <Laptop className="size-6" />;
	};

	if (isPending) {
		return (
			<Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
				<FramePanel>
					<h2 className="mb-2 font-heading text-foreground text-xl">
						Aktive Sitzungen
					</h2>
					<p className="mb-6 text-muted-foreground text-sm">
						Verwalte deine aktiven Sitzungen auf verschiedenen Geräten.
						Widerrufe den Zugriff from any device.
					</p>
					<div className="flex items-center justify-center py-12">
						<Loader2 className="size-6 animate-spin text-muted-foreground" />
					</div>
				</FramePanel>
			</Frame>
		);
	}

	if (error) {
		return (
			<Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
				<FramePanel>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<AlertCircle />
							</EmptyMedia>
							<EmptyTitle>Sitzungen konnten nicht geladen werden</EmptyTitle>
							<EmptyDescription>
								{error instanceof Error
									? error.message
									: "Etwas ist schiefgelaufen. Bitte versuche es erneut."}
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Button onClick={() => refetch()}>Erneut versuchen</Button>
						</EmptyContent>
					</Empty>
				</FramePanel>
			</Frame>
		);
	}

	return (
		<Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
			<FramePanel>
				<h2 className="mb-2 font-heading text-foreground text-xl">
					Aktive Sitzungen
				</h2>
				<p className="mb-6 text-muted-foreground text-sm">
					Verwalte deine aktiven Sitzungen auf verschiedenen Geräten. Widerrufe
					den Zugriff from any device.
				</p>

				<div className="space-y-2">
					{sortedSessions.map((sessionItem) => {
						const isCurrent = currentSessionId === sessionItem.id;
						const parser = new UAParser(sessionItem.userAgent || "");
						const browserInfo = parser.getBrowser();
						const osInfo = parser.getOS();
						const browser = browserInfo.name || "Unknown Browser";
						const browserVersion = browserInfo.version
							? ` ${browserInfo.version}`
							: "";
						const os = osInfo.name || "Unknown OS";
						const osVersion = osInfo.version ? ` ${osInfo.version}` : "";
						const ipDisplay = sessionItem.ipAddress || "Unknown IP";
						const lastActiveDate =
							sessionItem.updatedAt ?? sessionItem.createdAt ?? new Date(0);

						return (
							<div key={sessionItem.id}>
								<div
									className={cn(
										"flex items-center justify-between rounded-lg border p-4",
										isCurrent ? "border-primary bg-primary/5 shadow-sm" : "",
									)}
								>
									<div className="flex flex-1 items-center gap-4">
										<Tooltip>
											<TooltipTrigger>
												<div
													className={cn(
														"cursor-help rounded-lg p-2.5",
														isCurrent ? "bg-primary/10" : "bg-secondary",
													)}
												>
													{getBrowserIcon(sessionItem.userAgent)}
												</div>
											</TooltipTrigger>
											<TooltipContent side="right" className="max-w-sm">
												<div className="space-y-2 text-xs">
													<div>
														<p className="mb-1 font-semibold">
															Sitzungsdetails
														</p>
													</div>
													<div className="space-y-1">
														<div>
															<p className="text-muted-foreground">Browser</p>
															<p className="font-medium">
																{browser}
																{browserVersion}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">
																Operating System
															</p>
															<p className="font-medium">
																{os}
																{osVersion}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">
																IP Address
															</p>
															<p className="font-medium">
																{sessionItem.ipAddress || "Unknown"}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Erstellt</p>
															<p className="font-medium">
																{sessionItem.createdAt
																	? new Date(
																			sessionItem.createdAt,
																		).toLocaleString()
																	: "Unknown"}
															</p>
														</div>
													</div>
												</div>
											</TooltipContent>
										</Tooltip>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<p className="font-medium text-sm">
													{browser} on {os}
												</p>
												{isCurrent && (
													<Badge variant="default" className="text-xs">
														This Device
													</Badge>
												)}
											</div>
											<p className="text-muted-foreground text-xs">
												{ipDisplay} •{" "}
												{isCurrent ? (
													<span className="font-medium">Jetzt aktiv</span>
												) : (
													<>
														Last active{" "}
														{lastActiveDate
															? new Date(lastActiveDate).toLocaleDateString(
																	undefined,
																	{
																		month: "short",
																		day: "numeric",
																		year: "numeric",
																	},
																)
															: "Unknown"}
													</>
												)}
											</p>
										</div>
									</div>

									{!isCurrent && (
										<AlertDialog>
											<AlertDialogTrigger
												render={<Button variant="ghost" size="sm" />}
											>
												Revoke
											</AlertDialogTrigger>
											<AlertDialogPopup>
												<AlertDialogHeader>
													<AlertDialogTitle>
														Sitzung widerrufen
													</AlertDialogTitle>
													<AlertDialogDescription>
														Are you sure you want to revoke this session? This
														device will need to sign in again.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogClose render={<Button variant="ghost" />}>
														Cancel
													</AlertDialogClose>
													<AlertDialogClose
														render={<Button variant="destructive" />}
														onClick={() => handleRevokeSession(sessionItem)}
													>
														Revoke Session
													</AlertDialogClose>
												</AlertDialogFooter>
											</AlertDialogPopup>
										</AlertDialog>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</FramePanel>

			<FrameFooter className="flex-row items-center justify-end gap-2">
				<AlertDialog>
					<AnimateIcon animateOnHover>
						<AlertDialogTrigger
							render={<Button variant="destructive" size="sm" />}
							disabled={isRevokingAll}
						>
							{isRevokingAll ? (
								<Loader2 className="mr-2 size-4 animate-spin" />
							) : (
								<Trash2 className="mr-2 size-4" />
							)}
							Revoke All Sessions
						</AlertDialogTrigger>
					</AnimateIcon>
					<AlertDialogPopup>
						<AlertDialogHeader>
							<AlertDialogTitle>Alle Sitzungen widerrufen</AlertDialogTitle>
							<AlertDialogDescription>
								Choose whether to sign out from all devices or only other
								devices.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<div className="px-6 py-4">
							<div className="flex items-start gap-3">
								<Checkbox
									checked={includeCurrentDevice}
									onCheckedChange={(checked) =>
										setIncludeCurrentDevice(!!checked)
									}
									id="include-current"
								/>
								<div className="flex flex-col gap-1">
									<label
										htmlFor="include-current"
										className="cursor-pointer font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Include this device
									</label>
									<p className="text-muted-foreground text-xs">
										Wenn aktiviert, wirst du auch von diesem Gerät abgemeldet.
									</p>
								</div>
							</div>
						</div>
						<AlertDialogFooter>
							<AlertDialogClose render={<Button variant="ghost" />}>
								Cancel
							</AlertDialogClose>
							<AlertDialogClose
								render={<Button variant="destructive" />}
								onClick={handleRevokeAllSessions}
							>
								{includeCurrentDevice
									? "Alle widerrufen & abmelden"
									: "Andere Sitzungen widerrufen"}
							</AlertDialogClose>
						</AlertDialogFooter>
					</AlertDialogPopup>
				</AlertDialog>
			</FrameFooter>
		</Frame>
	);
}
