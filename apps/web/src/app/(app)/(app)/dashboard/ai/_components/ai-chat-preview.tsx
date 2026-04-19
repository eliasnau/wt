"use client";

import { useChat } from "@ai-sdk/react";
import { lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import {
  ArrowUpIcon,
  CameraIcon,
  FileIcon,
  ImageIcon,
  PlusIcon,
  ScreenShareIcon,
  Settings2Icon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { CHAT_MODEL_OPTIONS, DEFAULT_CHAT_MODEL_ID } from "@/ai/models";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse as Response,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import type { ToolPart } from "@/components/ai-elements/tool";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ToolCollapsible } from "./tool-ui";

function formatChatErrorMessage(error: Error | undefined) {
  if (!error?.message) {
    return null;
  }

  try {
    const parsed = JSON.parse(error.message) as { error?: string };
    if (typeof parsed.error === "string" && parsed.error.trim().length > 0) {
      return parsed.error;
    }
  } catch {}

  return error.message;
}

function getApprovalRequestedSensitiveFields(input: unknown) {
  if (!input || typeof input !== "object") {
    return [] as string[];
  }

  const includeFields = (input as { includeFields?: unknown }).includeFields;
  if (!Array.isArray(includeFields)) {
    return [] as string[];
  }

  return includeFields.filter(
    (field): field is string =>
      field === "birthdate" || field === "email" || field === "phone",
  );
}

function formatDeniedSensitiveFields(fields: string[]) {
  const labels = fields.map((field) => {
    switch (field) {
      case "birthdate":
        return "member birthdates";
      case "email":
        return "member email addresses";
      case "phone":
        return "member phone numbers";
      default:
        return "sensitive member data";
    }
  });

  if (labels.length <= 1) {
    return labels[0] ?? "sensitive member data";
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
}

function getApprovalDeniedReason(toolName: string, input: unknown) {
  const requestedFields = getApprovalRequestedSensitiveFields(input);
  const requestedLabel = formatDeniedSensitiveFields(requestedFields);

  const targetLabel =
    toolName === "getMemberInfo"
      ? "for this member"
      : "for the requested members";

  return `User denied reading ${requestedLabel} ${targetLabel}. Do not retry this sensitive-member-data request unless the user explicitly asks again and wants to approve it.`;
}

function ConversationScrollManager({
  userSendCount,
  assistantSignal,
}: {
  userSendCount: number;
  assistantSignal: string;
}) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  useEffect(() => {
    if (userSendCount === 0) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      scrollToBottom();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [userSendCount, scrollToBottom]);

  useEffect(() => {
    if (!assistantSignal || !isAtBottom) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      scrollToBottom();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [assistantSignal, isAtBottom, scrollToBottom]);

  return null;
}

function ClaudeLikeMessage({
  message,
  isStreaming,
  onApproveToolCall,
  onDenyToolCall,
}: {
  message: ReturnType<typeof useChat>["messages"][number];
  isStreaming: boolean;
  onApproveToolCall: (approvalId: string) => void;
  onDenyToolCall: (
    approvalId: string,
    toolName: string,
    input: unknown,
  ) => void;
}) {
  return (
    <Message from={message.role}>
      <div className={cn(message.role === "assistant" && "mb-4")}>
        <MessageContent
          className={cn(
            "group-[.is-user]:border group-[.is-user]:border-border group-[.is-user]:bg-muted/60 group-[.is-user]:text-foreground group-[.is-user]:shadow-xs",
            "group-[.is-assistant]:bg-transparent group-[.is-assistant]:p-0",
            "group-[.is-assistant]:font-sans group-[.is-assistant]:text-foreground",
          )}
        >
          {message.parts.map((part, index) => {
            if (part.type === "text") {
              return (
                <Response
                  animated={{
                    animation: "blurIn",
                    duration: 180,
                    easing: "ease-out",
                    sep: "word",
                  }}
                  isAnimating={isStreaming}
                  key={`${message.id}-text-${index}`}
                  mode={isStreaming ? "streaming" : "static"}
                >
                  {part.text}
                </Response>
              );
            }
            if (part.type === "reasoning") {
              const reasoningText = String(
                (part as { text?: string }).text ?? "",
              );
              const hasReasoningContent = reasoningText.trim().length > 0;

              return (
                <Reasoning
                  className="mb-1"
                  isStreaming={isStreaming}
                  key={`${message.id}-reasoning-${index}`}
                >
                  <ReasoningTrigger showChevron={hasReasoningContent} />
                  {hasReasoningContent ? (
                    <ReasoningContent>{reasoningText}</ReasoningContent>
                  ) : null}
                </Reasoning>
              );
            }

            if (part.type === "source-url") {
              return (
                <Sources key={`${message.id}-source-${index}`}>
                  <SourcesTrigger count={1} />
                  <SourcesContent>
                    <Source href={part.url} title={part.title ?? part.url} />
                  </SourcesContent>
                </Sources>
              );
            }

            if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
              const toolPart = part as ToolPart;
              const toolName =
                toolPart.type === "dynamic-tool"
                  ? toolPart.toolName
                  : toolPart.type.split("-").slice(1).join("-");

              return (
                <ToolCollapsible
                  approval={toolPart.approval}
                  errorText={toolPart.errorText}
                  input={toolPart.input}
                  key={`${message.id}-tool-${index}`}
                  onApprove={
                    toolPart.approval?.id
                      ? () => onApproveToolCall(toolPart.approval!.id)
                      : undefined
                  }
                  onDeny={
                    toolPart.approval?.id
                      ? () =>
                          onDenyToolCall(
                            toolPart.approval!.id,
                            toolName,
                            toolPart.input,
                          )
                      : undefined
                  }
                  output={toolPart.output}
                  state={toolPart.state}
                  toolName={toolName}
                />
              );
            }

            return null;
          })}
        </MessageContent>
      </div>
    </Message>
  );
}

export function AiChatPreview() {
  const [model, setModel] = useState(DEFAULT_CHAT_MODEL_ID);
  const [lastRequestedModel, setLastRequestedModel] = useState(
    DEFAULT_CHAT_MODEL_ID,
  );
  const [text, setText] = useState("");
  const [userSendScrollCount, setUserSendScrollCount] = useState(0);
  const {
    addToolApprovalResponse,
    clearError,
    error,
    messages,
    sendMessage,
    status,
    stop,
  } = useChat({
    experimental_throttle: 50,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });
  const formattedErrorMessage = formatChatErrorMessage(error);
  const assistantScrollSignal = useMemo(() => {
    const lastAssistantMessage = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");

    if (!lastAssistantMessage) {
      return "";
    }

    const contentSize = lastAssistantMessage.parts.reduce((total, part) => {
      if (part.type === "text") {
        return total + part.text.length;
      }
      if (part.type === "reasoning") {
        return total + String((part as { text?: string }).text ?? "").length;
      }
      return total;
    }, 0);

    return `${lastAssistantMessage.id}:${status}:${contentSize}`;
  }, [messages, status]);

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text.trim());
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments) || status !== "ready") {
      return;
    }

    clearError();
    setLastRequestedModel(model);
    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          model,
        },
      },
    );
    setText("");
    setUserSendScrollCount((count) => count + 1);
  };

  const handleFileAction = (action: string) => {
    toast.success("Placeholder action", {
      description: action,
    });
  };

  const handleApproveToolCall = (approvalId: string) => {
    void addToolApprovalResponse({
      id: approvalId,
      approved: true,
    });
  };

  const handleDenyToolCall = (
    approvalId: string,
    toolName: string,
    input: unknown,
  ) => {
    void addToolApprovalResponse({
      id: approvalId,
      approved: false,
      reason: getApprovalDeniedReason(toolName, input),
    });
  };

  return (
    <div className="-mb-4 flex h-[calc(100dvh-5rem)] flex-col overflow-hidden sm:-mb-6 lg:-mb-10">
      <div className="flex h-full w-full flex-col">
        <div className="min-h-0 flex-1 overflow-hidden">
          <Conversation className="h-full">
            <ConversationScrollManager
              assistantSignal={assistantScrollSignal}
              userSendCount={userSendScrollCount}
            />
            <ConversationContent className="h-full gap-8 px-0 pt-0 pb-6">
              {formattedErrorMessage ? (
                <div
                  className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-sm"
                  role="alert"
                >
                  {formattedErrorMessage}
                </div>
              ) : null}
              {messages.map((message, index) => (
                <div
                  className="animate-in fade-in slide-in-from-bottom-2 [animation-duration:400ms] [animation-fill-mode:both]"
                  key={message.id}
                >
                  <ClaudeLikeMessage
                    isStreaming={
                      message.role === "assistant" &&
                      index === messages.length - 1 &&
                      (status === "submitted" || status === "streaming")
                    }
                    message={message}
                    onApproveToolCall={handleApproveToolCall}
                    onDenyToolCall={handleDenyToolCall}
                  />
                </div>
              ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>

        <div className="shrink-0 pb-4">
          <PromptInput
            className="divide-y-0 rounded-2xl border border-border bg-card shadow-xs transition-shadow hover:shadow-sm"
            onSubmit={handleSubmit}
          >
            <PromptInputTextarea
              className="px-4 md:text-base"
              onChange={(event) => setText(event.target.value)}
              placeholder="Reply to Claude..."
              value={text}
            />

            <PromptInputFooter className="gap-3 p-3">
              <PromptInputTools className="gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <PromptInputButton className="rounded-lg" variant="outline">
                      <PlusIcon size={16} />
                      <span className="sr-only">Add attachment</span>
                    </PromptInputButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => handleFileAction("upload-file")}
                    >
                      <FileIcon className="mr-2" size={16} />
                      Upload file
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleFileAction("upload-photo")}
                    >
                      <ImageIcon className="mr-2" size={16} />
                      Upload photo
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleFileAction("take-screenshot")}
                    >
                      <ScreenShareIcon className="mr-2" size={16} />
                      Take screenshot
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleFileAction("take-photo")}
                    >
                      <CameraIcon className="mr-2" size={16} />
                      Take photo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <PromptInputButton className="rounded-lg" variant="outline">
                  <Settings2Icon size={16} />
                  <span className="sr-only">Settings</span>
                </PromptInputButton>
              </PromptInputTools>

              <div className="flex items-center gap-2">
                <PromptInputSelect onValueChange={(value) => setModel(value as string)} value={model}>
                  <PromptInputSelectTrigger>
                    <PromptInputSelectValue />
                  </PromptInputSelectTrigger>
                  <PromptInputSelectContent>
                    {CHAT_MODEL_OPTIONS.map((item) => (
                      <PromptInputSelectItem key={item.id} value={item.id}>
                        {item.name}
                      </PromptInputSelectItem>
                    ))}
                  </PromptInputSelectContent>
                </PromptInputSelect>

                <PromptInputSubmit
                  disabled={status === "ready" && !text.trim()}
                  onStop={stop}
                  status={status}
                >
                  {status === "ready" ? (
                    <ArrowUpIcon className="-translate-y-px" size={16} />
                  ) : null}
                </PromptInputSubmit>
              </div>
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
