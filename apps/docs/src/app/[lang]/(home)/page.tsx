import Link from "next/link";
import { redirect } from "next/navigation";

export default function HomePage() {
  return redirect("/docs");
  return (
    <div className="flex flex-1 flex-col justify-center text-center">
      <h1 className="mb-4 font-bold text-2xl">Dokumentation</h1>
      <p>
        Sie können{" "}
        <Link href="/docs" className="font-medium underline">
          /docs
        </Link>{" "}
        öffnen und die Dokumentation ansehen.
      </p>
    </div>
  );
}
