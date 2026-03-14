"use client";

import type { ListMembersAdvancedExportInput } from "@repo/api/routers/members/listMembersAdvanced";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { client } from "@/utils/orpc";
import {
	buildMembersPrintListHtml,
	getMemberDetailValue,
	getMemberPrintName,
	type MembersPrintListOptions,
	sortMembersForPrint,
} from "./members-v2-print-list-utils";

export function useMembersV2PrintList({
	exportInput,
	onPrintReady,
}: {
	exportInput: ListMembersAdvancedExportInput;
	onPrintReady?: () => void;
}) {
	return useMutation({
		mutationFn: async (options: MembersPrintListOptions) => {
			const result = await client.members.printList(exportInput);
			return {
				...result,
				options,
			};
		},
		onSuccess: ({ members, rowCount, options }) => {
			if (rowCount === 0) {
				toast.error("Keine Mitglieder zum Drucken", {
					description: "Die aktuellen Filter liefern keine Mitglieder.",
				});
				return;
			}

			const printWindow = window.open("", "_blank");
			if (!printWindow) {
				toast.error("Druckfenster konnte nicht geöffnet werden", {
					description:
						"Bitte erlaube Pop-ups für diese Seite und versuche es erneut.",
				});
				return;
			}

			const sortedMembers = sortMembersForPrint(members, options.sortOverride);
			const memberRows = sortedMembers.map((member) => ({
				name: getMemberPrintName(member),
				details: options.memberDetailColumns.map((column) =>
					getMemberDetailValue(member, column),
				),
			}));
			const html = buildMembersPrintListHtml({
				memberRows,
				options,
			});

			printWindow.document.open();
			printWindow.document.write(html);
			printWindow.document.close();
			onPrintReady?.();

			window.setTimeout(() => {
				printWindow.focus();
				printWindow.print();
			}, 250);
		},
		onError: (mutationError) => {
			toast.error("Druckliste konnte nicht erstellt werden", {
				description:
					mutationError instanceof Error
						? mutationError.message
						: "Bitte versuche es erneut.",
			});
		},
	});
}
