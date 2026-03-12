import { redirect } from "next/navigation";

export default function SepaExportPage() {
	redirect("/dashboard/finance/batches");
}
