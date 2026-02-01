import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { i18n } from "@/lib/i18n";

export function baseOptions(locale: string): BaseLayoutProps {
	return {
		nav: {
			title: "My App",
		},
		i18n,
	};
}
