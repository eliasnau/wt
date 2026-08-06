"use client";

import { Button } from "@matdesk/ui/components/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@matdesk/ui/components/input-group";
import { useForm } from "@tanstack/react-form";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AtSignIcon, KeyRoundIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";

import { AuthSplitShell, InvitationBanner } from "@/components/auth/auth-split-shell";
import { FieldError } from "@/components/auth/field-error";
import { authClient } from "@/lib/auth-client";
import { safeRedirectUrl } from "@/lib/redirect-url";

export const Route = createFileRoute("/_auth/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  const { invite, redirectUrl: rawRedirectUrl } = Route.useSearch();
  const navigate = useNavigate();
  const redirectUrl = safeRedirectUrl(rawRedirectUrl);

  const form = useForm({
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          name: `${value.firstName} ${value.lastName}`,
          password: value.password,
        },
        {
          onError: (ctx) => {
            toast.error(ctx.error.message);
          },
          onSuccess: () => {
            void navigate({ href: redirectUrl });
          },
        },
      );
    },
  });

  return (
    <AuthSplitShell>
      <div className="flex flex-col space-y-1">
        <h1 className="font-bold text-2xl tracking-wide">Erstelle dein Konto</h1>
        <p className="text-base text-muted-foreground">Erstelle ein Konto, um loszulegen.</p>
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
        <div className="grid grid-cols-2 gap-3">
          <form.Field
            name="firstName"
            validators={{
              onBlur: ({ value }) => {
                if (!value) return "Vorname ist erforderlich";
                if (value.length < 2) {
                  return "Vorname muss mindestens 2 Zeichen lang sein";
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-1.5">
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <UserIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    autoComplete="given-name"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Vorname"
                    value={field.state.value}
                  />
                </InputGroup>
                <FieldError {...field.state.meta} />
              </div>
            )}
          </form.Field>

          <form.Field
            name="lastName"
            validators={{
              onBlur: ({ value }) => {
                if (!value) return "Nachname ist erforderlich";
                if (value.length < 2) {
                  return "Nachname muss mindestens 2 Zeichen lang sein";
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-1.5">
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <UserIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    autoComplete="family-name"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Nachname"
                    value={field.state.value}
                  />
                </InputGroup>
                <FieldError {...field.state.meta} />
              </div>
            )}
          </form.Field>
        </div>

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
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <KeyRoundIcon />
                </InputGroupAddon>
                <InputGroupInput
                  autoComplete="new-password"
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

        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button className="w-full" disabled={!canSubmit} loading={isSubmitting} type="submit">
              Konto erstellen
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="text-muted-foreground text-xs leading-relaxed">
        Mit dem Klick auf „Konto erstellen“ stimmst du unseren Nutzungsbedingungen und unserer
        Datenschutzerklärung zu.
      </p>

      <p className="text-muted-foreground text-sm">
        Du hast schon ein Konto?{" "}
        <Link
          className="underline underline-offset-4 hover:text-primary"
          search={{ invite, redirectUrl: rawRedirectUrl }}
          to="/sign-in"
        >
          Anmelden
        </Link>
      </p>
    </AuthSplitShell>
  );
}
