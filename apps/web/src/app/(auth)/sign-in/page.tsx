import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import SignIn from "./sign-in";
import type { Route } from "next";

type SearchParams = Promise<{
  redirectUrl?: string | string[];
  invite?: string | string[];
}>;

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [session, params] = await Promise.all([
    getServerSession(),
    searchParams,
  ]);
  const redirectUrl = getSingleValue(params.redirectUrl) ?? "/dashboard";
  const invite = getSingleValue(params.invite) === "1";

  if (session?.session.id) {
    redirect(redirectUrl as Route);
  }

  return <SignIn redirectUrl={redirectUrl} invite={invite} />;
}
