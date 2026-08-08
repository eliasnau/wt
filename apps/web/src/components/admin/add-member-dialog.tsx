"use client";

import { type RoleName, roleMetadata } from "@matdesk/auth/permissions";
import { Button } from "@matdesk/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@matdesk/ui/components/dialog";
import { Field, FieldLabel } from "@matdesk/ui/components/field";
import { Form } from "@matdesk/ui/components/form";
import { Input } from "@matdesk/ui/components/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@matdesk/ui/components/select";
import { useMutation } from "@tanstack/react-query";
import { parseError } from "evlog";
import { useState } from "react";
import { toast } from "sonner";

import { orpc, queryClient } from "@/utils/orpc";

/** Platform admins may set any role, including owner. */
const ROLE_OPTIONS = (Object.keys(roleMetadata) as RoleName[]).map((role) => ({
  label: roleMetadata[role].label,
  value: role,
}));

export function AddMemberDialog({
  organizationId,
  open,
  onOpenChange,
}: {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleName>("staff");

  const mutation = useMutation(
    orpc.admin.organizations.addMember.mutationOptions({
      onSuccess: () => {
        toast.success("Mitglied hinzugefügt");
        queryClient.invalidateQueries({ queryKey: orpc.admin.organizations.key() });
        onOpenChange(false);
        setEmail("");
        setRole("staff");
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mitglied hinzufügen</DialogTitle>
          <DialogDescription>
            Füge einen bestehenden Benutzer per E-Mail zu dieser Organisation hinzu.
          </DialogDescription>
        </DialogHeader>
        <Form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({ organizationId, email, role });
          }}
        >
          <DialogPanel className="grid gap-4">
            <Field>
              <FieldLabel>E-Mail</FieldLabel>
              <Input
                onChange={(e) => setEmail(e.target.value)}
                placeholder="person@example.com"
                type="email"
                value={email}
              />
            </Field>
            <Field>
              <FieldLabel>Rolle</FieldLabel>
              <Select
                items={ROLE_OPTIONS}
                onValueChange={(value) => setRole(value as RoleName)}
                value={role}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Abbrechen</DialogClose>
            <Button disabled={!email} loading={mutation.isPending} type="submit">
              Hinzufügen
            </Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  );
}
