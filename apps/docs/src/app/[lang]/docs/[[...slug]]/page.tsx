import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Feedback } from "@/components/feedback/client";
import { getPageImage, source } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";

export default async function Page(props: {
	params: Promise<{ lang: string; slug?: string[] }>;
}) {
	const params = await props.params;
	const page = source.getPage(params.slug, params.lang);
	if (!page) notFound();

	const MDX = page.data.body;

	return (
		<DocsPage
			toc={page.data.toc}
			full={page.data.full}
			tableOfContent={{ style: "clerk" }}
		>
			<DocsTitle>{page.data.title}</DocsTitle>
			<DocsDescription>{page.data.description}</DocsDescription>
			<DocsBody>
				<MDX
					components={getMDXComponents({
						// this allows you to link to other pages with relative file paths
						a: createRelativeLink(source, page),
					})}
				/>
			</DocsBody>
			<Feedback
				onSendAction={async ({ opinion, url, message }) => {
					"use server";
					await console.log(opinion, url, message);
					return {};
				}}
			/>
		</DocsPage>
	);
}

export async function generateStaticParams() {
	return source.generateParams();
}

export async function generateMetadata(props: {
	params: Promise<{ lang: string; slug?: string[] }>;
}): Promise<Metadata> {
	const params = await props.params;
	const page = source.getPage(params.slug, params.lang);
	if (!page) notFound();

	return {
		title: page.data.title,
		description: page.data.description,
		openGraph: {
			images: getPageImage(page).url,
		},
	};
}
