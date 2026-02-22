import { Resend } from "resend";
import { OrganizationInvitationEmail } from "./templates/organization-invitation-email";

export type SendOrganizationInvitationEmailInput = {
	email: string;
	invitedByUsername: string;
	invitedByEmail: string;
	organizationName: string;
	inviteLink: string;
	from?: string;
	subject?: string;
};

function createResendClient(apiKey = process.env.RESEND_API_KEY) {
	if (!apiKey) {
		throw new Error("RESEND_API_KEY is missing");
	}

	return new Resend(apiKey);
}

function getDefaultFromEmail() {
	const fromEmail = process.env.RESEND_FROM_EMAIL;
	if (!fromEmail) {
		throw new Error("RESEND_FROM_EMAIL is missing");
	}

	return `matdesk <${fromEmail}>`;
}

export async function sendOrganizationInvitationEmail(
	{
		email,
		invitedByUsername,
		invitedByEmail,
		organizationName,
		inviteLink,
		from = getDefaultFromEmail(),
		subject = `Einladung zu ${organizationName}`,
	}: SendOrganizationInvitationEmailInput,
	client = createResendClient(),
) {
	return client.emails.send({
		from,
		to: [email],
		subject,
		react: OrganizationInvitationEmail({
			invitedByUsername,
			invitedByEmail,
			organizationName,
			inviteLink,
		}),
	});
}
