import {
	Header,
	HeaderContent,
	HeaderTitle,
	HeaderDescription,
	HeaderActions,
} from "../_components/page-header";
import { NewGroupSheet } from "./_components/new-group-sheet";

export default function GroupsPage() {
	return (
		<div className="flex flex-col gap-8">
			<Header>
				<HeaderContent>
					<HeaderTitle>Groups</HeaderTitle>
					<HeaderDescription>
						Manage member groups and permissions
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<NewGroupSheet />
				</HeaderActions>
			</Header>
		</div>
	);
}
