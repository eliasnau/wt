import { auth } from "@repo/auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import SetupPassword from "./setup-password";

type SetupPasswordState = {
	error?: string;
};

function getErrorMessage(error: unknown) {
	if (
		error &&
		typeof error === "object" &&
		"message" in error &&
		typeof error.message === "string"
	) {
		return error.message;
	}

	return "Passwort konnte nicht gesetzt werden";
}

async function setPasswordAction(
	_: SetupPasswordState,
	formData: FormData,
): Promise<SetupPasswordState> {
	"use server";

	const newPassword = formData.get("password");
	const confirmPassword = formData.get("confirmPassword");

	if (typeof newPassword !== "string" || !newPassword.trim()) {
		return { error: "Passwort ist erforderlich" };
	}

	if (newPassword.length < 8) {
		return { error: "Das Passwort muss mindestens 8 Zeichen lang sein" };
	}

	if (newPassword !== confirmPassword) {
		return { error: "Passwörter stimmen nicht überein" };
	}

	try {
		await auth.api.setPassword({
			body: { newPassword },
			headers: await headers(),
		});
	} catch (error) {
		return { error: getErrorMessage(error) };
	}

	redirect("/organizations");
}

export default async function SetupPasswordPage() {
	const session = await getServerSession();

	if (!session?.session.id) {
		redirect("/sign-in?redirectUrl=%2Fsetup-password");
	}

	const accounts = await auth.api.listAccounts({
		headers: await headers(),
	});

	const hasPassword = accounts.some(
		(account) => account.providerId === "credential",
	);

	if (hasPassword) {
		redirect("/account/security");
	}

	return <SetupPassword action={setPasswordAction} />;
}
