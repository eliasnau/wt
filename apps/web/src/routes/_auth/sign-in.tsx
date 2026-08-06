"use client";

import { Button } from "@matdesk/ui/components/button";
import { Checkbox } from "@matdesk/ui/components/checkbox";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@matdesk/ui/components/input-group";
import { useForm } from "@tanstack/react-form";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AtSignIcon, FingerprintIcon, KeyRoundIcon } from "lucide-react";
import { toast } from "sonner";

import { AuthSplitShell, InvitationBanner } from "@/components/auth/auth-split-shell";
import { FieldError } from "@/components/auth/field-error";
import { authClient } from "@/lib/auth-client";
import { safeRedirectUrl } from "@/lib/redirect-url";

export const Route = createFileRoute("/_auth/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  const { invite, redirectUrl: rawRedirectUrl } = Route.useSearch();
  const navigate = useNavigate();
  const redirectUrl = safeRedirectUrl(rawRedirectUrl);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
          rememberMe: value.rememberMe,
        },
        {
          onError: (ctx) => {
            toast.error(ctx.error.message);
          },
          onSuccess: (ctx) => {
            // Password was right but a second factor is outstanding: better-auth
            // has only set its temporary two-factor cookie, not a session.
            if (ctx.data.twoFactorRedirect) {
              void navigate({
                search: { redirectUrl: rawRedirectUrl },
                to: "/verify-2fa",
              });
              return;
            }
            void navigate({ href: redirectUrl });
          },
        },
      );
    },
  });

  async function signInWithPasskey() {
    await authClient.signIn.passkey({
      fetchOptions: {
        onError: (ctx) => {
          toast.error(ctx.error.message || "Passkey-Anmeldung fehlgeschlagen");
        },
        onSuccess: () => {
          void navigate({ href: redirectUrl });
        },
      },
    });
  }

  return (
    <AuthSplitShell>
      <div className="flex flex-col space-y-1">
        <h1 className="font-bold text-2xl tracking-wide">Anmelden</h1>
        <p className="text-base text-muted-foreground">
          Melde dich mit deinem Konto an, um weiterzumachen.
        </p>
      </div>

      {invite ? <InvitationBanner /> : null}

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="email"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return "E-Mail ist erforderlich";
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return "Ungültige E-Mail-Adresse";
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className="space-y-1.5">
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <AtSignIcon />
                </InputGroupAddon>
                <InputGroupInput
                  autoComplete="email"
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="your.email@example.com"
                  type="email"
                  value={field.state.value}
                />
              </InputGroup>
              <FieldError {...field.state.meta} />
            </div>
          )}
        </form.Field>

        <form.Field
          name="password"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return "Passwort ist erforderlich";
              if (value.length < 8) {
                return "Das Passwort muss mindestens 8 Zeichen lang sein";
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground text-xs">Passwort</span>
                {/* Subscribed so the link picks up the email as it's typed. */}
                <form.Subscribe selector={(state) => state.values.email}>
                  {(email) => (
                    <Link
                      className="text-muted-foreground text-xs underline underline-offset-4 hover:text-foreground"
                      search={{ email: email || undefined }}
                      to="/forgot-password"
                    >
                      Passwort vergessen?
                    </Link>
                  )}
                </form.Subscribe>
              </div>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <KeyRoundIcon />
                </InputGroupAddon>
                <InputGroupInput
                  autoComplete="current-password"
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Passwort"
                  type="password"
                  value={field.state.value}
                />
              </InputGroup>
              <FieldError {...field.state.meta} />
            </div>
          )}
        </form.Field>

        <form.Field name="rememberMe">
          {(field) => (
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                checked={field.state.value}
                id={field.name}
                onCheckedChange={(checked) => field.handleChange(checked)}
              />
              <label className="cursor-pointer text-muted-foreground text-sm" htmlFor={field.name}>
                Angemeldet bleiben
              </label>
            </div>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ canSubmit, isSubmitting }) => (
            <>
              <Button className="w-full" disabled={!canSubmit} loading={isSubmitting} type="submit">
                Anmelden
              </Button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Oder fortfahren mit
                  </span>
                </div>
              </div>

              <Button
                className="w-full gap-2"
                disabled={isSubmitting}
                onClick={signInWithPasskey}
                type="button"
                variant="outline"
              >
                <FingerprintIcon />
                Passkey
              </Button>
            </>
          )}
        </form.Subscribe>
      </form>

      <p className="text-muted-foreground text-sm">
        Noch kein Konto?{" "}
        <Link
          className="underline underline-offset-4 hover:text-primary"
          search={{ invite, redirectUrl: rawRedirectUrl }}
          to="/sign-up"
        >
          Konto erstellen
        </Link>
      </p>
    </AuthSplitShell>
  );
}
