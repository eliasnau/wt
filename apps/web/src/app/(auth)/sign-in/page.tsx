"use client";

import { authClient } from "@repo/auth/client";
import { useForm } from "@tanstack/react-form";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { toast } from "sonner";
import { Fingerprint } from "@/components/animate-ui/icons/fingerprint";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignIn() {
  const router = useRouter();
  const [redirectUrl] = useQueryState("redirectUrl", {
    defaultValue: "/dashboard",
  });
  const [invite] = useQueryState("invite");
  const showInvitationEmailBanner = invite === "1";
  const signUpHref = `/sign-up?redirectUrl=${encodeURIComponent(redirectUrl)}${showInvitationEmailBanner ? "&invite=1" : ""}`;

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
        },
        {
          onError: (ctx) => {
            toast.error(ctx.error.message);
          },
          onSuccess: (ctx) => {
            if (ctx.data.twoFactorRedirect) {
              router.push(
                `/verify-2fa?redirectUrl=${encodeURIComponent(redirectUrl)}` as Route,
              );
            } else {
              router.push(redirectUrl as Route);
            }
          },
        },
      );
    },
  });

  const handlePasskeySignIn = async () => {
    await authClient.signIn.passkey({
      fetchOptions: {
        onError: (ctx) => {
          toast.error(ctx.error.message || "Passkey authentication failed");
        },
        onSuccess: () => {
          router.push(redirectUrl as Route);
        },
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link
            href={"/" as Route}
            className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Zur Startseite
          </Link>
        </div>
        <Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
          <FramePanel>
            <h1 className="mb-4 font-heading text-2xl">Anmelden</h1>
            {showInvitationEmailBanner ? (
              <Alert variant="warning" className="mb-4">
                <AlertCircle />
                <AlertDescription>
                  Melde dich mit derselben E-Mail-Adresse an oder erstelle damit
                  ein Konto, an die du die Einladung erhalten hast. Falls du
                  bereits ein Konto mit einer anderen E-Mail-Adresse hast, bitte
                  den Organisations-Admin, die Einladung an diese Adresse zu
                  senden.
                </AlertDescription>
              </Alert>
            ) : null}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-3"
            >
              <form.Field
                name="email"
                validators={{
                  onBlur: ({ value }) => {
                    if (!value) return "E-Mail ist erforderlich";
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                      return "Ungültige E-Mail-Adresse";
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>E-Mail</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      placeholder="m@example.com"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
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
                    if (value.length < 8)
                      return "Das Passwort muss mindestens 8 Zeichen lang sein";
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor={field.name}>Passwort</Label>
                      <Link
                        href={
                          `/forgot-password${form.state.values.email ? `?email=${encodeURIComponent(form.state.values.email)}` : ""}` as Route
                        }
                        className="ml-auto inline-block text-sm underline"
                      >
                        Passwort vergessen?
                      </Link>
                    </div>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      placeholder="password"
                      autoComplete="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
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

              <form.Field name="rememberMe">
                {(field) => (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) =>
                        field.handleChange(checked as boolean)
                      }
                    />
                    <Label htmlFor={field.name}>Angemeldet bleiben</Label>
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
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Anmelden"
                    )}
                  </Button>
                )}
              </form.Subscribe>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Oder fortfahren mit
                  </span>
                </div>
              </div>
              <AnimateIcon animateOnHover>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  disabled={form.state.isSubmitting}
                  onClick={handlePasskeySignIn}
                >
                  <Fingerprint size={16} />
                  Passkey
                </Button>
              </AnimateIcon>
            </form>
          </FramePanel>

          <FrameFooter className="flex-row items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Don't have an account?{" "}
              <Link
                href={signUpHref as Route}
                className="text-foreground hover:underline"
              >
                Sign up
              </Link>
            </p>
          </FrameFooter>
        </Frame>
      </div>
    </div>
  );
}
