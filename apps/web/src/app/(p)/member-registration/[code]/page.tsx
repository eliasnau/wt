import { MemberRegistrationForm } from "./_components/member-registration-form";

type MemberRegistrationPageProps = {
  params: Promise<{ code: string }>;
};

export default async function MemberRegistrationPage({
  params,
}: MemberRegistrationPageProps) {
  const { code } = await params;
  return <MemberRegistrationForm code={code} />;
}
