"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Save } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import {
  Header,
  HeaderActions,
  HeaderContent,
  HeaderDescription,
  HeaderTitle,
} from "../../../_components/page-header";
import { client, orpc } from "@/utils/orpc";

type Props = {
  id: string;
};

type RegistrationFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthdate: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  accountHolder: string;
  iban: string;
  bic: string;
};

export function SelfServiceRegistrationDetailPageClient({ id }: Props) {
  const { data, isPending, error, refetch } = useQuery(
    orpc.selfRegistrations.get.queryOptions({
      input: { id },
    }),
  );

  const [form, setForm] = useState<RegistrationFormState | null>(null);

  const hydratedForm = useMemo(() => {
    if (!data) return form;
    if (form) return form;
    return {
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: data.email || "",
      phone: data.phone || "",
      birthdate: data.birthdate || "",
      street: data.street || "",
      city: data.city || "",
      state: data.state || "",
      postalCode: data.postalCode || "",
      country: data.country || "",
      accountHolder: data.accountHolder || "",
      iban: data.iban || "",
      bic: data.bic || "",
    };
  }, [data, form]);

  const updateMutation = useMutation({
    mutationFn: async (next: RegistrationFormState) =>
      client.selfRegistrations.update({
        id,
        firstName: next.firstName,
        lastName: next.lastName,
        email: next.email,
        phone: next.phone,
        birthdate: next.birthdate,
        street: next.street,
        city: next.city,
        state: next.state,
        postalCode: next.postalCode,
        country: next.country,
        accountHolder: next.accountHolder,
        iban: next.iban,
        bic: next.bic,
      }),
    onSuccess: async () => {
      toast.success("Registrierung gespeichert");
      await refetch();
    },
    onError: (updateError) => {
      toast.error(updateError.message || "Registrierung konnte nicht gespeichert werden");
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async () => client.selfRegistrations.createMemberFromRegistration({ id }),
    onSuccess: async () => {
      toast.success("Mitglied erstellt");
      await refetch();
    },
    onError: (createError) => {
      toast.error(createError.message || "Mitglied konnte nicht erstellt werden");
    },
  });

  if (isPending) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Registrierung wird geladen</EmptyTitle>
          <EmptyDescription>Bitte einen Moment warten.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!data || error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Registrierung nicht gefunden</EmptyTitle>
          <EmptyDescription>
            Die Registrierung konnte nicht geladen werden.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href={"/dashboard/self-service/registrations" as Route} />}>
            Zurück zur Übersicht
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const memberAlreadyCreated = Boolean(data.memberId);

  return (
    <div className="flex flex-col gap-8">
      <Header>
        <HeaderContent>
          <HeaderTitle>Registrierung prüfen</HeaderTitle>
          <HeaderDescription>
            Daten prüfen, bearbeiten und anschließend Mitglied erstellen.
          </HeaderDescription>
        </HeaderContent>
        <HeaderActions>
          <Button
            variant="outline"
            render={<Link href={"/dashboard/self-service/registrations" as Route} />}
          >
            <ArrowLeft data-icon="inline-start" />
            Zurück
          </Button>
        </HeaderActions>
      </Header>

      <Frame>
        <FramePanel className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={data.code} readOnly />
            <Input value={data.memberId || "Noch kein Mitglied erstellt"} readOnly />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Vorname"
              value={hydratedForm?.firstName || ""}
              onChange={(event) =>
                setForm((prev) => ({ ...(prev || (hydratedForm as RegistrationFormState)), firstName: event.target.value }))
              }
            />
            <Input
              placeholder="Nachname"
              value={hydratedForm?.lastName || ""}
              onChange={(event) =>
                setForm((prev) => ({ ...(prev || (hydratedForm as RegistrationFormState)), lastName: event.target.value }))
              }
            />
            <Input
              placeholder="E-Mail"
              value={hydratedForm?.email || ""}
              onChange={(event) =>
                setForm((prev) => ({ ...(prev || (hydratedForm as RegistrationFormState)), email: event.target.value }))
              }
            />
            <Input
              placeholder="Telefon"
              value={hydratedForm?.phone || ""}
              onChange={(event) =>
                setForm((prev) => ({ ...(prev || (hydratedForm as RegistrationFormState)), phone: event.target.value }))
              }
            />
            <Input
              placeholder="Geburtsdatum (YYYY-MM-DD)"
              value={hydratedForm?.birthdate || ""}
              onChange={(event) =>
                setForm((prev) => ({ ...(prev || (hydratedForm as RegistrationFormState)), birthdate: event.target.value }))
              }
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Straße"
              value={hydratedForm?.street || ""}
              onChange={(event) =>
                setForm((prev) => ({ ...(prev || (hydratedForm as RegistrationFormState)), street: event.target.value }))
              }
            />
            <Input
              placeholder="Stadt"
              value={hydratedForm?.city || ""}
              onChange={(event) =>
                setForm((prev) => ({ ...(prev || (hydratedForm as RegistrationFormState)), city: event.target.value }))
              }
            />
            <Input
              placeholder="Bundesland"
              value={hydratedForm?.state || ""}
              onChange={(event) =>
                setForm((prev) => ({ ...(prev || (hydratedForm as RegistrationFormState)), state: event.target.value }))
              }
            />
            <Input
              placeholder="PLZ"
              value={hydratedForm?.postalCode || ""}
              onChange={(event) =>
                setForm((prev) => ({ ...(prev || (hydratedForm as RegistrationFormState)), postalCode: event.target.value }))
              }
            />
            <Input
              placeholder="Land"
              value={hydratedForm?.country || ""}
              onChange={(event) =>
                setForm((prev) => ({ ...(prev || (hydratedForm as RegistrationFormState)), country: event.target.value }))
              }
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Kontoinhaber"
              value={hydratedForm?.accountHolder || ""}
              onChange={(event) =>
                setForm((prev) => ({ ...(prev || (hydratedForm as RegistrationFormState)), accountHolder: event.target.value }))
              }
            />
            <Input
              placeholder="IBAN"
              value={hydratedForm?.iban || ""}
              onChange={(event) =>
                setForm((prev) => ({ ...(prev || (hydratedForm as RegistrationFormState)), iban: event.target.value }))
              }
            />
            <Input
              placeholder="BIC"
              value={hydratedForm?.bic || ""}
              onChange={(event) =>
                setForm((prev) => ({ ...(prev || (hydratedForm as RegistrationFormState)), bic: event.target.value }))
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => hydratedForm && updateMutation.mutate(hydratedForm)}
              disabled={updateMutation.isPending || !hydratedForm}
            >
              <Save data-icon="inline-start" />
              {updateMutation.isPending ? "Speichert..." : "Speichern"}
            </Button>
            <Button
              onClick={() => createMemberMutation.mutate()}
              disabled={createMemberMutation.isPending || memberAlreadyCreated}
            >
              <CheckCircle2 data-icon="inline-start" />
              {memberAlreadyCreated
                ? "Mitglied bereits erstellt"
                : createMemberMutation.isPending
                  ? "Erstellt Mitglied..."
                  : "Mitglied erstellen"}
            </Button>
          </div>
        </FramePanel>
      </Frame>
    </div>
  );
}
