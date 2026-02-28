"use client";

import { authClient } from "@repo/auth/client";
import { useForm } from "@tanstack/react-form";
import {
  AlertCircle,
  AtSignIcon,
  ChevronLeftIcon,
  KeyRoundIcon,
  UserIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import posthog from "posthog-js";
import { toast } from "sonner";
import { FloatingPaths } from "@/components/floating-paths";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export default function SignUp2Page() {
  const router = useRouter();
  const [redirectUrl] = useQueryState("redirectUrl", {
    defaultValue: "/dashboard",
  });
  const [invite] = useQueryState("invite");
  const showInvitationEmailBanner = invite === "1";

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: `${value.firstName} ${value.lastName}`,
        },
        {
          onError: (ctx) => {
            toast.error(ctx.error.message);
          },
          onSuccess: () => {
            posthog.capture("auth:sign-up", {
              auth_method: "email",
            });

            router.push(redirectUrl as Route);
          },
        },
      );
    },
  });

  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      <div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
        <Logo className="mr-auto h-4.5" monochrome />

        <div className="z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl">&ldquo;I am a cool qoute.&rdquo;</p>
            <footer className="font-mono font-semibold text-sm">
              ~ Someone
            </footer>
          </blockquote>
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

        <Button
          className="absolute top-7 left-5"
          variant="ghost"
          render={<Link href={"/" as Route} />}
        >
          <ChevronLeftIcon data-icon="inline-start" />
          Startseite
        </Button>

        <div className="mx-auto w-full max-w-sm space-y-4">
          <Logo className="h-4.5 lg:hidden" monochrome />
          <div className="flex flex-col space-y-1">
            <h1 className="font-bold text-2xl tracking-wide">
              Erstelle dein Konto
            </h1>
            <p className="text-base text-muted-foreground">
              Erstelle ein konto um loszulegen.
            </p>
          </div>
          {showInvitationEmailBanner ? (
            <div className="rounded-lg border border-warning/35 bg-warning/6 px-3 py-2">
              <p className="flex items-start gap-2 text-muted-foreground text-xs leading-relaxed">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-warning" />
                <span>
                  Melde dich mit derselben E-Mail-Adresse an oder erstelle damit
                  ein Konto, an die du die Einladung erhalten hast. Falls du
                  bereits ein Konto mit einer anderen E-Mail-Adresse hast, bitte
                  den Organisations-Admin, die Einladung an diese Adresse zu
                  senden.
                </span>
              </p>
            </div>
          ) : null}

          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
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
                        id={field.name}
                        name={field.name}
                        placeholder="Vorname"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </InputGroup>
                    {field.state.meta.isTouched &&
                      !field.state.meta.isValidating &&
                      field.state.meta.errors.length > 0 && (
                        <p className="text-destructive text-xs">
                          {field.state.meta.errors[0]}
                        </p>
                      )}
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
                        id={field.name}
                        name={field.name}
                        placeholder="Nachname"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </InputGroup>
                    {field.state.meta.isTouched &&
                      !field.state.meta.isValidating &&
                      field.state.meta.errors.length > 0 && (
                        <p className="text-destructive text-xs">
                          {field.state.meta.errors[0]}
                        </p>
                      )}
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
                      id={field.name}
                      name={field.name}
                      placeholder="your.email@example.com"
                      type="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </InputGroup>
                  {field.state.meta.isTouched &&
                    !field.state.meta.isValidating &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-destructive text-xs">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
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
                      id={field.name}
                      name={field.name}
                      placeholder="Passwort"
                      type="password"
                      autoComplete="new-password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </InputGroup>
                  {field.state.meta.isTouched &&
                    !field.state.meta.isValidating &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-destructive text-xs">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                </div>
              )}
            </form.Field>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? "Wird erstellt..." : "Konto erstellen"}
                </Button>
              )}
            </form.Subscribe>
          </form>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Mit dem Klick auf „Konto erstellen“ stimmen Sie unseren{" "}
            <Link
              href={"/terms" as Route}
              className="underline underline-offset-4 hover:text-primary"
            >
              Nutzungsbedingungen
            </Link>{" "}
            und unserer{" "}
            <Link
              href={"/privacy" as Route}
              className="underline underline-offset-4 hover:text-primary"
            >
              Datenschutzerklärung
            </Link>{" "}
            zu.
          </p>

          {/*<p className="text-muted-foreground text-sm">
            Du hast schon ein Konto?{" "}
            <Link
              href={"/sign-in" as Route}
              className="underline underline-offset-4 hover:text-primary"
            >
              Anmelden
            </Link>
          </p>*/}
        </div>
      </div>
    </main>
  );
}
