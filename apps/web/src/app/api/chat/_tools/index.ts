import { createSearchDocsTool } from "./docs";
import { createGetMemberInfoTool } from "./get-member-info";
import { createGetNumbersTool } from "./get-numbers";
import { createListGroupsTool } from "./list-groups";
import { createQueryMembersTool } from "./query-members";

export const createTools = (organizationId: string) => ({
	queryMembers: createQueryMembersTool(organizationId),
	getMemberInfo: createGetMemberInfoTool(organizationId),
	listGroups: createListGroupsTool(organizationId),
	getNumbers: createGetNumbersTool(organizationId),
	searchDocs: createSearchDocsTool(),
});
