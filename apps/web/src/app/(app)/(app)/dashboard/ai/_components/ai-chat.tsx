"use client";

import { useChat } from "@ai-sdk/react";
import { useHotkey } from "@tanstack/react-hotkeys";
import type { FileUIPart } from "ai";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	CheckIcon,
	CornerDownLeftIcon,
	DownloadIcon,
	MessageSquare,
} from "lucide-react";
import { Fragment, memo, useCallback, useMemo, useRef, useState } from "react";
import { getModelProviderFromId } from "@/ai/model-icons";
import {
	CHAT_MODEL_OPTIONS,
	type ChatModelOption,
	DEFAULT_CHAT_MODEL_ID,
} from "@/ai/models";
import {
	Attachment,
	AttachmentPreview,
	AttachmentRemove,
	Attachments,
} from "@/components/ai-elements/attachments";
import {
	Conversation,
	ConversationContent,
	ConversationEmptyState,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
	Message,
	MessageContent,
	MessageResponse,
} from "@/components/ai-elements/message";
import {
	ModelSelector,
	ModelSelectorCollection,
	ModelSelectorContent,
	ModelSelectorEmpty,
	ModelSelectorFooter,
	ModelSelectorGroup,
	ModelSelectorGroupLabel,
	ModelSelectorInput,
	ModelSelectorItem,
	ModelSelectorList,
	ModelSelectorLogo,
	ModelSelectorName,
	ModelSelectorPanel,
	ModelSelectorProvider,
	ModelSelectorSeparator,
	ModelSelectorText,
	ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputBody,
	PromptInputButton,
	PromptInputFooter,
	type PromptInputMessage,
	PromptInputProvider,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
	usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
	Tool,
	ToolContent,
	ToolHeader,
	ToolInput,
	ToolOutput,
	type ToolPart,
} from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogPanel,
	DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

type ModelData = ChatModelOption;
type AttachmentData = ReturnType<
	typeof usePromptInputAttachments
>["files"][number];
type PreviewAttachmentData = {
	filename?: string;
	mediaType?: string;
	url: string;
};

interface AttachmentItemProps {
	attachment: AttachmentData;
	onPreview: (attachment: PreviewAttachmentData) => void;
	onRemove: (id: string) => void;
}

const AttachmentItem = memo(
	({ attachment, onPreview, onRemove }: AttachmentItemProps) => {
		const handleRemove = useCallback(
			() => onRemove(attachment.id),
			[onRemove, attachment.id],
		);

		const isImage =
			attachment.type === "file" &&
			attachment.mediaType?.startsWith("image/") &&
			Boolean(attachment.url);
		const canPreview =
			attachment.type === "file" &&
			Boolean(attachment.url) &&
			Boolean(attachment.mediaType);

		const handlePreview = useCallback(
			(event: React.MouseEvent<HTMLButtonElement>) => {
				event.stopPropagation();
				if (!canPreview || attachment.type !== "file") {
					return;
				}

				onPreview({
					filename: attachment.filename,
					mediaType: attachment.mediaType,
					url: attachment.url,
				});
			},
			[attachment, canPreview, onPreview],
		);

		return (
			<Attachment
				className="h-9 rounded-lg px-2"
				data={attachment}
				key={attachment.id}
				onRemove={handleRemove}
			>
				{canPreview ? (
					<button
						className={cn(
							"shrink-0",
							isImage ? "cursor-zoom-in" : "cursor-pointer",
						)}
						onClick={handlePreview}
						type="button"
					>
						<AttachmentPreview className="size-6" />
					</button>
				) : (
					<AttachmentPreview className="size-6" />
				)}
				<AttachmentRemove />
			</Attachment>
		);
	},
);

AttachmentItem.displayName = "AttachmentItem";

type MessageAttachmentData = FileUIPart & { id: string };

interface MessageAttachmentItemProps {
	attachment: MessageAttachmentData;
	onPreview: (attachment: PreviewAttachmentData) => void;
}

const MessageAttachmentItem = memo(
	({ attachment, onPreview }: MessageAttachmentItemProps) => {
		const isImage =
			attachment.mediaType?.startsWith("image/") && Boolean(attachment.url);
		const canPreview = Boolean(attachment.url) && Boolean(attachment.mediaType);

		const handlePreview = useCallback(() => {
			if (!canPreview) {
				return;
			}

			onPreview({
				filename: attachment.filename,
				mediaType: attachment.mediaType,
				url: attachment.url,
			});
		}, [attachment, canPreview, onPreview]);

		return (
			<Attachment data={attachment} key={attachment.id}>
				{canPreview ? (
					<button
						className={cn(
							"block size-full",
							isImage ? "cursor-zoom-in" : "cursor-pointer",
						)}
						onClick={handlePreview}
						type="button"
					>
						<AttachmentPreview />
					</button>
				) : (
					<AttachmentPreview />
				)}
			</Attachment>
		);
	},
);

