"use client";

import { Button } from "@matdesk/ui/components/button";
import { FrameFooter, FramePanel } from "@matdesk/ui/components/frame";
import { Input } from "@matdesk/ui/components/input";
import { Label } from "@matdesk/ui/components/label";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthCard, AuthCardLayout, BackToSignInLink } from "@/components/auth/auth-card";
import { authClient } from "@/lib/auth-client";

const MIN_PASSWORD_LENGTH = 8;

export const Route = createFileRoute("/_auth/reset-password")({
  component: ResetPasswordPage,
  validateSearch: z.object({
    /** Signed token from the password-reset email. */
    token: z.string().optional(),
  }),
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validationError =
    newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH
      ? `Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein`
      : confirmPassword.length > 0 && confirmPassword !== newPassword
        ? "Die Passwörter stimmen nicht überein"
        : undefined;

  const canSubmit =
    !validationError &&
    newPassword.length >= MIN_PASSWORD_LENGTH &&
    confirmPassword === newPassword;

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (validationError || !token) return;

    setLoading(true);
    const { error } = await authClient.resetPassword({ newPassword, token });
    setLoading(false);

    if (error) {
      toast.error(
        error.message ||
          "Das Passwort konnte nicht zurückgesetzt werden. Fordere einen neuen Link an.",
      );
      return;
    }

    toast.success("Passwort geändert. Melde dich mit dem neuen Passwort an.");
    void navigate({ to: "/sign-in" });
  }

  // Landing here without a token means the link was mangled or hand-typed —
  // there's nothing to submit, so don't show a form at all.
  if (!token) {
    return (
      <AuthCardLayout>
        <BackToSignInLink />
        <AuthCard>
          <FramePanel>
            <h1 className="mb-4 font-heading text-2xl">Link ungültig</h1>
            <p className="mb-6 text-muted-foreground text-sm">
              Dieser Link zum Zurücksetzen des Passworts ist unvollständig oder abgelaufen. Fordere
              einen neuen an.
            </p>
            <Button
              className="w-full"
              render={<Link to="/forgot-password">Neuen Link anfordern</Link>}
            />
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
          <h1 className="mb-4 font-heading text-2xl">Neues Passwort setzen</h1>
          <p className="mb-6 text-muted-foreground text-sm">
            Wähle ein neues Passwort für dein Konto.
          </p>
          <form className="space-y-4" onSubmit={resetPassword}>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Neues Passwort</Label>
              <Input
                autoComplete="new-password"
                id="newPassword"
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Neues Passwort"
                required
                type="password"
                value={newPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                autoComplete="new-password"
                id="confirmPassword"
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort bestätigen"
                required
                type="password"
                value={confirmPassword}
              />
            </div>

            {validationError ? <p className="text-destructive text-xs">{validationError}</p> : null}

            <Button className="w-full" disabled={!canSubmit} loading={loading} type="submit">
              Passwort speichern
            </Button>
          </form>
        </FramePanel>

        <FrameFooter className="flex-row items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Link abgelaufen?{" "}
            <Link className="text-foreground hover:underline" to="/forgot-password">
              Neuen Link anfordern
            </Link>
          </p>
        </FrameFooter>
      </AuthCard>
    </AuthCardLayout>
  );
}
