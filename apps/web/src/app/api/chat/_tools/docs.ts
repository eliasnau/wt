import { tool } from "ai";
import { z } from "zod";

const docsToolInput = z.object({
	query: z
		.string()
		.trim()
		.min(1)
		.max(200)
		.describe("Search query for MatDesk docs pages.")
		.optional(),
	limit: z
		.number()
		.int()
		.min(1)
		.max(20)
		.describe("Maximum docs results to return.")
		.optional(),
});

type DocsSearchResult = {
	title: string;
	url: string;
	description?: string;
};

type DocsFetchedPage = {
	title: string;
	url: string;
	markdownUrl: string | null;
	snippet: string;
	fullMarkdown: string | null;
};

type DocsSearchCandidate = {
	title: string;
	url: string;
	description?: string;
	content?: string;
	breadcrumbs: string[];
	type?: string;
	relevance: number;
};

const DEFAULT_DOCS_BASE_URL = "https://docs.matdesk.app";
const FETCH_FULL_PAGE_COUNT = 2;
const MAX_FULL_MARKDOWN_CHARS = 20_000;

const STOPWORDS = new Set([
	"a",
	"an",
	"the",
	"and",
	"or",
	"to",
	"for",
	"of",
	"in",
	"on",
	"mit",
	"und",
	"oder",
	"der",
	"die",
	"das",
	"den",
	"dem",
	"ein",
	"eine",
	"im",
	"am",
	"zu",
]);

const resolveDocsBaseUrl = () => {
	const raw = process.env.MATDESK_DOCS_URL?.trim() || DEFAULT_DOCS_BASE_URL;
	const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
	return new URL(withProtocol);
};

const firstString = (
	record: Record<string, unknown>,
	keys: string[],
): string | undefined => {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "string" && value.trim().length > 0) {
			return value.trim();
		}
	}
	return undefined;
};

const toTitle = (value: string) => {
	const clean = value
		.replace(/\.[a-z0-9]+$/i, "")
		.replaceAll("-", " ")
		.replaceAll("_", " ")
		.replace(/\s+/g, " ")
		.trim();
	if (!clean) return "Documentation";
	return clean.charAt(0).toUpperCase() + clean.slice(1);
};

const normalizePathCandidate = (value: string) => {
	if (value.startsWith("http://") || value.startsWith("https://")) {
		return value;
	}

	if (value.startsWith("/")) {
		return value;
	}

	if (value.startsWith("docs/")) {
		return `/${value}`;
	}

	return `/docs/${value}`;
};

const parseSearchPayload = (payload: unknown): unknown[] => {
	if (Array.isArray(payload)) return payload;
	if (!payload || typeof payload !== "object") return [];

	const record = payload as Record<string, unknown>;
	const candidates = [
		record.results,
		record.items,
		record.hits,
		record.documents,
		record.data,
	];

	for (const candidate of candidates) {
		if (Array.isArray(candidate)) return candidate;
		if (candidate && typeof candidate === "object") {
			const nested = candidate as Record<string, unknown>;
			const nestedArrays = [nested.results, nested.items, nested.hits];
			for (const nestedCandidate of nestedArrays) {
				if (Array.isArray(nestedCandidate)) return nestedCandidate;
			}
		}
	}

	return [];
};

const tokenizeQuery = (query: string) =>
	query
		.toLowerCase()
		.replace(/[^a-z0-9äöüß\s-]/gi, " ")
		.split(/\s+/)
		.filter(Boolean)
		.filter((token) => !STOPWORDS.has(token));

const normalizeSearchText = (value?: string) =>
	(value ?? "").toLowerCase().replace(/\s+/g, " ").trim();

