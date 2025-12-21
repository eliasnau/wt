"use client";
import { useState } from "react";

let globalCopyTimeout: NodeJS.Timeout | null = null;
let globalSetCopied: ((value: boolean) => void) | null = null;

export function CopyableTableCell({ value }: { value: string }) {
	const [copied, setCopied] = useState(false);
	const [cursorX, setCursorX] = useState(0);

	const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
		const target = e.currentTarget;
		try {
			await navigator.clipboard.writeText(value);
			const rect = target.getBoundingClientRect();
			setCursorX(e.clientX - rect.left);

			if (globalCopyTimeout) {
				clearTimeout(globalCopyTimeout);
			}
			if (globalSetCopied && globalSetCopied !== setCopied) {
				globalSetCopied(false);
			}

			setCopied(true);
			globalSetCopied = setCopied;
			globalCopyTimeout = setTimeout(() => {
				setCopied(false);
				globalSetCopied = null;
				globalCopyTimeout = null;
			}, 1000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	return (
		<div className="relative">
			{copied && (
				<div
					className="fade-in-0 zoom-in-95 -translate-x-1/2 -translate-y-0 pointer-events-none absolute bottom-full z-50 mb-1.5 animate-in"
					style={{ left: `${cursorX}px` }}
				>
					<div className="w-fit whitespace-nowrap text-balance rounded-md bg-foreground px-3 py-1.5 text-background text-xs">
						Copied
					</div>
				</div>
			)}
			<button
				type="button"
				onClick={handleCopy}
				className="cursor-pointer text-left"
			>
				{value}
			</button>
		</div>
	);
}
