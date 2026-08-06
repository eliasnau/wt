"use client";

import { Button } from "@matdesk/ui/components/button";
import { Field, FieldLabel } from "@matdesk/ui/components/field";
import { Form } from "@matdesk/ui/components/form";
import { Input } from "@matdesk/ui/components/input";
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from "@matdesk/ui/components/sheet";
import { useMutation } from "@tanstack/react-query";
import { parseError } from "evlog";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { orpc, queryClient } from "@/utils/orpc";

export type DetailsMember = {
  id: string;
  firstName: string;
  lastName: string;
  birthdate: string | null;
  email: string | null;
  phone: string | null;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export function MemberDetailsSheet({
  open,
  onOpenChange,
  member,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: DetailsMember;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    if (!open) return;
    setFirstName(member.firstName);
    setLastName(member.lastName);
    setBirthdate(member.birthdate ?? "");
    setEmail(member.email ?? "");
    setPhone(member.phone ?? "");
    setStreet(member.street);
    setCity(member.city);
    setPostalCode(member.postalCode);
    setState(member.state);
    setCountry(member.country);
  }, [open, member]);

  const mutation = useMutation(
    orpc.members.updateDetails.mutationOptions({
      onSuccess: () => {
        toast.success("Daten aktualisiert");
        queryClient.invalidateQueries({
          queryKey: orpc.members.get.key({ input: { memberId: member.id } }),
        });
        queryClient.invalidateQueries({ queryKey: orpc.members.query.key() });
        onOpenChange(false);
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  const canSubmit =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    street.trim() !== "" &&
    city.trim() !== "" &&
    postalCode.trim() !== "" &&
    state.trim() !== "" &&
    country.trim() !== "";

  function submit() {
    mutation.mutate({
      memberId: member.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthdate: birthdate || "",
      email: email.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country.trim(),
    });
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetPopup>
        <SheetHeader>
          <SheetTitle>Daten bearbeiten</SheetTitle>
          <SheetDescription>Persönliche Angaben und Anschrift des Mitglieds.</SheetDescription>
        </SheetHeader>
        <Form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <SheetPanel className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Vorname</FieldLabel>
                <Input onChange={(e) => setFirstName(e.target.value)} value={firstName} />
              </Field>
              <Field>
                <FieldLabel>Nachname</FieldLabel>
                <Input onChange={(e) => setLastName(e.target.value)} value={lastName} />
              </Field>
            </div>
            <Field>
              <FieldLabel>Geburtsdatum</FieldLabel>
              <Input onChange={(e) => setBirthdate(e.target.value)} type="date" value={birthdate} />
            </Field>
            <Field>
              <FieldLabel>E-Mail</FieldLabel>
              <Input onChange={(e) => setEmail(e.target.value)} type="email" value={email} />
            </Field>
            <Field>
              <FieldLabel>Telefon</FieldLabel>
              <Input onChange={(e) => setPhone(e.target.value)} type="tel" value={phone} />
            </Field>
            <Field>
              <FieldLabel>Straße & Hausnummer</FieldLabel>
              <Input onChange={(e) => setStreet(e.target.value)} value={street} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>PLZ</FieldLabel>
                <Input onChange={(e) => setPostalCode(e.target.value)} value={postalCode} />
              </Field>
              <Field>
                <FieldLabel>Stadt</FieldLabel>
                <Input onChange={(e) => setCity(e.target.value)} value={city} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Bundesland</FieldLabel>
                <Input onChange={(e) => setState(e.target.value)} value={state} />
              </Field>
              <Field>
                <FieldLabel>Land</FieldLabel>
                <Input onChange={(e) => setCountry(e.target.value)} value={country} />
              </Field>
            </div>
          </SheetPanel>
          <SheetFooter>
            <SheetClose render={<Button variant="ghost" />}>Abbrechen</SheetClose>
            <Button disabled={!canSubmit} loading={mutation.isPending} type="submit">
              Speichern
            </Button>
          </SheetFooter>
        </Form>
      </SheetPopup>
    </Sheet>
  );
}
