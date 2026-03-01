import { redirect } from "next/navigation";

export default function SelfServiceIndexPage() {
  redirect("/dashboard/self-service/registrations");
}
