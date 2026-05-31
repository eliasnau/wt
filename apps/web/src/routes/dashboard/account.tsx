import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@matdesk/ui/components/card";
import { Label } from "@matdesk/ui/components/label";
import { createFileRoute } from "@tanstack/react-router";

import { useAuth } from "@/components/auth/auth-provider";
import { UserAvatar } from "@/components/auth/user-avatar";

export const Route = createFileRoute("/dashboard/account")({
  component: RouteComponent,
});

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <Label className="text-muted-foreground">{label}</Label>
      <p className="text-foreground">{value || "—"}</p>
    </div>
  );
}

function RouteComponent() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal account details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <UserAvatar
              className="size-14"
              image={user.image}
              name={user.name}
              seed={user.id}
            />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{user.name}</p>
              <p className="truncate text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={user.name} />
            <Field label="Email" value={user.email} />
            <Field
              label="Email verified"
              value={user.emailVerified ? "Yes" : "No"}
            />
            <Field label="User ID" value={user.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
