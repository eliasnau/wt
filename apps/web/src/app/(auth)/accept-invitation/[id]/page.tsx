"use client";

import { authClient } from "@repo/auth/client";
import { useQuery } from "@tanstack/react-query";
import {
	AlertCircle,
	ArrowLeftRight,
	ChevronLeftIcon,
	LayoutDashboard,
	Loader2,
	UserX,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { FloatingPaths } from "@/components/floating-paths";
import { Logo } from "@/components/logo";
import { OrganizationAvatar } from "@/components/organization-avatar";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAccountMenu } from "@/components/user-account-menu";

export default function AcceptInvitationPage() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useParams<{ id: string }>();
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const [isAccepting, setIsAccepting] = useState(false);
	const [isRejecting, setIsRejecting] = useState(false);
	const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
	const [isSendingVerification, setIsSendingVerification] = useState(false);
	const [acceptErrorMessage, setAcceptErrorMessage] = useState<string | null>(
		null,
	);
	const invitationId = params.id;
	const redirectUrl = encodeURIComponent(pathname);
	const signInHref = `/sign-in?redirectUrl=${redirectUrl}&invite=1`;
	const signUpHref = `/sign-up?redirectUrl=${redirectUrl}&invite=1`;
	const isLoggedIn = !!session?.user;

	const {
		data: invitation,
		isPending: isInvitationPending,
		error: invitationError,
		refetch: refetchInvitation,
	} = useQuery({
		queryKey: ["accept-invitation", invitationId],
		enabled: isLoggedIn && !!invitationId,
		retry: 1,
		queryFn: async () => {
			const result = await authClient.organization.getInvitation({
				query: { id: invitationId },
			});

			if (result.error) {
				throw new Error(
					result.error.message || "Einladung konnte nicht geladen werden",
				);
			}

			return result.data;
		},
	});
	const isPageLoading = isSessionPending || (isLoggedIn && isInvitationPending);
	const invitationErrorMessage =
		invitationError instanceof Error
			? invitationError.message
			: "Einladung konnte nicht geladen werden";
	const isEmailVerificationRequiredError = ({
		message,
		code,
	}: {
		message?: string | null;
		code?: string | null;
	}) => {
		const normalizedMessage = message?.toLowerCase() || "";
		const normalizedCode = code?.toLowerCase() || "";

		return (
			normalizedMessage.includes(
				"email verification required before accepting or rejecting invitation",
			) ||
			normalizedMessage.includes("email verification required") ||
			normalizedMessage.includes(
				"email_verification_required_before_accepting_or_rejecting_invitation",
			) ||
			normalizedCode.includes(
				"email_verification_required_before_accepting_or_rejecting_invitation",
			)
		);
	};
	const hasInvitationError = !!invitationError;
	const pageErrorMessage = acceptErrorMessage || invitationErrorMessage;
	const hasPageError = hasInvitationError || !!acceptErrorMessage;
	const normalizedErrorMessage = pageErrorMessage.toLowerCase();
	const isInvitationNotFound =
		normalizedErrorMessage.includes("not found") ||
		normalizedErrorMessage.includes("nicht gefunden");
	const isNotInvitationRecipient =
		normalizedErrorMessage.includes("recipient") ||
		normalizedErrorMessage.includes("empfänger");
	const isEmailVerificationRequired = isEmailVerificationRequiredError({
		message: pageErrorMessage,
	});

	const handleAcceptInvitation = async () => {
		if (!invitationId) {
			toast.error("Ungültiger Einladungslink");
			return;
		}

		if (!session?.user) {
			router.push(signInHref as Route);
			return;
		}

		setIsAccepting(true);
		setAcceptErrorMessage(null);

		const { error } = await authClient.organization.acceptInvitation({
			invitationId,
		});

		if (error) {
			const errorMessage =
				error.message || "Einladung konnte nicht angenommen werden";
			const errorCode =
				typeof error === "object" && error && "code" in error
					? String((error as { code?: string }).code ?? "")
					: "";
			if (
				isEmailVerificationRequiredError({
					message: errorMessage,
					code: errorCode,
				})
			) {
				setAcceptErrorMessage(errorMessage);
				setIsAccepting(false);
				return;
			}

			toast.error(errorMessage);
			setIsAccepting(false);
			return;
		}

		toast.success("Einladung angenommen");
		router.push("/organizations" as Route);
		setIsAccepting(false);
	};

	const handleRejectInvitation = async () => {
		if (!invitationId) {
			toast.error("Ungültiger Einladungslink");
			return;
		}

		if (!session?.user) {
			router.push(signInHref as Route);
			return;
		}

		setIsRejecting(true);

		const { error } = await authClient.organization.rejectInvitation({
			invitationId,
		});

		if (error) {
			toast.error(error.message || "Einladung konnte nicht abgelehnt werden");
			setIsRejecting(false);
			return;
		}

		toast.success("Einladung abgelehnt");
		router.push("/organizations" as Route);
		setIsRejecting(false);
	};

	const handleSwitchAccount = async () => {
		setIsSwitchingAccount(true);
		setAcceptErrorMessage(null);
		await authClient.signOut();
		router.push(signInHref as Route);
		setIsSwitchingAccount(false);
	};

	const handleSendVerificationEmail = async () => {
		if (!session?.user) {
			router.push(signInHref as Route);
			return;
		}

		setIsSendingVerification(true);
		try {
			const result = await authClient.sendVerificationEmail({
				email: session.user.email,
				callbackURL: pathname,
			});

			if (result.error) {
				toast.error(
					result.error.message ||
						"Bestätigungs-E-Mail konnte nicht gesendet werden",
				);
				return;
			}

			toast.success(
				"Bestätigungs-E-Mail gesendet. Bitte prüfe deinen Posteingang.",
			);
		} catch (error) {
			console.error(error);
			toast.error("Bestätigungs-E-Mail konnte nicht gesendet werden");
		} finally {
			setIsSendingVerification(false);
		}
	};

	return (
		<main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
			<div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
				<div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
				<Logo className="mr-auto h-4.5" monochrome />

				<div className="z-10 mt-auto">
					<div className="font-mono font-semibold text-sm">matdesk</div>
					<p className="text-sm">
						Sichere Mitgliederverwaltung und Organisation an einem Ort.
					</p>
				</div>

				<div className="absolute inset-0">
					<FloatingPaths position={1} />
					<FloatingPaths position={-1} />
				</div>
			</div>

			<div className="relative flex min-h-screen flex-col justify-center px-8 py-10 lg:py-0">
				<div
					aria-hidden
					className="absolute inset-0 isolate -z-10 opacity-60 contain-strict"
				>
					<div className="absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
					<div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
					<div className="absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
				</div>

				{!isSessionPending && session?.user ? (
					<UserAccountMenu
						className="absolute top-7 right-5"
						user={session.user}
					/>
				) : !isSessionPending ? (
					<Button
						className="absolute top-7 left-5"
						variant="ghost"
						render={<Link href={"/" as Route} />}
					>
						<ChevronLeftIcon data-icon="inline-start" />
						Startseite
					</Button>
				) : null}

				<div className="mx-auto w-full max-w-sm space-y-4">
					<Logo className="h-4.5 lg:hidden" monochrome />

					{!isPageLoading && !hasPageError && (
						<div className="flex flex-col space-y-1">
							<h1 className="font-bold text-2xl tracking-wide">
								{invitation?.organizationName
									? `${invitation.organizationName} beitreten`
									: "Einladung zur Organisation"}
							</h1>
							<p className="text-base text-muted-foreground">
								Du wurdest eingeladen, einer Organisation in matdesk
								beizutreten.
							</p>
						</div>
					)}

					{isPageLoading ? (
						<div className="space-y-2">
							<div className="flex items-center gap-3">
								<Skeleton className="size-11 rounded-md" />
								<div className="min-w-0 flex-1 space-y-1.5">
									<Skeleton className="h-4 w-44" />
									<Skeleton className="h-3 w-28" />
								</div>
							</div>
							<Skeleton className="h-4 w-64" />
							<Skeleton className="h-4 w-40" />
						</div>
					) : (
						isLoggedIn &&
						invitation && (
							<div className="space-y-2">
								<div className="flex items-center gap-3">
									<OrganizationAvatar
										id={invitation.organizationId}
										name={invitation.organizationName}
										className="size-11"
									/>
									<div className="min-w-0">
										<p className="truncate font-medium text-sm">
											{invitation.organizationName}
										</p>
										<p className="truncate text-muted-foreground text-xs">
											@{invitation.organizationSlug}
										</p>
									</div>
								</div>
								<p className="text-muted-foreground text-sm">
									Eingeladen von{" "}
									<span className="text-foreground">
										{invitation.inviterEmail}
									</span>
								</p>
								<p className="text-muted-foreground text-sm">
									Rolle:{" "}
									<span className="text-foreground capitalize">
										{invitation.role}
									</span>
								</p>
							</div>
						)
					)}

					{isPageLoading ? (
						<div className="space-y-2">
							<Skeleton className="h-9 w-full rounded-lg" />
							<Skeleton className="h-9 w-full rounded-lg" />
						</div>
					) : !session?.user ? (
						<div className="space-y-2">
							<Button
								className="w-full"
								render={<Link href={signInHref as Route} />}
							>
								Anmelden und Einladung annehmen
							</Button>
							<Button
								className="w-full"
								variant="outline"
								render={<Link href={signUpHref as Route} />}
							>
								Konto erstellen
							</Button>
						</div>
					) : hasPageError ? (
						<Empty className="gap-4 p-4">
							<EmptyHeader>
								<EmptyMedia variant="icon">
									{isEmailVerificationRequired ? (
										<AlertCircle />
									) : isNotInvitationRecipient ? (
										<UserX />
									) : (
										<AlertCircle />
									)}
								</EmptyMedia>
								<EmptyTitle>
									{isEmailVerificationRequired
										? "E-Mail-Verifizierung erforderlich"
										: isInvitationNotFound
											? "Einladung nicht gefunden"
											: isNotInvitationRecipient
												? "Du bist nicht der Empfänger"
												: "Einladung konnte nicht geladen werden"}
								</EmptyTitle>
								<EmptyDescription>
									{isEmailVerificationRequired
										? "Du musst deine E-Mail verifizieren, um Organisationen beizutreten. So stellen wir sicher, dass deine E-Mail zur Einladung passt und du der Empfänger bist."
										: isInvitationNotFound
											? "Der Link ist ungültig, abgelaufen oder die Einladung wurde bereits verwendet."
											: isNotInvitationRecipient
												? "Diese Einladung gehört zu einer anderen E-Mail-Adresse. Melde dich mit der richtigen Adresse an."
												: pageErrorMessage}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<div className="flex gap-2">
									{isEmailVerificationRequired ? (
										<Button
											size="sm"
											variant="default"
											onClick={handleSendVerificationEmail}
											disabled={isSendingVerification || isSessionPending}
										>
											{isSendingVerification ? (
												<>
													<Loader2 className="mr-2 size-4 animate-spin" />
													E-Mail wird gesendet...
												</>
											) : (
												"E-Mail verifizieren"
											)}
										</Button>
									) : (
										<Button
											size="sm"
											variant="default"
											render={<Link href={"/dashboard" as Route} />}
										>
											<LayoutDashboard />
											Dashboard
										</Button>
									)}
									{isEmailVerificationRequired ? (
										<Button
											size="sm"
											variant="outline"
											onClick={handleAcceptInvitation}
											disabled={isAccepting || isSendingVerification}
										>
											{isAccepting ? (
												<>
													<Loader2 className="mr-2 size-4 animate-spin" />
													Wird erneut versucht...
												</>
											) : (
												"Erneut versuchen"
											)}
										</Button>
									) : isNotInvitationRecipient ? (
										<Button
											size="sm"
											variant="outline"
											onClick={handleSwitchAccount}
											disabled={isSwitchingAccount}
										>
											<ArrowLeftRight />
											{isSwitchingAccount
												? "Wechsle Account..."
												: "Account wechseln"}
										</Button>
									) : (
										<Button
											size="sm"
											variant="outline"
											onClick={() => refetchInvitation()}
										>
											Erneut versuchen
										</Button>
									)}
								</div>
							</EmptyContent>
						</Empty>
					) : (
						<div className="space-y-2">
							<Button
								className="w-full"
								onClick={handleAcceptInvitation}
								disabled={isAccepting || isRejecting || isSessionPending}
							>
								{isAccepting ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Wird angenommen...
									</>
								) : (
									"Einladung annehmen"
								)}
							</Button>
							<Button
								className="w-full"
								variant="destructive-outline"
								onClick={handleRejectInvitation}
								disabled={isRejecting || isAccepting || isSessionPending}
							>
								{isRejecting ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Wird abgelehnt...
									</>
								) : (
									"Einladung ablehnen"
								)}
							</Button>
						</div>
					)}

					{!isPageLoading && !hasPageError && (
						<p className="text-muted-foreground text-xs leading-relaxed">
							Falls du diese Einladung nicht erwartet hast, kannst du diese
							Seite einfach schließen.
						</p>
					)}
				</div>
			</div>
		</main>
	);
}