const rankCandidate = (
	candidate: Omit<DocsSearchCandidate, "relevance">,
	query: string,
): number => {
	const normalizedQuery = normalizeSearchText(query);
	const tokens = tokenizeQuery(query);
	const title = normalizeSearchText(candidate.title);
	const url = normalizeSearchText(candidate.url);
	const description = normalizeSearchText(candidate.description);
	const content = normalizeSearchText(candidate.content);
	const breadcrumbs = normalizeSearchText(candidate.breadcrumbs.join(" "));

	let score = 0;
	if (title.includes(normalizedQuery)) score += 130;
	if (url.includes(normalizedQuery)) score += 85;
	if (description.includes(normalizedQuery)) score += 70;
	if (content.includes(normalizedQuery)) score += 55;
	if (breadcrumbs.includes(normalizedQuery)) score += 40;

	if (candidate.type === "page") score += 14;
	if (candidate.url.includes("#")) score += 8;

	for (const token of tokens) {
		if (title.includes(token)) score += 22;
		if (url.includes(token)) score += 14;
		if (description.includes(token)) score += 10;
		if (content.includes(token)) score += 6;
		if (breadcrumbs.includes(token)) score += 5;
	}

	return score;
};

const canonicalResultKey = (baseUrl: URL, urlPath: string) => {
	const resolved = new URL(urlPath, baseUrl);
	return `${resolved.pathname}${resolved.search}`;
};

const normalizeSearchResult = (
	item: unknown,
	baseUrl: URL,
	query: string,
): DocsSearchCandidate | null => {
	if (!item || typeof item !== "object") return null;
	const record = item as Record<string, unknown>;

	const urlRaw = firstString(record, [
		"url",
		"href",
		"path",
		"pathname",
		"route",
		"slug",
		"id",
	]);
	if (!urlRaw) return null;

	const normalizedUrlCandidate = normalizePathCandidate(urlRaw);
	let resolvedUrl: URL;
	try {
		resolvedUrl = new URL(normalizedUrlCandidate, baseUrl);
	} catch {
		return null;
	}

	const type = firstString(record, ["type"]);
	const content = firstString(record, ["content", "text"]);
	const title =
		firstString(record, ["title", "name", "label", "heading"]) ??
		(type === "page" && content ? content : undefined) ??
		toTitle(resolvedUrl.pathname.split("/").filter(Boolean).at(-1) ?? "docs");
	const description = firstString(record, [
		"description",
		"excerpt",
		"summary",
	]);
	const breadcrumbs = Array.isArray(record.breadcrumbs)
		? record.breadcrumbs.filter(
				(value): value is string => typeof value === "string",
			)
		: [];

	const baseCandidate = {
		title,
		url: `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`,
		description,
		content,
		breadcrumbs,
		type,
	};

	return {
		...baseCandidate,
		relevance: rankCandidate(baseCandidate, query),
	};
};

const stripFrontmatter = (markdown: string) => {
	if (!markdown.startsWith("---\n")) return markdown;
	const end = markdown.indexOf("\n---\n", 4);
	if (end === -1) return markdown;
	return markdown.slice(end + 5);
};

const decodeHtmlEntities = (input: string) =>
	input
		.replaceAll("&nbsp;", " ")
		.replaceAll("&amp;", "&")
		.replaceAll("&lt;", "<")
		.replaceAll("&gt;", ">")
		.replaceAll("&quot;", '"')
		.replaceAll("&#39;", "'");

