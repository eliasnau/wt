"use client";

import { Button } from "@matdesk/ui/components/button";
import { Checkbox } from "@matdesk/ui/components/checkbox";
import { FrameFooter, FramePanel } from "@matdesk/ui/components/frame";
import { Input } from "@matdesk/ui/components/input";
import { Label } from "@matdesk/ui/components/label";
import { OTPField, OTPFieldInput } from "@matdesk/ui/components/otp-field";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  BinaryIcon,
  ChevronRightIcon,
  KeyRoundIcon,
  ShieldIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AuthCard, AuthCardLayout, BackToSignInLink } from "@/components/auth/auth-card";
import { authClient } from "@/lib/auth-client";
import { safeRedirectUrl } from "@/lib/redirect-url";

const OTP_LENGTH = 6;

type VerificationMethod = "backup" | "totp";
type View = "method-selection" | "verify";

export const Route = createFileRoute("/_auth/verify-2fa")({
  component: Verify2FAPage,
});

function Verify2FAPage() {
  const { redirectUrl: rawRedirectUrl } = Route.useSearch();
  const navigate = useNavigate();
  const redirectUrl = safeRedirectUrl(rawRedirectUrl);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [method, setMethod] = useState<VerificationMethod>("totp");
  const [view, setView] = useState<View>("verify");

  async function verify(value: string) {
    if (loading) return;
    setLoading(true);
    const { error } =
      method === "totp"
        ? await authClient.twoFactor.verifyTotp({ code: value, trustDevice })
        : await authClient.twoFactor.verifyBackupCode({
            code: value,
            trustDevice,
          });
    setLoading(false);

    if (error) {
      toast.error(
        error.message ||
          (method === "totp" ? "Ungültiger Verifizierungscode" : "Ungültiger Backup-Code"),
      );
      return;
    }

    void navigate({ href: redirectUrl });
  }

  function selectMethod(selected: VerificationMethod) {
    setMethod(selected);
    setCode("");
    setView("verify");
  }

  if (view === "method-selection") {
    return (
      <AuthCardLayout>
        <div className="mb-4">
          <button
            className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
            onClick={() => setView("verify")}
            type="button"
          >
            <ArrowLeftIcon className="size-4" />
            Zurück
          </button>
        </div>
        <AuthCard>
          <FramePanel>
            <div className="mb-6">
              <h1 className="font-heading text-2xl">Verifizierungsmethode wählen</h1>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <button
                className="flex w-full items-center gap-3 border-border border-b px-4 py-4 transition-colors hover:bg-accent"
                onClick={() => selectMethod("totp")}
                type="button"
              >
                <KeyRoundIcon className="size-5 shrink-0" />
                <span className="flex-1 text-left font-normal">Authenticator-App</span>
                <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
              </button>

              <button
                className="flex w-full items-center gap-3 px-4 py-4 transition-colors hover:bg-accent"
                onClick={() => selectMethod("backup")}
                type="button"
              >
                <BinaryIcon className="size-5 shrink-0" />
                <span className="flex-1 text-left font-normal">Backup-Code</span>
                <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
              </button>
            </div>
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
          <div className="mb-4 flex items-center gap-2">
            <ShieldIcon className="size-6 text-primary" />
            <h1 className="font-heading text-2xl">Zwei-Faktor-Authentifizierung</h1>
          </div>

          <p className="mb-6 text-muted-foreground text-sm">
            {method === "totp"
              ? "Gib den 6-stelligen Code aus deiner Authenticator-App ein, um fortzufahren."
              : "Gib einen deiner Backup-Codes ein, um auf dein Konto zuzugreifen."}
          </p>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void verify(code);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="code">
                {method === "totp" ? "Verifizierungscode" : "Backup-Code"}
              </Label>
              {method === "totp" ? (
                <div className="flex justify-center py-2">
                  <OTPField
                    id="code"
                    length={OTP_LENGTH}
                    onValueChange={setCode}
                    // Six digits in is unambiguously "done" — submit without
                    // making the user reach for the button.
                    onValueComplete={(value) => void verify(value)}
                    size="lg"
                    value={code}
                  >
                    {/* base-ui derives each slot's index from DOM order — the
                        inputs take no `index` prop, unlike `input-otp`. */}
                    {Array.from({ length: OTP_LENGTH }, (_, index) => (
                      <OTPFieldInput key={index} />
                    ))}
                  </OTPField>
                </div>
              ) : (
                <Input
                  autoComplete="off"
                  id="code"
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Backup-Code eingeben"
                  required
                  type="text"
                  value={code}
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox checked={trustDevice} id="trust" onCheckedChange={setTrustDevice} />
              <Label className="text-sm" htmlFor="trust">
                Diesem Gerät für 30 Tage vertrauen
              </Label>
            </div>

            <Button className="w-full" loading={loading} type="submit">
              Verifizieren
            </Button>
          </form>
        </FramePanel>

        <FrameFooter className="flex-row items-center justify-center">
          <p className="text-muted-foreground text-sm">
            <button
              className="text-foreground hover:underline"
              onClick={() => setView("method-selection")}
              type="button"
            >
              Andere Methode verwenden
            </button>
          </p>
        </FrameFooter>
      </AuthCard>
    </AuthCardLayout>
  );
}
