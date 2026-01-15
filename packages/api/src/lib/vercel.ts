import { Vercel } from "@vercel/sdk";

const vercelToken = process.env.VERCEL_TOKEN;
const vercelProjectId = process.env.VERCEL_PROJECT_ID;
const vercelTeamId = process.env.VERCEL_TEAM_ID;

if (!vercelToken) {
	throw new Error("VERCEL_TOKEN is not set");
}

if (!vercelProjectId) {
	throw new Error("VERCEL_PROJECT_ID is not set");
}

if (!vercelTeamId) {
	throw new Error("VERCEL_TEAM_ID is not set");
}

export const vercel = new Vercel({
	bearerToken: vercelToken,
});

export const projectId = vercelProjectId;
export const teamId = vercelTeamId;