const cleanMarkdownForSnippet = (markdown: string) =>
	stripFrontmatter(markdown)
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/`[^`]*`/g, " ")
		.replace(/\[(.*?)\]\((.*?)\)/g, "$1")
		.replace(/[#>*_|-]/g, " ")
		.replace(/\s+/g, " ")
		.trim();

const createSnippet = (markdown: string, query?: string) => {
	const text = cleanMarkdownForSnippet(markdown);
	if (!text) return "";
	if (!query) return text.slice(0, 240);

	const q = query.toLowerCase();
	const lower = text.toLowerCase();
	const idx = lower.indexOf(q);
	if (idx < 0) return text.slice(0, 240);

	const start = Math.max(0, idx - 100);
	const end = Math.min(text.length, idx + 180);
	return `${start > 0 ? "..." : ""}${text.slice(start, end)}${end < text.length ? "..." : ""}`;
};

const toRawDocUrl = (
	baseUrl: URL,
	urlPath: string,
	extension: ".md" | ".mdx",
) => {
	const pageUrl = new URL(urlPath, baseUrl);
	const normalizedPath = pageUrl.pathname.endsWith("/")
		? pageUrl.pathname.slice(0, -1)
		: pageUrl.pathname;
	return new URL(`${normalizedPath}${extension}`, baseUrl);
};

const toFumadocsMdxRouteUrl = (baseUrl: URL, urlPath: string) => {
	const pageUrl = new URL(urlPath, baseUrl);
	const normalizedPath = pageUrl.pathname.endsWith("/")
		? pageUrl.pathname.slice(0, -1)
		: pageUrl.pathname;

	if (!normalizedPath.startsWith("/docs")) return null;
	const docsSlug = normalizedPath.slice("/docs".length);
	const routePath = docsSlug ? `/llms.mdx/docs${docsSlug}` : "/llms.mdx/docs";
	return new URL(routePath, baseUrl);
};

const isLikelyHtml = (text: string) => /<!doctype html|<html[\s>]/i.test(text);

const fetchRawMarkdown = async (baseUrl: URL, urlPath: string) => {
	const candidates = [
		toRawDocUrl(baseUrl, urlPath, ".mdx"),
		toRawDocUrl(baseUrl, urlPath, ".md"),
		toFumadocsMdxRouteUrl(baseUrl, urlPath),
	].filter((candidate): candidate is URL => candidate !== null);

	const seen = new Set<string>();
	for (const rawUrl of candidates) {
		const key = `${rawUrl.pathname}${rawUrl.search}`;
		if (seen.has(key)) continue;
		seen.add(key);

		const response = await fetch(rawUrl, {
			headers: {
				accept: "text/markdown,text/plain;q=0.9,*/*;q=0.8",
			},
		});
		if (!response.ok) continue;

		const text = await response.text();
		if (!text || !text.trim() || isLikelyHtml(text)) continue;

		return {
			markdown: text,
			markdownUrl: `${rawUrl.pathname}${rawUrl.search}`,
		};
	}

	return null;
};

const extractArticleHtml = (html: string) => {
	const articleById = html.match(
		/<article[^>]*id=["']nd-page["'][^>]*>([\s\S]*?)<\/article>/i,
	);
	if (articleById?.[1]) return articleById[1];

	const articleAny = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
	if (articleAny?.[1]) return articleAny[1];

	return null;
};

const htmlToMarkdown = (articleHtml: string) => {
	const text = decodeHtmlEntities(
		articleHtml
			.replace(/<script[\s\S]*?<\/script>/gi, " ")
			.replace(/<style[\s\S]*?<\/style>/gi, " ")
			.replace(/<\s*br\s*\/?>/gi, "\n")
			.replace(/<\s*li[^>]*>/gi, "\n- ")
			.replace(/<\s*\/li\s*>/gi, "\n")
			.replace(/<\s*h1[^>]*>/gi, "\n\n# ")
			.replace(/<\s*h2[^>]*>/gi, "\n\n## ")
			.replace(/<\s*h3[^>]*>/gi, "\n\n### ")
			.replace(/<\s*h4[^>]*>/gi, "\n\n#### ")
			.replace(/<\s*h5[^>]*>/gi, "\n\n##### ")
			.replace(/<\s*h6[^>]*>/gi, "\n\n###### ")
			.replace(/<\s*\/h[1-6]\s*>/gi, "\n")
			.replace(
				/<\s*(p|div|section|article|blockquote|ul|ol|table|tr)[^>]*>/gi,
				"\n",
			)
			.replace(
				/<\s*\/(p|div|section|article|blockquote|ul|ol|table|tr)\s*>/gi,
				"\n",
			)
			.replace(/<[^>]+>/g, " "),
	)
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();

	return text.length > MAX_FULL_MARKDOWN_CHARS
		? `${text.slice(0, MAX_FULL_MARKDOWN_CHARS)}\n\n...`
		: text;
};

const fetchPageAsMarkdown = async (baseUrl: URL, urlPath: string) => {
	const rawMarkdown = await fetchRawMarkdown(baseUrl, urlPath);
	if (rawMarkdown) {
		return rawMarkdown;
	}

	const pageUrl = new URL(urlPath, baseUrl);
	pageUrl.hash = "";
	const pageResponse = await fetch(pageUrl, {
		headers: {
			accept: "text/html,application/xhtml+xml",
		},
	});
	if (!pageResponse.ok) return null;

	const html = await pageResponse.text();
	if (!isLikelyHtml(html)) return null;

	const articleHtml = extractArticleHtml(html);
	if (!articleHtml) return null;

	const markdown = htmlToMarkdown(articleHtml);
	if (!markdown) return null;

	return {
		markdown,
		markdownUrl: null,
	};
};

export const createSearchDocsTool = () =>
	tool({
		description:
			"Search MatDesk docs using the docs search API, then fetch full content for top results.",
		inputSchema: docsToolInput,
		execute: async ({ query, limit }) => {
			const normalizedQuery = query?.trim();
			if (!normalizedQuery) {
				return {
					count: 0,
					searchResults: [],
					fetchedPages: [],
					message: "A query is required to search docs.",
				};
			}

			const safeLimit = Math.min(limit ?? 8, 20);
			const baseUrl = resolveDocsBaseUrl();
			const searchUrl = new URL("/api/search", baseUrl);
			searchUrl.searchParams.set("query", normalizedQuery);

			const searchResponse = await fetch(searchUrl, {
				headers: {
					accept: "application/json",
				},
			});

			if (!searchResponse.ok) {
				return {
					count: 0,
					searchResults: [],
					fetchedPages: [],
					docsBaseUrl: baseUrl.origin,
					error: `Docs search failed with status ${searchResponse.status}.`,
				};
			}

			const searchPayload = (await searchResponse.json()) as unknown;
			const rawItems = parseSearchPayload(searchPayload);
			const byCanonicalPath = new Map<string, DocsSearchCandidate>();

			for (const item of rawItems) {
				const normalized = normalizeSearchResult(
					item,
					baseUrl,
					normalizedQuery,
				);
				if (!normalized) continue;
				if (normalized.relevance <= 0) continue;

				const key = canonicalResultKey(baseUrl, normalized.url);
				const prev = byCanonicalPath.get(key);
				if (!prev || normalized.relevance > prev.relevance) {
					byCanonicalPath.set(key, normalized);
				}
			}

			const rankedCandidates = Array.from(byCanonicalPath.values())
				.sort((a, b) => b.relevance - a.relevance)
				.slice(0, safeLimit);

			const searchResults: DocsSearchResult[] = rankedCandidates.map(
				(candidate) => ({
					title: candidate.title,
					url: candidate.url,
					description: candidate.description ?? candidate.content,
				}),
			);

			const fetchedPages = await Promise.all(
				rankedCandidates
					.slice(0, FETCH_FULL_PAGE_COUNT)
					.map(async (candidate): Promise<DocsFetchedPage> => {
						const fetched = await fetchPageAsMarkdown(baseUrl, candidate.url);
						return {
							title: candidate.title,
							url: candidate.url,
							markdownUrl: fetched?.markdownUrl ?? null,
							snippet: fetched
								? createSnippet(fetched.markdown, normalizedQuery)
								: (candidate.description ?? candidate.content ?? ""),
							fullMarkdown: fetched?.markdown ?? null,
						};
					}),
			);

			return {
				query: normalizedQuery,
				count: searchResults.length,
				docsBaseUrl: baseUrl.origin,
				searchResults,
				fetchedPages,
				results: searchResults,
			};
		},
	});
