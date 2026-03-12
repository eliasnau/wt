import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import SignUp from "./sign-up";

type SearchParams = Promise<{
	redirectUrl?: string | string[];
	invite?: string | string[];
}>;

function getSingleValue(value: string | string[] | undefined) {
	return Array.isArray(value) ? value[0] : value;
}

export default async function SignUpPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const [session, params] = await Promise.all([getServerSession(), searchParams]);
	const redirectUrl = getSingleValue(params.redirectUrl) ?? "/dashboard";
	const invite = getSingleValue(params.invite) === "1";

	if (session?.session.id) {
		redirect(redirectUrl);
	}

	return <SignUp redirectUrl={redirectUrl} invite={invite} />;
}
