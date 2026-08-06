import type React from "react";

/**
 * Renders the first validation message of a `@tanstack/react-form` field once
 * it's been touched. Designed to be spread: `<FieldError {...field.state.meta} />`.
 */
export function FieldError({
  errors,
  isTouched,
  isValidating,
}: {
  errors: ReadonlyArray<unknown>;
  isTouched: boolean;
  isValidating: boolean;
}): React.ReactElement | null {
  if (!isTouched || isValidating || errors.length === 0) return null;
  return <p className="text-destructive text-xs">{String(errors[0])}</p>;
}
