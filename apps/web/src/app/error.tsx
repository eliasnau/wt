"use client";
import NextError from "next/error";
import posthog from "posthog-js";
import { useEffect } from "react";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		posthog.captureException(error);
	}, [error]);

	return <NextError statusCode={0} />;
}