MessageAttachmentItem.displayName = "MessageAttachmentItem";

interface ModelItemProps {
	m: ModelData;
	onSelect: (id: string) => void;
	selectedModel: string;
}

const ModelItem = memo(({ m, selectedModel, onSelect }: ModelItemProps) => {
	const handleSelect = useCallback(() => onSelect(m.id), [onSelect, m.id]);
	return (
		<ModelSelectorItem
			className="flex items-center gap-3"
			key={m.id}
			onClick={handleSelect}
			value={m.id}
		>
			<ModelSelectorLogo
				className="size-8 shrink-0"
				provider={getModelProviderFromId(m.id)}
			/>
			<ModelSelectorText className="min-w-0 flex-1">
				<ModelSelectorName className="truncate font-medium">
					{m.name}
				</ModelSelectorName>
				<ModelSelectorProvider>
					{m.providerName} via AI Gateway
				</ModelSelectorProvider>
			</ModelSelectorText>
			{selectedModel === m.id ? (
				<CheckIcon className="ml-auto size-4 text-primary" />
			) : (
				<div className="ml-auto size-4" />
			)}
		</ModelSelectorItem>
	);
});

ModelItem.displayName = "ModelItem";

interface PromptInputAttachmentsDisplayProps {
	onPreview: (attachment: PreviewAttachmentData) => void;
}

const PromptInputAttachmentsDisplay = ({
	onPreview,
}: PromptInputAttachmentsDisplayProps) => {
	const attachments = usePromptInputAttachments();

	const handleRemove = useCallback(
		(id: string) => attachments.remove(id),
		[attachments],
	);

	if (attachments.files.length === 0) {
		return null;
	}

	return (
		<Attachments className="px-1" variant="inline">
			{attachments.files.map((attachment) => (
				<AttachmentItem
					attachment={attachment}
					key={attachment.id}
					onPreview={onPreview}
					onRemove={handleRemove}
				/>
			))}
		</Attachments>
	);
};

