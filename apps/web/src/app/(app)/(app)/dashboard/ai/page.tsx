import {
	Header,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "../_components/page-header";
import AiChat from "./_components/ai-chat";
import "streamdown/styles.css";

export default function AiDashboardPage() {
	return (
		<div className="-mb-4 flex h-[calc(100dvh-5rem)] flex-col gap-8 overflow-hidden sm:-mb-6 lg:-mb-10">
			<Header>
				<HeaderContent>
					<HeaderTitle>AI Assistant</HeaderTitle>
					<HeaderDescription>
						Chat about your sport school, members, and day-to-day questions.
					</HeaderDescription>
				</HeaderContent>
			</Header>

			<AiChat />
		</div>
	);
}
