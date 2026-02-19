"use client";

import { useCallback, useEffect, useState } from "react";

interface UseCopyToClipboardOptions {
	onCopy?: () => void;
	timeout?: number;
}

export function useCopyToClipboard({
	onCopy,
	timeout = 2000,
}: UseCopyToClipboardOptions = {}) {
	const [isCopied, setIsCopied] = useState(false);

	const copyToClipboard = useCallback(
		async (text: string) => {
			try {
				await navigator.clipboard.writeText(text);
				setIsCopied(true);
				onCopy?.();
			} catch (err) {
				console.error("Failed to copy to clipboard:", err);
			}
		},
		[onCopy],
	);

	useEffect(() => {
		if (isCopied) {
			const timer = setTimeout(() => {
				setIsCopied(false);
			}, timeout);

			return () => clearTimeout(timer);
		}
	}, [isCopied, timeout]);

	return { copyToClipboard, isCopied };
}
