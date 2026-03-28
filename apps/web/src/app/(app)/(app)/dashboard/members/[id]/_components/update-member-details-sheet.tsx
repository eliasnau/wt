"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetPanel,
	SheetTitle,
} from "@/components/ui/sheet";
import { client, orpc } from "@/utils/orpc";

interface UpdateMemberDetailsSheetProps {
	memberId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialValues: {
		firstName: string;
		lastName: string;
		birthdate: string;
		email: string;
		phone: string;
		street: string;
		city: string;
		state: string;
		postalCode: string;
		country: string;
	};
}

export function UpdateMemberDetailsSheet({
	memberId,
	open,
	onOpenChange,
	initialValues,
}: UpdateMemberDetailsSheetProps) {
	const queryClient = useQueryClient();
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [birthdate, setBirthdate] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [street, setStreet] = useState("");
	const [city, setCity] = useState("");
	const [state, setState] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [country, setCountry] = useState("");

	useEffect(() => {
		if (!open) return;
		setFirstName(initialValues.firstName);
		setLastName(initialValues.lastName);
		setBirthdate(initialValues.birthdate);
		setEmail(initialValues.email);
		setPhone(initialValues.phone);
		setStreet(initialValues.street);
		setCity(initialValues.city);
		setState(initialValues.state);
		setPostalCode(initialValues.postalCode);
		setCountry(initialValues.country);
	}, [initialValues, open]);

	const updateMutation = useMutation({
		mutationFn: async () =>
			client.members.updateMemberDetails({
				memberId,
				firstName,
				lastName,
				birthdate,
				email,
				phone,
				street,
				city,
				state,
				postalCode,
				country,
			}),
		onSuccess: async () => {
			toast.success("Mitgliedsdaten aktualisiert");
			onOpenChange(false);
			await queryClient.invalidateQueries({
				queryKey: orpc.members.get.queryKey({
					input: { memberId },
				}),
			});
		},
		onError: (error) => {
			toast.error("Mitgliedsdaten konnten nicht gespeichert werden", {
				description:
					error instanceof Error ? error.message : "Ein Fehler ist aufgetreten",
			});
		},
	});

	const isValid =
		firstName.trim().length > 0 &&
		lastName.trim().length > 0 &&
		street.trim().length > 0 &&
		city.trim().length > 0 &&
		state.trim().length > 0 &&
		postalCode.trim().length > 0 &&
		country.trim().length > 0;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="sm:max-w-2xl">
				<SheetHeader>
					<SheetTitle>Mitgliedsdaten bearbeiten</SheetTitle>
					<SheetDescription>
						Aktualisiere persönliche Daten und Adresse des Mitglieds.
					</SheetDescription>
				</SheetHeader>
				<SheetPanel>
					<div className="grid gap-5 sm:grid-cols-2">
						<div className="space-y-2">
							<label htmlFor="member-first-name" className="block font-medium text-sm">
								Vorname
							</label>
							<Input
								id="member-first-name"
								value={firstName}
								onChange={(event) => setFirstName(event.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="member-last-name" className="block font-medium text-sm">
								Nachname
							</label>
							<Input
								id="member-last-name"
								value={lastName}
								onChange={(event) => setLastName(event.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="member-birthdate" className="block font-medium text-sm">
								Geburtsdatum
							</label>
							<Input
								id="member-birthdate"
								type="date"
								value={birthdate}
								onChange={(event) => setBirthdate(event.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="member-email" className="block font-medium text-sm">
								E-Mail
							</label>
							<Input
								id="member-email"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder="name@beispiel.de"
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="member-phone" className="block font-medium text-sm">
								Telefon
							</label>
							<Input
								id="member-phone"
								type="tel"
								value={phone}
								onChange={(event) => setPhone(event.target.value)}
								placeholder="+49 ..."
							/>
						</div>

						<div className="sm:col-span-2">
							<div className="grid gap-5 sm:grid-cols-2">
								<div className="space-y-2 sm:col-span-2">
									<label htmlFor="member-street" className="block font-medium text-sm">
										Straße
									</label>
									<Input
										id="member-street"
										value={street}
										onChange={(event) => setStreet(event.target.value)}
									/>
								</div>

								<div className="space-y-2">
									<label htmlFor="member-postal-code" className="block font-medium text-sm">
										PLZ
									</label>
									<Input
										id="member-postal-code"
										value={postalCode}
										onChange={(event) => setPostalCode(event.target.value)}
									/>
								</div>

								<div className="space-y-2">
									<label htmlFor="member-city" className="block font-medium text-sm">
										Stadt
									</label>
									<Input
										id="member-city"
										value={city}
										onChange={(event) => setCity(event.target.value)}
									/>
								</div>

								<div className="space-y-2">
									<label htmlFor="member-state" className="block font-medium text-sm">
										Bundesland
									</label>
									<Input
										id="member-state"
										value={state}
										onChange={(event) => setState(event.target.value)}
									/>
								</div>

								<div className="space-y-2">
									<label htmlFor="member-country" className="block font-medium text-sm">
										Land
									</label>
									<Input
										id="member-country"
										value={country}
										onChange={(event) => setCountry(event.target.value)}
									/>
								</div>
							</div>
						</div>
					</div>
				</SheetPanel>
				<SheetFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={updateMutation.isPending}
					>
						Abbrechen
					</Button>
					<Button
						onClick={() => updateMutation.mutate()}
						disabled={!isValid || updateMutation.isPending}
					>
						{updateMutation.isPending ? "Speichere..." : "Speichern"}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
