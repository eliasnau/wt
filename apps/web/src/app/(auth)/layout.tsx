import { Suspense } from "react";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="bg-sidebar">
			<Suspense>{children}</Suspense>
		</div>
	);
}
