import type { ComponentProps } from "react";
import { ModelProviderIcon } from "@/ai/model-icons";
import {
	Command,
	CommandCollection,
	CommandDialog,
	CommandDialogPopup,
	CommandDialogTrigger,
	CommandEmpty,
	CommandFooter,
	CommandGroup,
	CommandGroupLabel,
	CommandInput,
	CommandItem,
	CommandList,
	CommandPanel,
	CommandSeparator,
	CommandShortcut,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export type ModelSelectorProps = ComponentProps<typeof CommandDialog>;

export const ModelSelector = (props: ModelSelectorProps) => (
	<CommandDialog {...props} />
);

export type ModelSelectorTriggerProps = ComponentProps<
	typeof CommandDialogTrigger
>;

export const ModelSelectorTrigger = (props: ModelSelectorTriggerProps) => (
	<CommandDialogTrigger {...props} />
);

export type ModelSelectorContentProps = ComponentProps<
	typeof CommandDialogPopup
> & {
	items?: readonly unknown[];
};

export const ModelSelectorContent = ({
	className,
	children,
	items,
	...props
}: ModelSelectorContentProps) => (
	<CommandDialogPopup className={cn("max-w-xl", className)} {...props}>
		<Command items={items}>{children}</Command>
	</CommandDialogPopup>
);

export type ModelSelectorDialogProps = ComponentProps<typeof CommandDialog>;

export const ModelSelectorDialog = (props: ModelSelectorDialogProps) => (
	<CommandDialog {...props} />
);

export type ModelSelectorInputProps = ComponentProps<typeof CommandInput>;

export const ModelSelectorInput = ({
	className,
	...props
}: ModelSelectorInputProps) => (
	<CommandInput className={cn(className)} {...props} />
);

export type ModelSelectorListProps = ComponentProps<typeof CommandList>;

export const ModelSelectorList = (props: ModelSelectorListProps) => (
	<CommandList {...props} />
);

export type ModelSelectorEmptyProps = ComponentProps<typeof CommandEmpty>;

export const ModelSelectorEmpty = (props: ModelSelectorEmptyProps) => (
	<CommandEmpty {...props} />
);

export type ModelSelectorGroupProps = ComponentProps<typeof CommandGroup>;

export const ModelSelectorGroup = (props: ModelSelectorGroupProps) => (
	<CommandGroup {...props} />
);

export type ModelSelectorGroupLabelProps = ComponentProps<
	typeof CommandGroupLabel
>;

export const ModelSelectorGroupLabel = (
	props: ModelSelectorGroupLabelProps,
) => <CommandGroupLabel {...props} />;

export type ModelSelectorCollectionProps = ComponentProps<
	typeof CommandCollection
>;

export const ModelSelectorCollection = (
	props: ModelSelectorCollectionProps,
) => <CommandCollection {...props} />;

export type ModelSelectorPanelProps = ComponentProps<typeof CommandPanel>;

export const ModelSelectorPanel = (props: ModelSelectorPanelProps) => (
	<CommandPanel {...props} />
);

export type ModelSelectorFooterProps = ComponentProps<typeof CommandFooter>;

export const ModelSelectorFooter = (props: ModelSelectorFooterProps) => (
	<CommandFooter {...props} />
);

export type ModelSelectorItemProps = ComponentProps<typeof CommandItem>;

export const ModelSelectorItem = ({
	className,
	...props
}: ModelSelectorItemProps) => (
	<CommandItem
		className={cn("flex items-center gap-3", className)}
		{...props}
	/>
);

export type ModelSelectorShortcutProps = ComponentProps<typeof CommandShortcut>;

export const ModelSelectorShortcut = (props: ModelSelectorShortcutProps) => (
	<CommandShortcut {...props} />
);

export type ModelSelectorSeparatorProps = ComponentProps<
	typeof CommandSeparator
>;

export const ModelSelectorSeparator = (props: ModelSelectorSeparatorProps) => (
	<CommandSeparator {...props} />
);

export type ModelSelectorLogoProps = ComponentProps<"svg"> & {
	provider:
		| "moonshotai-cn"
		| "lucidquery"
		| "moonshotai"
		| "zai-coding-plan"
		| "alibaba"
		| "xai"
		| "vultr"
		| "nvidia"
		| "upstage"
		| "groq"
		| "github-copilot"
		| "mistral"
		| "vercel"
		| "nebius"
		| "deepseek"
		| "alibaba-cn"
		| "google-vertex-anthropic"
		| "venice"
		| "chutes"
		| "cortecs"
		| "github-models"
		| "togetherai"
		| "azure"
		| "baseten"
		| "huggingface"
		| "opencode"
		| "fastrouter"
		| "google"
		| "google-vertex"
		| "cloudflare-workers-ai"
		| "inception"
		| "wandb"
		| "openai"
		| "zhipuai-coding-plan"
		| "perplexity"
		| "openrouter"
		| "zenmux"
		| "v0"
		| "iflowcn"
		| "synthetic"
		| "deepinfra"
		| "zhipuai"
		| "submodel"
		| "zai"
		| "inference"
		| "requesty"
		| "morph"
		| "lmstudio"
		| "anthropic"
		| "aihubmix"
		| "fireworks-ai"
		| "modelscope"
		| "llama"
		| "scaleway"
		| "amazon-bedrock"
		| "cerebras"
		// oxlint-disable-next-line typescript-eslint(ban-types) -- intentional pattern for autocomplete-friendly string union
		| (string & {});
};

export const ModelSelectorLogo = ({
	provider,
	className,
	...props
}: ModelSelectorLogoProps) => (
	<ModelProviderIcon
		{...props}
		className={cn("size-5 shrink-0", className)}
		provider={provider}
	/>
);

export type ModelSelectorLogoGroupProps = ComponentProps<"div">;

export const ModelSelectorLogoGroup = ({
	className,
	...props
}: ModelSelectorLogoGroupProps) => (
	<div
		className={cn("flex shrink-0 items-center -space-x-1", className)}
		{...props}
	/>
);

export type ModelSelectorNameProps = ComponentProps<"span">;

export const ModelSelectorName = ({
	className,
	...props
}: ModelSelectorNameProps) => (
	<span className={cn("truncate text-left", className)} {...props} />
);

export type ModelSelectorTextProps = ComponentProps<"div">;

export const ModelSelectorText = ({
	className,
	...props
}: ModelSelectorTextProps) => (
	<div className={cn("min-w-0 flex-1", className)} {...props} />
);

export type ModelSelectorProviderProps = ComponentProps<"span">;

export const ModelSelectorProvider = ({
	className,
	...props
}: ModelSelectorProviderProps) => (
	<span
		className={cn("block truncate text-muted-foreground text-xs", className)}
		{...props}
	/>
);
