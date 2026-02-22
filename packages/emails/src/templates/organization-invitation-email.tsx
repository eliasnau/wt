import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Hr,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type React from "react";

export interface OrganizationInvitationEmailProps {
  invitedByUsername?: string;
  invitedByEmail?: string;
  organizationName?: string;
  inviteLink?: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3001";

type OrganizationInvitationEmailComponent = ((
  props: OrganizationInvitationEmailProps,
) => React.ReactElement) & {
  PreviewProps: OrganizationInvitationEmailProps;
};

export const OrganizationInvitationEmail: OrganizationInvitationEmailComponent =
  ({
    invitedByUsername = "Admin",
    invitedByEmail = "admin@example.com",
    organizationName = "matdesk organization",
    inviteLink = "https://matdesk.app",
  }: OrganizationInvitationEmailProps) => {
    const previewText = `Einladung zu ${organizationName} auf matdesk`;

    return (
      <Html lang="en" dir="ltr">
        <Head />
        <Preview>{previewText}</Preview>
        <Body style={main}>
          <Container style={content}>
            <Section style={logoRow}>
              <Img
                src={`${baseUrl}/logo.svg`}
                width="132"
                height="24"
                alt="matdesk"
                style={logoIcon}
              />
            </Section>

            <Heading style={title}>
              Trete <strong>{organizationName}</strong> auf{" "}
              <strong>matdesk</strong> bei
            </Heading>

            <Text style={text}>
              Hallo, <br />
              <br /> <strong>{invitedByUsername}</strong> (
              <Link href={`mailto:${invitedByEmail}`} style={inlineLink}>
                {invitedByEmail}
              </Link>
              ) hat dich eingeladen, <strong>{organizationName}</strong> auf
              matdesk beizutreten.
            </Text>

            <Section style={buttonsWrap}>
              <Button href={inviteLink} style={button}>
                Einladung annehmen
              </Button>
            </Section>

            <Text style={linkLabel}>
              Wenn der Button nicht funktioniert nutze diesen link:
            </Text>
            <Text style={linkText}>
              <Link href={inviteLink} style={inlineLink}>
                {inviteLink}
              </Link>
            </Text>

            <Hr style={divider} />

            <Text style={disclaimer}>
              Falls du diese Einladung nicht erwartet hast, kannst du diese
              E-Mail ignorieren.
            </Text>
          </Container>
        </Body>
      </Html>
    );
  };

OrganizationInvitationEmail.PreviewProps = {
  invitedByUsername: "Elias",
  invitedByEmail: "contact@eliasnau.dev",
  organizationName: "Test",
  inviteLink: "https://matdesk.app",
} as OrganizationInvitationEmailProps;

export default OrganizationInvitationEmail;

const main = {
  backgroundColor: "#ffffff",
  margin: "0",
  padding: "28px 20px",
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
};

const content = {
  maxWidth: "420px",
  margin: "0 auto",
  position: "relative" as const,
  zIndex: "1",
};

const logoRow = {
  display: "block",
  marginBottom: "18px",
};

const logoIcon = {
  display: "block",
};

const title = {
  margin: "0 0 12px",
  fontSize: "30px",
  lineHeight: "1.15",
  color: "#111827",
  letterSpacing: "-0.02em",
  fontWeight: "400",
};

const text = {
  margin: "0 0 16px",
  fontSize: "15px",
  lineHeight: "1.65",
  color: "#4b5563",
};

const buttonsWrap = {
  marginBottom: "14px",
  display: "flex",
  gap: "8px",
};

const button = {
  backgroundColor: "#111827",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 18px",
  borderRadius: "10px",
  textDecoration: "none",
};

const linkLabel = {
  margin: "0",
  fontSize: "12px",
  color: "#6b7280",
};

const linkText = {
  margin: "6px 0 0",
  fontSize: "12px",
  wordBreak: "break-all" as const,
};

const inlineLink = {
  color: "#111827",
  textDecoration: "underline",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
};

const disclaimer = {
  margin: "0 0 8px",
  fontSize: "12px",
  lineHeight: "1.55",
  color: "#6b7280",
};
