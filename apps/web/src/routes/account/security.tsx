import { Badge } from "@matdesk/ui/components/badge";
import { Button } from "@matdesk/ui/components/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@matdesk/ui/components/card";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@matdesk/ui/components/dialog";
import { Field, FieldDescription, FieldLabel } from "@matdesk/ui/components/field";
import { Input } from "@matdesk/ui/components/input";
import { Separator } from "@matdesk/ui/components/separator";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { parseError } from "evlog";
import { KeyRoundIcon, ShieldCheckIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/account/security")({ component: SecurityPage });

function SecurityPage() {
  const { user, refetchSession } = useAuth();
  const passkeys = authClient.useListPasskeys();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);

  const addPasskey = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.passkey.addPasskey({ name: "Passkey" });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await passkeys.refetch();
      toast.success("Passkey hinzugefügt");
    },
    onError: (error) => toast.error(parseError(error).message),
  });

  const deletePasskey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await authClient.passkey.deletePasskey({ id });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await passkeys.refetch();
      toast.success("Passkey entfernt");
    },
    onError: (error) => toast.error(parseError(error).message),
  });

  const sessionsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.revokeOtherSessions();
      if (error) throw new Error(error.message);
    },
    onSuccess: () => toast.success("Andere Sitzungen wurden abgemeldet"),
    onError: (error) => toast.error(parseError(error).message),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sicherheit</h1>
        <p className="mt-1 text-sm text-muted-foreground">Anmeldung und Schutz deines Kontos.</p>
      </div>

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Passwort</CardFrameTitle>
          <CardFrameDescription>Ändere dein Passwort regelmäßig.</CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <CardPanel className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Kontopasswort</p>
              <p className="text-sm text-muted-foreground">Mindestens 8 Zeichen.</p>
            </div>
            <Button onClick={() => setPasswordOpen(true)} size="sm" variant="outline">
              Passwort ändern
            </Button>
          </CardPanel>
        </Card>
      </CardFrame>

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Zwei-Faktor-Authentifizierung</CardFrameTitle>
          <CardFrameDescription>
            Zusätzlicher Schutz mit einer Authenticator-App.
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <CardPanel className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <ShieldCheckIcon className="size-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Authenticator-App</p>
                  <Badge variant="secondary">{user?.twoFactorEnabled ? "Aktiv" : "Inaktiv"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Bestätigungscode bei jeder Anmeldung.
                </p>
              </div>
            </div>
            <Button onClick={() => setTwoFactorOpen(true)} size="sm" variant="outline">
              {user?.twoFactorEnabled ? "Deaktivieren" : "Einrichten"}
            </Button>
          </CardPanel>
        </Card>
      </CardFrame>

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Passkeys</CardFrameTitle>
          <CardFrameDescription>
            Anmelden mit Fingerabdruck, Gesichtserkennung oder Gerätesperre.
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <CardPanel className="flex flex-col gap-4">
            {passkeys.data?.length ? (
              <div className="flex flex-col">
                {passkeys.data.map((passkey, index) => (
                  <div key={passkey.id}>
                    {index > 0 ? <Separator /> : null}
                    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="flex min-w-0 items-center gap-3">
                        <KeyRoundIcon className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {passkey.name || "Passkey"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Hinzugefügt{" "}
                            {format(new Date(passkey.createdAt), "dd. MMMM yyyy", { locale: de })}
                          </p>
                        </div>
                      </div>
                      <Button
                        aria-label="Passkey entfernen"
                        disabled={deletePasskey.isPending}
                        onClick={() => deletePasskey.mutate(passkey.id)}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Noch keine Passkeys eingerichtet.</p>
            )}
          </CardPanel>
        </Card>
        <CardFrameFooter className="flex justify-end">
          <Button loading={addPasskey.isPending} onClick={() => addPasskey.mutate()} size="sm">
            Passkey hinzufügen
          </Button>
        </CardFrameFooter>
      </CardFrame>

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Aktive Sitzungen</CardFrameTitle>
          <CardFrameDescription>Beende alle Sitzungen außer dieser.</CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <CardPanel>
            <p className="max-w-xl text-sm text-muted-foreground">
              Melde andere Geräte ab, wenn du dein Konto zusätzlich absichern möchtest.
            </p>
          </CardPanel>
        </Card>
        <CardFrameFooter className="flex justify-end">
          <Button
            loading={sessionsMutation.isPending}
            onClick={() => sessionsMutation.mutate()}
            size="sm"
            variant="outline"
          >
            Andere Sitzungen abmelden
          </Button>
        </CardFrameFooter>
      </CardFrame>

      <PasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
      <TwoFactorDialog
        enabled={Boolean(user?.twoFactorEnabled)}
        onChanged={refetchSession}
        open={twoFactorOpen}
        onOpenChange={setTwoFactorOpen}
      />
    </div>
  );
}

function PasswordDialog({ open, onOpenChange }: DialogStateProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const mutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmation)
        throw new Error("Die neuen Passwörter stimmen nicht überein.");
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      onOpenChange(false);
      toast.success("Passwort geändert");
    },
    onError: (error) => toast.error(parseError(error).message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Passwort ändern</DialogTitle>
          <DialogDescription>
            Andere Sitzungen werden anschließend automatisch abgemeldet.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="flex flex-col gap-5">
          <Field>
            <FieldLabel htmlFor="current-password">Aktuelles Passwort</FieldLabel>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="new-password">Neues Passwort</FieldLabel>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <FieldDescription>Mindestens 8 Zeichen.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm-password">Passwort bestätigen</FieldLabel>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={confirmation.length > 0 && confirmation !== newPassword}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </Field>
        </DialogPanel>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            disabled={!currentPassword || newPassword.length < 8 || confirmation.length < 8}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Passwort ändern
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

type DialogStateProps = { open: boolean; onOpenChange: (open: boolean) => void };

function TwoFactorDialog({
  enabled,
  onChanged,
  open,
  onOpenChange,
}: DialogStateProps & { enabled: boolean; onChanged: () => Promise<unknown> }) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [setup, setSetup] = useState<{ totpURI: string; backupCodes: string[] } | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPassword("");
      setCode("");
      setSetup(null);
    }
    onOpenChange(nextOpen);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (enabled) {
        const { error } = await authClient.twoFactor.disable({ password });
        if (error) throw new Error(error.message);
        return "done" as const;
      }
      if (!setup) {
        const { data, error } = await authClient.twoFactor.enable({ password });
        if (error) throw new Error(error.message);
        setSetup(data);
        return "setup" as const;
      }
      const { error } = await authClient.twoFactor.verifyTotp({ code });
      if (error) throw new Error(error.message);
      return "done" as const;
    },
    onSuccess: async (state) => {
      if (state === "setup") return;
      await onChanged();
      setPassword("");
      setCode("");
      setSetup(null);
      handleOpenChange(false);
      toast.success(
        enabled
          ? "Zwei-Faktor-Authentifizierung deaktiviert"
          : "Zwei-Faktor-Authentifizierung aktiviert",
      );
    },
    onError: (error) => toast.error(parseError(error).message),
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{enabled ? "2FA deaktivieren" : "2FA einrichten"}</DialogTitle>
          <DialogDescription>
            {enabled
              ? "Bestätige die Änderung mit deinem Passwort."
              : setup
                ? "Füge den Schlüssel deiner Authenticator-App hinzu und bestätige den Code."
                : "Bestätige zuerst dein Kontopasswort."}
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="flex flex-col gap-5">
          {!setup ? (
            <Field>
              <FieldLabel htmlFor="two-factor-password">Passwort</FieldLabel>
              <Input
                id="two-factor-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
          ) : (
            <>
              <Field>
                <FieldLabel>Authenticator-Schlüssel</FieldLabel>
                <p className="break-all rounded-lg bg-muted p-3 font-mono text-xs">
                  {setup.totpURI}
                </p>
              </Field>
              <Field>
                <FieldLabel htmlFor="two-factor-code">6-stelliger Code</FieldLabel>
                <Input
                  id="two-factor-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <Field>
                <FieldLabel>Wiederherstellungscodes</FieldLabel>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-3 font-mono text-xs">
                  {setup.backupCodes.map((backupCode) => (
                    <span key={backupCode}>{backupCode}</span>
                  ))}
                </div>
                <FieldDescription>
                  Speichere diese Codes jetzt an einem sicheren Ort.
                </FieldDescription>
              </Field>
            </>
          )}
        </DialogPanel>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            disabled={setup ? code.length !== 6 : !password}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {enabled ? "Deaktivieren" : setup ? "Code bestätigen" : "Weiter"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
