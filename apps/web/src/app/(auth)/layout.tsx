export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="bg-sidebar">
			{children}
		</div>
	);
}
