import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
	Card,
	CardFrame,
	CardFrameAction,
	CardFrameDescription,
	CardFrameHeader,
	CardFrameTitle,
	CardPanel,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ChartCardProps = {
	title: ReactNode;
	/** Small leading icon shown before the title. */
	icon?: LucideIcon;
	description?: ReactNode;
	/** Right-aligned slot in the header, e.g. a toggle or legend control. */
	action?: ReactNode;
	className?: string;
	panelClassName?: string;
	children: ReactNode;
};

/**
 * The shared shell for every chart on the statistics surface: a CardFrame with
 * a labelled header strip and a raised panel. Drop a real chart (or a
 * {@link ChartPlaceholder}) in as children.
 */
export function ChartCard({
	title,
	icon: Icon,
	description,
	action,
	className,
	panelClassName,
	children,
}: ChartCardProps) {
	return (
		<CardFrame className={className}>
			<CardFrameHeader className="px-4 py-2.5">
				<CardFrameTitle className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
					{Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
					{title}
				</CardFrameTitle>
				{description ? (
					<CardFrameDescription>{description}</CardFrameDescription>
				) : null}
				{action ? <CardFrameAction>{action}</CardFrameAction> : null}
			</CardFrameHeader>
			<Card>
				<CardPanel className={cn("p-4", panelClassName)}>{children}</CardPanel>
			</Card>
		</CardFrame>
	);
}

type ChartGhostVariant = "bars" | "donut" | "line";

const BAR_HEIGHTS = [54, 82, 46, 104, 70, 116];

/**
 * A faint silhouette of the chart that will live here, used purely as texture
 * behind the placeholder label. Decorative, so it is hidden from assistive tech.
 */
function ChartGhost({
	variant,
	className,
}: {
	variant: ChartGhostVariant;
	className?: string;
}) {
	if (variant === "donut") {
		return (
			<svg
				viewBox="0 0 120 120"
				className={className}
				fill="none"
				aria-hidden="true"
			>
				<circle
					cx="60"
					cy="60"
					r="40"
					stroke="currentColor"
					strokeWidth="22"
					strokeDasharray="170 80"
					strokeLinecap="round"
				/>
			</svg>
		);
	}

	if (variant === "line") {
		return (
			<svg viewBox="0 0 220 120" className={className} aria-hidden="true">
				<path
					d="M0 92 L44 64 L88 76 L132 36 L176 50 L220 18 L220 120 L0 120 Z"
					fill="currentColor"
				/>
			</svg>
		);
	}

	return (
		<svg
			viewBox="0 0 220 120"
			className={className}
			fill="currentColor"
			aria-hidden="true"
		>
			{BAR_HEIGHTS.map((height, index) => (
				<rect
					key={height}
					x={index * 36 + 8}
					y={120 - height}
					width="24"
					height={height}
					rx="5"
				/>
			))}
		</svg>
	);
}

type ChartPlaceholderProps = {
	/** Picks the silhouette so the empty slot hints at the coming chart. */
	variant?: ChartGhostVariant;
	hint: string;
	className?: string;
};

/**
 * Honest "coming soon" state for a chart that is not built yet: a clear status
 * pill and a one-line description of what will render here, over a faint glyph.
 */
export function ChartPlaceholder({
	variant = "bars",
	hint,
	className,
}: ChartPlaceholderProps) {
	return (
		<div
			className={cn(
				"relative flex h-64 items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/30",
				className,
			)}
		>
			<ChartGhost
				variant={variant}
				className="pointer-events-none absolute inset-0 m-auto h-24 w-[70%] max-w-[240px] text-foreground/[0.07]"
			/>
			<div className="relative flex max-w-[32ch] flex-col items-center gap-2.5 px-6 text-center">
				<span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 font-medium text-muted-foreground text-xs shadow-xs">
					<span
						className="size-1.5 rounded-full bg-foreground/30"
						aria-hidden="true"
					/>
					Bald verfügbar
				</span>
				<p className="text-balance text-muted-foreground text-sm leading-relaxed">
					{hint}
				</p>
			</div>
		</div>
	);
}

/**
 * Shown in a chart slot when the selected period has no data to plot. Matches
 * the chart body height so cards in a row stay aligned.
 */
export function ChartEmpty({ message }: { message?: string }) {
	return (
		<div className="flex h-64 items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 text-center text-muted-foreground text-sm">
			{message ?? "Noch keine Daten für diesen Monat."}
		</div>
	);
}
