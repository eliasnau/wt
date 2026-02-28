"use client";

import { authClient } from "@repo/auth/client";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeftIcon,
  LayoutDashboard,
  Loader2,
  LogIn,
  Mail,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { FloatingPaths } from "@/components/floating-paths";
import { Logo } from "@/components/logo";
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

function getVerificationErrorMessage(errorMessage: string) {
  const normalizedMessage = errorMessage.toLowerCase();

  if (normalizedMessage.includes("token_expired")) {
    return "Dieser Verifizierungslink ist abgelaufen. Bitte fordere eine neue Bestätigungs-E-Mail an.";
  }

  if (normalizedMessage.includes("invalid_token")) {
    return "Dieser Verifizierungslink ist ungültig.";
  }

  if (normalizedMessage.includes("user_not_found")) {
    return "Zu diesem Verifizierungslink wurde kein Konto gefunden.";
  }

  if (normalizedMessage.includes("unauthorized")) {
    return "Dieser Verifizierungslink gehört zu einem anderen Konto.";
  }

  if (normalizedMessage.includes("email_already_verified")) {
    return "Diese E-Mail-Adresse wurde bereits verifiziert.";
  }

  return "E-Mail-Verifizierung fehlgeschlagen. Bitte fordere eine neue Bestätigungs-E-Mail an.";
}

export default function EmailVerifiedPage() {
  const [token] = useQueryState("token");
  const [callbackURL] = useQueryState("callbackURL");
  const [isResending, setIsResending] = useState(false);
  const postLoginRedirect = callbackURL || "/dashboard";
  const signInHref = `/sign-in?redirectUrl=${encodeURIComponent(postLoginRedirect)}`;
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  const { isPending: isVerificationPending, error: verificationError } =
    useQuery({
      queryKey: ["verify-email", token],
      enabled: Boolean(token),
      retry: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      queryFn: async () => {
        if (!token) {
          throw new Error(
            "Der Verifizierungslink ist ungültig oder unvollständig.",
          );
        }

        const result = await authClient.verifyEmail({
          query: {
            token,
          },
        });

        if (result.error) {
          throw new Error(
            result.error.message || "E-Mail-Verifizierung fehlgeschlagen",
          );
        }

        return result.data;
      },
    });

  const isVerificationLoading = Boolean(token) && isVerificationPending;
  const hasNoToken = !token;
  const verificationErrorMessage =
    verificationError instanceof Error
      ? getVerificationErrorMessage(verificationError.message)
      : null;
  const hasVerificationError = Boolean(verificationErrorMessage);
  const showUserMenu = !isSessionPending && Boolean(session?.user);
  const showHomeButton = !isSessionPending && !session?.user;
  const isAlreadyVerified = session?.user?.emailVerified === true;
  const noTokenTitle = isAlreadyVerified
    ? "E-Mail bereits verifiziert"
    : "E-Mail verifizieren";
  const noTokenDescription = isAlreadyVerified
    ? "Deine E-Mail-Adresse ist bereits verifiziert."
    : "Sende dir eine Bestätigungs-E-Mail, um deine E-Mail-Adresse zu verifizieren.";

  const handleResendVerification = async () => {
    if (!session?.user) {
      return;
    }

    setIsResending(true);
    try {
      const result = await authClient.sendVerificationEmail({
        email: session.user.email,
        callbackURL: postLoginRedirect,
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
      setIsResending(false);
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

        {showUserMenu && session?.user ? (
          <UserAccountMenu
            className="absolute top-7 right-5"
            user={session.user}
          />
        ) : null}

        {showHomeButton ? (
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

          {isVerificationLoading ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="size-4 animate-spin" />
                E-Mail wird verifiziert...
              </div>
              <p className="text-muted-foreground text-xs">
                Einen Moment bitte, wir prüfen deinen Link.
              </p>
            </div>
          ) : hasNoToken ? (
            <Empty className="gap-4 p-4">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Mail />
                </EmptyMedia>
                <EmptyTitle>{noTokenTitle}</EmptyTitle>
                <EmptyDescription>{noTokenDescription}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={isAlreadyVerified ? "outline" : "default"}
                    onClick={
                      session?.user ? handleResendVerification : undefined
                    }
                    disabled={isAlreadyVerified || isResending}
                    render={
                      !session?.user ? (
                        <Link href={signInHref as Route} />
                      ) : undefined
                    }
                  >
                    {session?.user ? (
                      isAlreadyVerified ? (
                        <>
                          <CheckCircle2 />
                          E-Mail bereits verifiziert
                        </>
                      ) : isResending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Sende...
                        </>
                      ) : (
                        <>
                          <Mail />
                          E-Mail senden
                        </>
                      )
                    ) : (
                      <>
                        <Mail />
                        E-Mail senden
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    render={
                      <Link
                        href={
                          (session?.user ? "/dashboard" : signInHref) as Route
                        }
                      />
                    }
                  >
                    {session?.user ? <LayoutDashboard /> : <LogIn />}
                    Dashboard
                  </Button>
                </div>
              </EmptyContent>
            </Empty>
          ) : hasVerificationError ? (
            <Empty className="gap-4 p-4">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertCircle className="text-destructive" />
                </EmptyMedia>
                <EmptyTitle>Verifizierung fehlgeschlagen</EmptyTitle>
                <EmptyDescription>{verificationErrorMessage}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    render={
                      <Link
                        href={
                          (session?.user ? "/dashboard" : signInHref) as Route
                        }
                      />
                    }
                  >
                    {session?.user ? <LayoutDashboard /> : <LogIn />}
                    {session?.user ? "Dashboard" : "Anmelden"}
                  </Button>
                  {session?.user ? (
                    isAlreadyVerified ? (
                      <Button size="sm" variant="outline" disabled>
                        <CheckCircle2 />
                        Bereits verifiziert
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleResendVerification}
                        disabled={isResending}
                      >
                        {isResending ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Sende...
                          </>
                        ) : (
                          "E-Mail erneut senden"
                        )}
                      </Button>
                    )
                  ) : null}
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            <Empty className="gap-4 p-4">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CheckCircle2 className="text-green-500" />
                </EmptyMedia>
                <EmptyTitle>E-Mail erfolgreich verifiziert</EmptyTitle>
                <EmptyDescription>
                  Deine E-Mail-Adresse wurde bestätigt. Du kannst jetzt weiter
                  zur App.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {isSessionPending ? (
                  <Skeleton className="h-9 w-32 rounded-lg" />
                ) : (
                  <Button
                    size="sm"
                    variant="default"
                    render={
                      <Link
                        href={
                          (session?.user ? "/dashboard" : signInHref) as Route
                        }
                      />
                    }
                  >
                    {session?.user ? <LayoutDashboard /> : <LogIn />}
                    {session?.user ? "Zum Dashboard" : "Anmelden"}
                  </Button>
                )}
              </EmptyContent>
            </Empty>
          )}
        </div>
      </div>
    </main>
  );
}
