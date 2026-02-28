import { gateway } from "ai";

export type ChatModelOption = {
	id: string;
	name: string;
	providerName: string;
};

export type ChatModel = ChatModelOption & {
	model: ReturnType<typeof gateway>;
};

const createChatModel = (model: ChatModel): ChatModel => model;

export const CHAT_MODEL_OPTIONS: readonly ChatModelOption[] = [
	{
		id: "openai/gpt-5-mini",
		name: "GPT-5 Mini",
		providerName: "OpenAI",
	},
	{
		id: "google/gemini-3-flash",
		name: "Gemini 3 Flash",
		providerName: "Google",
	},
];

export const DEFAULT_CHAT_MODEL_ID = CHAT_MODEL_OPTIONS[0].id;

const CHAT_MODEL_OPTIONS_BY_ID = new Map(
	CHAT_MODEL_OPTIONS.map((model) => [model.id, model]),
);

export const getChatModel = (modelId?: string | null) => {
	if (!modelId) return undefined;

	const modelOption = CHAT_MODEL_OPTIONS_BY_ID.get(modelId);
	if (!modelOption) return undefined;

	return createChatModel({
		...modelOption,
		model: gateway(modelOption.id),
	});
};
