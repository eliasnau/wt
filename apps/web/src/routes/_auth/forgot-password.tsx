"use client";

import { Button } from "@matdesk/ui/components/button";
import { FrameFooter, FramePanel } from "@matdesk/ui/components/frame";
import { Input } from "@matdesk/ui/components/input";
import { Label } from "@matdesk/ui/components/label";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthCard, AuthCardLayout, BackToSignInLink } from "@/components/auth/auth-card";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth/forgot-password")({
  component: ForgotPasswordPage,
  validateSearch: z.object({
    /** Prefilled from the sign-in form so the user doesn't retype it. */
    email: z.string().optional(),
  }),
});

function ForgotPasswordPage() {
  const { email: emailParam } = Route.useSearch();
  const navigate = useNavigate();

  const [email, setEmail] = useState(emailParam ?? "");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // The address is only a convenience hand-off from sign-in — drop it from the
  // URL straight away so it doesn't linger in history or get shared around.
  useEffect(() => {
    if (!emailParam) return;
    void navigate({
      replace: true,
      search: (prev) => ({ ...prev, email: undefined }),
      to: "/forgot-password",
    });
  }, [emailParam, navigate]);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    setLoading(false);

    if (error) {
      toast.error(
        error.message || "Die E-Mail konnte nicht gesendet werden. Bitte erneut versuchen.",
      );
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <AuthCardLayout>
        <AuthCard>
          <FramePanel>
            <h1 className="mb-4 font-heading text-2xl">Prüfe deine E-Mails</h1>
            <p className="mb-6 text-muted-foreground text-sm">
              Wir haben einen Link zum Zurücksetzen des Passworts an <strong>{email}</strong>{" "}
              gesendet.
            </p>
            <Button className="w-full" render={<Link to="/sign-in">Zurück zur Anmeldung</Link>} />
          </FramePanel>
        </AuthCard>
      </AuthCardLayout>
    );
  }

  return (
    <AuthCardLayout>
      <BackToSignInLink />
      <AuthCard>
        <FramePanel>
          <h1 className="mb-4 font-heading text-2xl">Setze dein Passwort zurück</h1>
          <p className="mb-6 text-muted-foreground text-sm">
            Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines
            Passworts.
          </p>
          <form className="space-y-4" onSubmit={requestReset}>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                autoComplete="email"
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="m@example.com"
                required
                type="email"
                value={email}
              />
            </div>

            <Button className="w-full" loading={loading} type="submit">
              Link zum Zurücksetzen senden
            </Button>
          </form>
        </FramePanel>

        <FrameFooter className="flex-row items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Erinnerst du dich an dein Passwort?{" "}
            <Link className="text-foreground hover:underline" to="/sign-in">
              Anmelden
            </Link>
          </p>
        </FrameFooter>
      </AuthCard>
    </AuthCardLayout>
  );
}
