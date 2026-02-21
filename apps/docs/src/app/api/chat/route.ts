import { ProvideLinksToolSchema } from "@/lib/inkeep-qa-schema";
import { convertToModelMessages, streamText } from "ai";
import { google, GoogleLanguageModelOptions } from "@ai-sdk/google";
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
    system: `You are an AI assistant for Matdesk documentation.
Answer questions about the software in this docs site and general Matdesk usage.
Keep responses focused on Matdesk, dont chat about other stuff.

Use the documentation context below as ground truth when relevant.

When talking about a specific plugin or feature, provide links to the relevant documentation pages using the "provideLinks" tool.

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
