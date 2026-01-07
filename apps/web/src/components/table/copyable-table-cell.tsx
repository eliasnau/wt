"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import * as React from "react";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { toast } from "sonner";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";

export function CopyableTableCell({ value }: { value: string }) {
	const toastTimeout = 2000;

	const { copyToClipboard, isCopied } = useCopyToClipboard({
		onCopy: () => {
			toast.success("Copied to clipboard", {
				description: value,
			});
		},
		timeout: toastTimeout,
	});

	async function handleCopy(e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		await copyToClipboard(value);
	}

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<button
						type="button"
						onClick={handleCopy}
						disabled={isCopied}
						className="inline-flex items-center gap-2 text-left hover:text-foreground transition-colors group cursor-pointer disabled:cursor-default disabled:opacity-70"
					/>
				}
			>
				<span className="truncate">{value}</span>
				{isCopied ? (
					<CheckIcon className="size-3 shrink-0" />
				) : (
					<CopyIcon className="size-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
				)}
			</TooltipTrigger>
			<TooltipPopup>
				<p>Click to copy</p>
			</TooltipPopup>
		</Tooltip>
	);
}
