import { type GoogleLanguageModelOptions, google } from "@ai-sdk/google";
import { convertToModelMessages, streamText } from "ai";
import { ProvideLinksToolSchema } from "@/lib/inkeep-qa-schema";
import { getLLMText, source } from "@/lib/source";

export const runtime = "nodejs";

async function buildDocsContext() {
	const pages = source.getPages();
	const sections: string[] = [];

	for (const page of pages) {
		const text = await getLLMText(page);
		sections.push(`URL: ${page.url}\n${text}`);
	}

	const context = sections.join("\n\n---\n\n");
	return context;
}

export async function POST(req: Request) {
	const reqJson = await req.json();
	const context = await buildDocsContext();

	const result = streamText({
		model: google("gemini-3-flash-preview"),
		tools: {
			provideLinks: {
				inputSchema: ProvideLinksToolSchema,
			},
		},
		messages: await convertToModelMessages(reqJson.messages, {
			ignoreIncompleteToolCalls: true,
		}),
		system: `Du bist ein KI-Assistent für die Matdesk-Dokumentation.
Beantworte Fragen zur Software auf dieser Dokumentationsseite und zur allgemeinen Nutzung von Matdesk.
Halte die Antworten auf Matdesk fokussiert und schweife nicht auf andere Themen ab.

Nutze den untenstehenden Dokumentationskontext als maßgebliche Quelle, wenn er relevant ist.

Wenn du über ein bestimmtes Plugin oder eine Funktion sprichst, verwende das Tool "provideLinks", um Links zu den relevanten Dokumentationsseiten bereitzustellen.

---
${context}`,
		providerOptions: {
			google: {
				thinkingConfig: {
					thinkingLevel: "low",
					includeThoughts: true,
				},
			} satisfies GoogleLanguageModelOptions,
		},
		toolChoice: "auto",
	});

	return result.toUIMessageStreamResponse();
}
