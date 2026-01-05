"use client"
import posthog from "posthog-js";
import { useEffect } from "react";
import NextError from "next/error";

export default function Error({
    error,
    reset,
  }: {
    error: Error & { digest?: string }
    reset: () => void
  }) {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return <NextError statusCode={0} />;
}