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
import { Field, FieldDescription, FieldLabel } from "@matdesk/ui/components/field";
import { Input } from "@matdesk/ui/components/input";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { parseError } from "evlog";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { UserAvatar } from "@/components/auth/user-avatar";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/account/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, refetchSession } = useAuth();
  const [name, setName] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    setName(user?.name ?? "");
    setImage(user?.image ?? "");
  }, [user]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.updateUser({
        name: name.trim(),
        image: image.trim() || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await refetchSession();
      toast.success("Profil aktualisiert");
    },
    onError: (error) => toast.error(parseError(error).message),
  });

  const changed = name.trim() !== (user?.name ?? "") || image.trim() !== (user?.image ?? "");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>
        <p className="mt-1 text-sm text-muted-foreground">So erscheinst du in matdesk.</p>
      </div>

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Persönliche Angaben</CardFrameTitle>
          <CardFrameDescription>Name und Profilbild deines Kontos.</CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <CardPanel className="flex flex-col gap-6">
            {user ? (
              <div className="flex items-center gap-4">
                <UserAvatar
                  className="size-14"
                  image={image || null}
                  name={name || user.name}
                  seed={user.id}
                />
                <div className="min-w-0">
                  <p className="truncate font-medium">{name || user.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="profile-name">Name</FieldLabel>
                <Input
                  autoComplete="name"
                  id="profile-name"
                  onChange={(event) => setName(event.target.value)}
                  value={name}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="profile-email">E-Mail-Adresse</FieldLabel>
                <Input disabled id="profile-email" value={user?.email ?? ""} />
                <FieldDescription>
                  Die E-Mail-Adresse kann derzeit nicht geändert werden.
                </FieldDescription>
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="profile-image">Profilbild-URL</FieldLabel>
                <Input
                  id="profile-image"
                  inputMode="url"
                  onChange={(event) => setImage(event.target.value)}
                  placeholder="https://…"
                  value={image}
                />
                <FieldDescription>
                  Optional, verwende eine direkte URL zu einem Bild.
                </FieldDescription>
              </Field>
            </div>
          </CardPanel>
        </Card>
        <CardFrameFooter className="flex justify-end">
          <Button
            disabled={!changed || name.trim() === ""}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
            size="sm"
          >
            Speichern
          </Button>
        </CardFrameFooter>
      </CardFrame>
    </div>
  );
}
