"use client";

import { Loader2, PrinterIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetPanel,
	SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
	DEFAULT_MEMBERS_PRINT_TITLE,
	type MembersPrintListOptions,
} from "./members-v2-print-list-utils";

type MembersV2PrintListSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onPrintList: (options: MembersPrintListOptions) => void;
	printPending: boolean;
};


export function MembersV2PrintListSheet({
	open,
	onOpenChange,
	onPrintList,
	printPending,
}: MembersV2PrintListSheetProps) {
	const [title, setTitle] = useState(DEFAULT_MEMBERS_PRINT_TITLE);
	const [columnCount, setColumnCount] = useState("3");
	const [includeHeader, setIncludeHeader] = useState(true);
	const [columnHeaderSheetOpen, setColumnHeaderSheetOpen] = useState(false);
	const [columnHeaders, setColumnHeaders] = useState(["", "", ""]);
	const [extraLines, setExtraLines] = useState("3");
	const [showDate, setShowDate] = useState(true);
	const [pageOrientation, setPageOrientation] =
		useState<MembersPrintListOptions["pageOrientation"]>("portrait");
	const [rowDensity, setRowDensity] =
		useState<MembersPrintListOptions["rowDensity"]>("default");
	const [memberDetailColumns, setMemberDetailColumns] = useState<
		MembersPrintListOptions["memberDetailColumns"]
	>([]);
	const [sortOverride, setSortOverride] =
		useState<MembersPrintListOptions["sortOverride"]>("last-name-asc");

	const parsedColumnCount = Number.parseInt(columnCount, 10);
	const safeColumnCount =
		Number.isFinite(parsedColumnCount) && parsedColumnCount >= 1
			? Math.min(parsedColumnCount, 6)
			: 1;
	const parsedExtraLines = Number.parseInt(extraLines, 10);
	const safeExtraLines =
		Number.isFinite(parsedExtraLines) && parsedExtraLines >= 0
			? Math.min(parsedExtraLines, 25)
			: 0;

	const previewOptions = useMemo<MembersPrintListOptions>(
		() => ({
			title: title.trim() || DEFAULT_MEMBERS_PRINT_TITLE,
			columnCount: safeColumnCount,
			includeHeader,
			columnHeaders: columnHeaders.slice(0, safeColumnCount).map((header) => header.trim()),
			extraLines: safeExtraLines,
			showDate,
			pageOrientation,
			rowDensity,
			memberDetailColumns,
			sortOverride,
		}),
		[
			columnHeaders,
			includeHeader,
			memberDetailColumns,
			pageOrientation,
			rowDensity,
			safeColumnCount,
			safeExtraLines,
			showDate,
			sortOverride,
			title,
		],
	);

	const handleColumnCountChange = (value: string) => {
		setColumnCount(value);
		const parsedValue = Number.parseInt(value, 10);
		const nextColumnCount =
			Number.isFinite(parsedValue) && parsedValue >= 1
				? Math.min(parsedValue, 6)
				: 1;

		setColumnHeaders((current) =>
			Array.from({ length: nextColumnCount }, (_, index) => current[index] ?? ""),
		);
	};
	const filledColumnHeaderCount = columnHeaders
		.slice(0, safeColumnCount)
		.filter((header) => header.trim().length > 0).length;

	const handlePrint = () => {
		onPrintList(previewOptions);
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full sm:max-w-2xl">
				<SheetHeader>
					<SheetTitle>Liste drucken</SheetTitle>
					<SheetDescription>
						Konfiguriere Titel, Zusatzspalten und Layout der Druckliste.
					</SheetDescription>
				</SheetHeader>
				<SheetPanel>
					<div className="space-y-6">
						<div className="space-y-2">
							<p className="font-medium text-sm">Titel</p>
							<InputGroup>
								<InputGroupInput
									type="text"
									value={title}
									onChange={(event) => setTitle(event.target.value)}
									placeholder={DEFAULT_MEMBERS_PRINT_TITLE}
								/>
							</InputGroup>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<p className="font-medium text-sm">Zusätzliche Spalten</p>
								<InputGroup>
									<InputGroupInput
										type="number"
										min={1}
										max={6}
										value={columnCount}
										onChange={(event) =>
											handleColumnCountChange(event.target.value)
										}
									/>
								</InputGroup>
							</div>

							<div className="space-y-2">
								<p className="font-medium text-sm">Zusätzliche Leerzeilen</p>
								<InputGroup>
									<InputGroupInput
										type="number"
										min={0}
										max={25}
										value={extraLines}
										onChange={(event) => setExtraLines(event.target.value)}
									/>
								</InputGroup>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<p className="font-medium text-sm">Seite</p>
								<Select
									items={[
										{ label: "Hochformat", value: "portrait" },
										{ label: "Querformat", value: "landscape" },
									]}
									value={pageOrientation}
									onValueChange={(value) => {
										if (!value) return;
										setPageOrientation(
											value as MembersPrintListOptions["pageOrientation"],
										);
									}}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectPopup>
										<SelectItem value="portrait">Hochformat</SelectItem>
										<SelectItem value="landscape">Querformat</SelectItem>
									</SelectPopup>
								</Select>
							</div>

							<div className="space-y-2">
								<p className="font-medium text-sm">Zeilenhöhe</p>
								<Select
									items={[
										{ label: "Kompakt", value: "compact" },
										{ label: "Standard", value: "default" },
										{ label: "Großzügig", value: "comfortable" },
									]}
									value={rowDensity}
									onValueChange={(value) => {
										if (!value) return;
										setRowDensity(value as MembersPrintListOptions["rowDensity"]);
									}}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectPopup>
										<SelectItem value="compact">Kompakt</SelectItem>
										<SelectItem value="default">Standard</SelectItem>
										<SelectItem value="comfortable">Großzügig</SelectItem>
									</SelectPopup>
								</Select>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<p className="font-medium text-sm">Zusätzliche Mitgliederspalten</p>
								<Select
									aria-label="Zusätzliche Mitgliederspalten auswählen"
									items={[
										{ label: "E-Mail", value: "email" },
										{ label: "Telefon", value: "phone" },
										{ label: "Gruppen", value: "groups" },
									]}
									value={memberDetailColumns}
									multiple
									onValueChange={(value) => {
										if (!Array.isArray(value)) return;
										setMemberDetailColumns(
											value as MembersPrintListOptions["memberDetailColumns"],
										);
									}}
								>
									<SelectTrigger>
										<SelectValue>
											{(value) => {
												if (!Array.isArray(value) || value.length === 0) {
													return "Keine";
												}

												const labels = value.map((entry) =>
													entry === "email"
														? "E-Mail"
														: entry === "phone"
															? "Telefon"
															: "Gruppen",
												);
												const firstLabel = labels[0] ?? "";
												return labels.length > 1
													? `${firstLabel} (+${labels.length - 1})`
													: firstLabel;
											}}
										</SelectValue>
									</SelectTrigger>
									<SelectPopup alignItemWithTrigger={false}>
										<SelectItem value="email">E-Mail</SelectItem>
										<SelectItem value="phone">Telefon</SelectItem>
										<SelectItem value="groups">Gruppen</SelectItem>
									</SelectPopup>
								</Select>
							</div>

							<div className="space-y-2">
								<p className="font-medium text-sm">Sortierung für Druck</p>
								<Select
									items={[
										{ label: "Aktuelle Sortierung", value: "current" },
										{ label: "Vorname A-Z", value: "first-name-asc" },
										{ label: "Nachname A-Z", value: "last-name-asc" },
									]}
									value={sortOverride}
									onValueChange={(value) => {
										if (!value) return;
										setSortOverride(
											value as MembersPrintListOptions["sortOverride"],
										);
									}}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectPopup>
										<SelectItem value="current">Aktuelle Sortierung</SelectItem>
										<SelectItem value="first-name-asc">Vorname A-Z</SelectItem>
										<SelectItem value="last-name-asc">Nachname A-Z</SelectItem>
									</SelectPopup>
								</Select>
							</div>
						</div>

						<div className="space-y-4">
							<div className="flex items-center justify-between gap-3">
								<div>
									<p className="font-medium text-sm">Überschrift anzeigen</p>
									<p className="text-muted-foreground text-xs">
										Erlaubt Namen wie Anwesenheit oder Unterschrift.
									</p>
								</div>
								<Switch checked={includeHeader} onCheckedChange={setIncludeHeader} />
							</div>

							<div className="flex items-center justify-between gap-3">
								<div>
									<p className="font-medium text-sm">Stand anzeigen</p>
									<p className="text-muted-foreground text-xs">
										Zeigt optional "Stand: Datum" im Kopfbereich.
									</p>
								</div>
								<Switch checked={showDate} onCheckedChange={setShowDate} />
							</div>
						</div>

						{includeHeader ? (
							<div className="space-y-4 border-t pt-5">
								<div className="flex items-start justify-between gap-3">
									<div>
										<p className="font-medium text-sm">Spaltennamen</p>
										<p className="text-muted-foreground text-xs">
											Optional. Nur nötig, wenn du die Überschriften wirklich
											beschriften willst.
										</p>
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setColumnHeaderSheetOpen(true)}
									>
										Namen bearbeiten
									</Button>
								</div>
								<p className="text-muted-foreground text-xs">
									{filledColumnHeaderCount > 0
										? `${filledColumnHeaderCount} von ${safeColumnCount} Spalten benannt`
										: "Keine Spaltennamen gesetzt"}
								</p>
							</div>
						) : null}
					</div>
				</SheetPanel>
				<SheetFooter>
					<SheetClose render={<Button variant="outline" disabled={printPending} />}>
						Abbrechen
					</SheetClose>
					<Button onClick={handlePrint} disabled={printPending}>
						{printPending ? <Loader2 className="animate-spin" /> : <PrinterIcon />}
						Drucken
					</Button>
				</SheetFooter>
			</SheetContent>

			<Sheet open={columnHeaderSheetOpen} onOpenChange={setColumnHeaderSheetOpen}>
				<SheetContent side="right" className="w-full sm:max-w-lg">
					<SheetHeader>
						<SheetTitle>Spaltennamen</SheetTitle>
						<SheetDescription>
							Benennungen für die gedruckten Zusatzspalten festlegen.
						</SheetDescription>
					</SheetHeader>
					<SheetPanel>
						<div className="space-y-3">
							<p className="text-muted-foreground text-xs">
								{safeColumnCount} {safeColumnCount === 1 ? "Spalte" : "Spalten"}
							</p>
							<div className="grid gap-3">
								{Array.from({ length: safeColumnCount }, (_, index) => (
									<InputGroup key={`print-column-sheet-${index + 1}`}>
										<InputGroupAddon>{index + 1}</InputGroupAddon>
										<InputGroupInput
											type="text"
											placeholder={`Spalte ${index + 1}`}
											value={columnHeaders[index] ?? ""}
											onChange={(event) =>
												setColumnHeaders((current) =>
													current.map((header, currentIndex) =>
														currentIndex === index ? event.target.value : header,
													),
												)
											}
										/>
									</InputGroup>
								))}
							</div>
						</div>
					</SheetPanel>
					<SheetFooter>
						<SheetClose render={<Button variant="outline" />}>
							Fertig
						</SheetClose>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</Sheet>
	);
}
