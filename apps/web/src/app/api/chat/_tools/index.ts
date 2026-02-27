import { createGroupsTool } from "./groups";
import { createMembersTool } from "./members";

export const createTools = (organizationId: string) => ({
	members: createMembersTool(organizationId),
	groups: createGroupsTool(organizationId),
});