const AiChat = () => {
	const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
	const [model, setModel] = useState(DEFAULT_CHAT_MODEL_ID);
	const [previewAttachment, setPreviewAttachment] =
		useState<PreviewAttachmentData | null>(null);
	const [isPromptDropActive, setIsPromptDropActive] = useState(false);
	const promptDragDepthRef = useRef(0);
	const { messages, sendMessage, status } = useChat();

	const handleOpenAttachmentPreview = useCallback(
		(attachment: PreviewAttachmentData) => {
			setPreviewAttachment(attachment);
		},
		[],
	);

	useHotkey("Mod+M", () => {
		setModelSelectorOpen(true);
	});

	const modelItems = CHAT_MODEL_OPTIONS;
	const selectedModelData = modelItems.find((m) => m.id === model);
	const groupedModels = useMemo(() => {
		const groupedMap = new Map<string, ModelData[]>();

		for (const modelItem of CHAT_MODEL_OPTIONS) {
			const existingItems = groupedMap.get(modelItem.providerName);
			if (existingItems) {
				existingItems.push(modelItem);
				continue;
			}

			groupedMap.set(modelItem.providerName, [modelItem]);
		}

		return Array.from(groupedMap, ([value, items]) => ({ value, items }));
	}, []);

	const handleModelSelect = useCallback((id: string) => {
		setModel(id);
		setModelSelectorOpen(false);
	}, []);

	const handleSubmit = useCallback(
		(message: PromptInputMessage) => {
			const text = message.text?.trim();
			const hasText = Boolean(text);
			const hasAttachments = Boolean(message.files?.length);

			if (!(hasText || hasAttachments)) {
				return;
			}

			sendMessage(
				{
					text: text || "Sent with attachments",
					files: message.files,
				},
				{
					body: {
						model,
					},
				},
			);
		},
		[model, sendMessage],
	);

	const hasDraggedFiles = useCallback(
		(event: { dataTransfer?: DataTransfer | null }) =>
			Boolean(event.dataTransfer?.types?.includes("Files")),
		[],
	);

	const handlePromptDragEnter = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			if (!hasDraggedFiles(event)) {
				return;
			}
			event.preventDefault();
			promptDragDepthRef.current += 1;
			setIsPromptDropActive(true);
		},
		[hasDraggedFiles],
	);

	const handlePromptDragOver = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			if (!hasDraggedFiles(event)) {
				return;
			}
			event.preventDefault();
			event.dataTransfer.dropEffect = "copy";
		},
		[hasDraggedFiles],
	);

	const handlePromptDragLeave = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			if (!hasDraggedFiles(event)) {
				return;
			}
			event.preventDefault();
			promptDragDepthRef.current = Math.max(0, promptDragDepthRef.current - 1);
			if (promptDragDepthRef.current === 0) {
				setIsPromptDropActive(false);
			}
		},
		[hasDraggedFiles],
	);

	const handlePromptDrop = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			if (!hasDraggedFiles(event)) {
				return;
			}
			event.preventDefault();
			promptDragDepthRef.current = 0;
			setIsPromptDropActive(false);
		},
		[hasDraggedFiles],
	);

	const handleDownloadPreview = useCallback(() => {
		if (!previewAttachment?.url) {
			return;
		}

		const anchor = document.createElement("a");
		anchor.href = previewAttachment.url;
		anchor.download = previewAttachment.filename ?? "attachment";
		document.body.append(anchor);
		anchor.click();
		anchor.remove();
	}, [previewAttachment]);

	return (
		<div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
			<div className="flex min-h-0 flex-1 flex-col">
				<Conversation>
					<ConversationContent>
						{messages.length === 0 ? (
							<ConversationEmptyState
								icon={<MessageSquare className="size-12" />}
								title="Start a conversation"
								description="Type a message below to begin chatting"
							/>
						) : (
							messages.map((message, messageIndex) => (
								<Message from={message.role} key={message.id}>
									{(() => {
										const attachments = message.parts
											.map((part, index) =>
												part.type === "file"
													? {
															...part,
															id: `${message.id}-file-${index}`,
														}
													: null,
											)
											.filter(
												(part): part is MessageAttachmentData => part !== null,
											);

										if (attachments.length === 0) {
											return null;
										}

										return (
											<Attachments className="mb-2" variant="grid">
												{attachments.map((attachment) => (
													<MessageAttachmentItem
														attachment={attachment}
														key={attachment.id}
														onPreview={handleOpenAttachmentPreview}
													/>
												))}
											</Attachments>
										);
									})()}
									<MessageContent>
										{message.parts.map((part, i) => {
											const isLastAssistantMessage =
												message.role === "assistant" &&
												messageIndex === messages.length - 1;
											const isMessageStreaming =
												isLastAssistantMessage &&
												(status === "submitted" || status === "streaming");

											if (part.type === "text") {
												return (
													<MessageResponse
														isAnimating={isMessageStreaming}
														mode={isMessageStreaming ? "streaming" : "static"}
														key={`${message.id}-${i}`}
													>
														{part.text}
													</MessageResponse>
												);
											}
											if (part.type === "reasoning") {
												const reasoningText = String(
													(part as { text?: string }).text ?? "",
												);
												const hasReasoningContent =
													reasoningText.trim().length > 0;

												return (
													<Reasoning
														className="mb-1"
														isStreaming={isMessageStreaming}
														key={`${message.id}-reasoning-${i}`}
													>
														<ReasoningTrigger
															showChevron={hasReasoningContent}
														/>
														{hasReasoningContent ? (
															<ReasoningContent>
																{reasoningText}
															</ReasoningContent>
														) : null}
													</Reasoning>
												);
											}
											if (
												part.type.startsWith("tool-") ||
												part.type === "dynamic-tool"
											) {
												const toolPart = part as ToolPart;

												return (
													<Tool
														key={`${message.id}-tool-${i}`}
														defaultOpen={false}
													>
														{toolPart.type === "dynamic-tool" ? (
															<ToolHeader
																type="dynamic-tool"
																state={toolPart.state}
																toolName={toolPart.toolName}
															/>
														) : (
															<ToolHeader
																type={toolPart.type}
																state={toolPart.state}
															/>
														)}
														<ToolContent>
															<ToolInput input={toolPart.input} />
															<ToolOutput
																output={toolPart.output}
																errorText={toolPart.errorText}
															/>
														</ToolContent>
													</Tool>
												);
											}
											if (part.type === "file") {
												return null;
											}
											return null;
										})}
									</MessageContent>
								</Message>
							))
						)}
						{/* {status === "submitted" ? (
              <Message from="assistant">
                <MessageContent>
                  <MessageResponse>
                    <Shimmer>Thinking</Shimmer>
                  </MessageResponse>
                </MessageContent>
              </Message>
            ) : null} */}
					</ConversationContent>
					{/* <ConversationDownload messages={messages} /> */}
					<ConversationScrollButton />
				</Conversation>

				<PromptInputProvider>
					<div className="mt-4 space-y-2">
						<PromptInputAttachmentsDisplay
							onPreview={handleOpenAttachmentPreview}
						/>
						<fieldset
							aria-label="Message input dropzone"
							className="relative min-w-0 border-0 p-0"
							onDragEnter={handlePromptDragEnter}
							onDragLeave={handlePromptDragLeave}
							onDragOver={handlePromptDragOver}
							onDrop={handlePromptDrop}
						>
							<PromptInput globalDrop multiple onSubmit={handleSubmit}>
								<PromptInputBody>
									<PromptInputTextarea placeholder="Ask MatDesk AI..." />
								</PromptInputBody>
								<PromptInputFooter>
									<PromptInputTools>
										<PromptInputActionMenu>
											<PromptInputActionMenuTrigger />
											<PromptInputActionMenuContent>
												<PromptInputActionAddAttachments />
											</PromptInputActionMenuContent>
										</PromptInputActionMenu>
										<ModelSelector
											onOpenChange={setModelSelectorOpen}
											open={modelSelectorOpen}
										>
											<ModelSelectorTrigger
												render={
													<PromptInputButton
														variant="outline"
														className="max-w-64 justify-start"
														type="button"
													/>
												}
											>
												{selectedModelData?.id ? (
													<ModelSelectorLogo
														className="size-4"
														provider={getModelProviderFromId(
															selectedModelData.id,
														)}
													/>
												) : null}
												{selectedModelData?.name ? (
													<ModelSelectorName className="min-w-0 flex-1">
														{selectedModelData.name}
													</ModelSelectorName>
												) : null}
											</ModelSelectorTrigger>
											<ModelSelectorContent items={groupedModels}>
												<ModelSelectorInput placeholder="Search models..." />
												<ModelSelectorPanel>
													<ModelSelectorEmpty>
														No models found.
													</ModelSelectorEmpty>
													<ModelSelectorList>
														{(
															group: {
																value: string;
																items: readonly ModelData[];
															},
															index: number,
														) => {
															if (group.items.length === 0) {
																return null;
															}
															const hasNextVisibleGroup = groupedModels
																.slice(index + 1)
																.some(
																	(nextGroup) => nextGroup.items.length > 0,
																);

															return (
																<Fragment key={group.value}>
																	<ModelSelectorGroup items={group.items}>
																		<ModelSelectorGroupLabel>
																			{group.value}
																		</ModelSelectorGroupLabel>
																		<ModelSelectorCollection>
																			{(item: ModelData) => (
																				<ModelItem
																					key={item.id}
																					m={item}
																					onSelect={handleModelSelect}
																					selectedModel={model}
																				/>
																			)}
																		</ModelSelectorCollection>
																	</ModelSelectorGroup>
																	{hasNextVisibleGroup ? (
																		<ModelSelectorSeparator />
																	) : null}
																</Fragment>
															);
														}}
													</ModelSelectorList>
												</ModelSelectorPanel>
												<ModelSelectorFooter>
													<div className="flex items-center gap-4">
														<div className="flex items-center gap-2">
															<KbdGroup>
																<Kbd>
																	<ArrowUpIcon />
																</Kbd>
																<Kbd>
																	<ArrowDownIcon />
																</Kbd>
															</KbdGroup>
															<span>Navigate</span>
														</div>
														<div className="flex items-center gap-2">
															<Kbd>
																<CornerDownLeftIcon />
															</Kbd>
															<span>Select</span>
														</div>
													</div>
													<div className="flex items-center gap-2">
														<Kbd>Esc</Kbd>
														<span>Close</span>
													</div>
												</ModelSelectorFooter>
											</ModelSelectorContent>
										</ModelSelector>
									</PromptInputTools>
									<PromptInputSubmit status={status} />
								</PromptInputFooter>
							</PromptInput>
							<div
								className={cn(
									"pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl border-2 border-dashed font-medium text-sm opacity-0 transition",
									isPromptDropActive &&
										"border-primary/60 bg-primary/5 text-primary opacity-100",
								)}
							>
								Drop files to attach
							</div>
						</fieldset>
					</div>
				</PromptInputProvider>
				<Dialog
					onOpenChange={(open) => {
						if (!open) {
							setPreviewAttachment(null);
						}
					}}
					open={Boolean(previewAttachment)}
				>
					<DialogContent className="max-w-3xl">
						<DialogTitle className="sr-only">Attachment preview</DialogTitle>
						<DialogPanel>
							{previewAttachment?.mediaType?.startsWith("image/") ? (
								<img
									alt={previewAttachment.filename ?? "Attachment preview"}
									className="max-h-[70vh] w-full rounded-lg border bg-muted/10 object-contain"
									src={previewAttachment.url}
								/>
							) : (
								<div className="flex min-h-72 items-center justify-center rounded-lg border bg-muted/10 p-6 text-center text-muted-foreground text-sm">
									Preview is not available for this file type.
								</div>
							)}
						</DialogPanel>
						<DialogFooter variant="bare">
							<div className="flex w-full items-center justify-between gap-3">
								<p className="truncate text-muted-foreground text-sm">
									{previewAttachment?.filename ?? "Attachment"}
								</p>
								<Button
									disabled={!previewAttachment?.url}
									onClick={handleDownloadPreview}
									size="sm"
									variant="outline"
								>
									<DownloadIcon />
									Download
								</Button>
							</div>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
};

export default AiChat;
