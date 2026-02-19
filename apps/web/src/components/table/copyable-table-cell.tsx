"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type * as React from "react";
import { toast } from "sonner";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

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
						className="group inline-flex cursor-pointer items-center gap-2 text-left transition-colors hover:text-foreground disabled:cursor-default disabled:opacity-70"
					/>
				}
			>
				<span className="truncate">{value}</span>
				<AnimatePresence mode="popLayout">
					<motion.span
						key={isCopied ? "check" : "copy"}
						data-slot="copy-button-icon"
						initial={{ scale: 0, opacity: 0.4, filter: "blur(4px)" }}
						animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
						exit={{ scale: 0, opacity: 0.4, filter: "blur(4px)" }}
						transition={{ duration: 0.25 }}
					>
						{isCopied ? (
							<CheckIcon className="size-3 shrink-0" />
						) : (
							<CopyIcon className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
						)}
					</motion.span>
				</AnimatePresence>
			</TooltipTrigger>
			<TooltipPopup>
				<p>Click to copy</p>
			</TooltipPopup>
		</Tooltip>
	);
}
