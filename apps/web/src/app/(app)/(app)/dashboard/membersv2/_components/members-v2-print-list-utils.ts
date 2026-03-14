"use client";

export type MembersPrintListOptions = {
	title: string;
	columnCount: number;
	includeHeader: boolean;
	columnHeaders: string[];
	extraLines: number;
	showDate: boolean;
	pageOrientation: "portrait" | "landscape";
	rowDensity: "compact" | "default" | "comfortable";
	memberDetailColumns: Array<"email" | "phone" | "groups">;
	sortOverride: "current" | "first-name-asc" | "last-name-asc";
};

export const DEFAULT_MEMBERS_PRINT_TITLE = "Mitgliederliste";

type PrintMember = {
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
	phone?: string | null;
	groupMembers?: Array<{
		group?: {
			name?: string | null;
		} | null;
	} | null> | null;
};

function getBaseMemberPrintName(member: PrintMember): string {
	const fullName = `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
	if (fullName) {
		return fullName;
	}
	if (member.email) {
		return member.email;
	}
	if (member.phone) {
		return member.phone;
	}
	return "Unbenanntes Mitglied";
}

export function getMemberPrintName(member: PrintMember): string {
	return getBaseMemberPrintName(member);
}

export function getMemberDetailValue(
	member: PrintMember,
	column: MembersPrintListOptions["memberDetailColumns"][number],
): string {
	if (column === "email") {
		return member.email?.trim() ?? "";
	}

	if (column === "phone") {
		return member.phone?.trim() ?? "";
	}

	return (member.groupMembers ?? [])
		.map((groupMember) => groupMember?.group?.name?.trim() ?? "")
		.filter((name) => name.length > 0)
		.join(", ");
}

export function sortMembersForPrint<T extends PrintMember>(
	members: T[],
	sortOverride: MembersPrintListOptions["sortOverride"],
): T[] {
	if (sortOverride === "current") {
		return members;
	}

	const sorted = [...members];
	sorted.sort((left, right) => {
		const leftValue =
			sortOverride === "first-name-asc"
				? (left.firstName ?? "").trim()
				: (left.lastName ?? "").trim();
		const rightValue =
			sortOverride === "first-name-asc"
				? (right.firstName ?? "").trim()
				: (right.lastName ?? "").trim();

		const primaryComparison = leftValue.localeCompare(rightValue, "de", {
			sensitivity: "base",
		});
		if (primaryComparison !== 0) {
			return primaryComparison;
		}

		return getBaseMemberPrintName(left).localeCompare(
			getBaseMemberPrintName(right),
			"de",
			{ sensitivity: "base" },
		);
	});

	return sorted;
}

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

export function formatMembersPrintDate(now: Date = new Date()): string {
	return new Intl.DateTimeFormat("de-DE", {
		dateStyle: "medium",
	}).format(now);
}

function getMemberColumnWidth(options: MembersPrintListOptions): number {
	if (options.memberDetailColumns.length === 0) {
		return Math.max(38, 62 - options.columnCount * 4);
	}

	return Math.max(
		28,
		52 - options.columnCount * 3 - options.memberDetailColumns.length * 6,
	);
}

function getDensityStyles(options: MembersPrintListOptions) {
	if (options.rowDensity === "compact") {
		return {
			cellPadding: "5px 6px",
			cellHeight: "26px",
			cellFontSize: "11px",
			titleSize: "18px",
			metaSize: "11px",
		};
	}

	if (options.rowDensity === "comfortable") {
		return {
			cellPadding: "9px 10px",
			cellHeight: "38px",
			cellFontSize: "13px",
			titleSize: "22px",
			metaSize: "13px",
		};
	}

	return {
		cellPadding: "7px 8px",
		cellHeight: "32px",
		cellFontSize: "12px",
		titleSize: "20px",
		metaSize: "12px",
	};
}

export function buildMembersPrintListHtml({
	memberRows,
	options,
}: {
	memberRows: Array<{
		name: string;
		details: string[];
	}>;
	options: MembersPrintListOptions;
}): string {
	const totalRows = memberRows.length + options.extraLines;
	const headers = options.columnHeaders.slice(0, options.columnCount);
	const documentTitle = options.title.trim() || DEFAULT_MEMBERS_PRINT_TITLE;
	const printDate = formatMembersPrintDate();
	const density = getDensityStyles(options);
	const detailColumnLabels = options.memberDetailColumns.map((column) =>
		column === "email" ? "E-Mail" : column === "phone" ? "Telefon" : "Gruppen",
	);
	const tableHeaderCells = options.includeHeader
		? `
			<tr>
				<th>Mitglied</th>
				${detailColumnLabels.map((label) => `<th>${label}</th>`).join("")}
				${headers.map((header) => `<th>${escapeHtml(header || " ")}</th>`).join("")}
			</tr>
		`
		: "";
	const tableBodyRows = Array.from({ length: totalRows }, (_, index) => {
		const memberRow = memberRows[index];
		const memberName = memberRow?.name ?? "";
		const detailCells = memberRow?.details ?? [];
		return `
			<tr>
				<td class="member-name">${escapeHtml(memberName)}</td>
				${options.memberDetailColumns
					.map((_, detailIndex) => `<td>${escapeHtml(detailCells[detailIndex] ?? "")}</td>`)
					.join("")}
				${Array.from({ length: options.columnCount }, () => "<td></td>").join("")}
			</tr>
		`;
	}).join("");

	return `<!doctype html>
<html lang="de">
	<head>
		<meta charset="utf-8" />
		<title>${escapeHtml(documentTitle)}</title>
		<style>
			@page {
				size: A4 ${options.pageOrientation};
				margin: 12mm;
			}

			:root {
				--ink: #111827;
				--muted-ink: #4b5563;
				--grid: #9ca3af;
				--grid-strong: #6b7280;
				--header-fill: #e5e7eb;
				--stripe-fill: #f9fafb;
			}

			* {
				box-sizing: border-box;
			}

			body {
				font-family: "Helvetica Neue", Arial, sans-serif;
				color: var(--ink);
				margin: 0;
				background: #ffffff;
				-webkit-print-color-adjust: exact;
				print-color-adjust: exact;
				line-height: 1.35;
			}

			.print-shell {
				display: grid;
				gap: 14px;
			}

			.print-meta {
				display: flex;
				flex-wrap: wrap;
				gap: 8px 12px;
				align-items: baseline;
				padding-bottom: 2px;
			}

			h1 {
				font-size: ${density.titleSize};
				margin: 0;
				font-weight: 700;
				letter-spacing: -0.02em;
			}

			.print-summary {
				margin: 0;
				font-size: ${density.metaSize};
				color: var(--muted-ink);
			}

			table {
				width: 100%;
				border-collapse: collapse;
				table-layout: fixed;
				border: 1.5px solid var(--grid-strong);
			}

			th,
			td {
				border: 1px solid var(--grid);
				padding: ${density.cellPadding};
				height: ${density.cellHeight};
				font-size: ${density.cellFontSize};
				vertical-align: middle;
			}

			th {
				background: var(--header-fill);
				text-align: left;
				font-weight: 600;
				letter-spacing: 0.01em;
			}

			tbody tr:nth-child(even) td:not(:first-child) {
				background: var(--stripe-fill);
			}

			.member-name {
				width: ${getMemberColumnWidth(options)}%;
				font-weight: 500;
			}
		</style>
	</head>
	<body>
		<div class="print-shell">
			<div class="print-meta">
				<h1>${escapeHtml(documentTitle)}</h1>
				<p class="print-summary">${memberRows.length} ${
					memberRows.length === 1 ? "Mitglied" : "Mitglieder"
				}</p>
				${options.showDate ? `<p class="print-summary">Stand: ${escapeHtml(printDate)}</p>` : ""}
			</div>
			<table>
				<thead>${tableHeaderCells}</thead>
				<tbody>${tableBodyRows}</tbody>
			</table>
		</div>
	</body>
</html>`;
}
