"use client";

import {
  Conversation,
  ConversationContent,
  ConversationDownload,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Tool, ToolContent, ToolInput, ToolHeader, ToolOutput } from "@/components/ai-elements/tool";
import { Shimmer } from "@/components/ai-elements/shimmer";

const AiChat = () => {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();

  const handleSubmit = async (
    message: { text: string },
    event: React.FormEvent
  ) => {
    event.preventDefault();
    if (message.text.trim()) {
      sendMessage({ text: message.text });
      setInput("");
    }
  };

  return (
    <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden">
      <div className="flex flex-1 min-h-0 flex-col">
        <Conversation>
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquare className="size-12" />}
                title="Start a conversation"
                description="Type a message below to begin chatting"
              />
            ) : (
              messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, i) => {
                      if (part.type === "text") {
                        return (
                          <MessageResponse key={`${message.id}-${i}`}>
                            {part.text}
                          </MessageResponse>
                        );
                      } else if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
                        return (
                          <Tool key={`${message.id}-tool-${i}`} defaultOpen={false}>
                            <ToolHeader
                              type={part.type as any}
                              state={(part as any).state}
                              toolName={part.type === "dynamic-tool" ? part.toolName : undefined}
                            />
                            <ToolContent>
                              <ToolInput input={(part as any).input} />
                              <ToolOutput
                                output={(part as any).output as any}
                                errorText={(part as any).errorText as any}
                              />
                            </ToolContent>
                          </Tool>
                        );
                      } else {
                        return (
                          <></>
                        );
                      }
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

        <PromptInput
          onSubmit={handleSubmit}
          className="relative mt-4 w-full"
        >
          <PromptInputTextarea
            value={input}
            placeholder="Say something..."
            onChange={(e) => setInput(e.currentTarget.value)}
            className="pr-12"
          />
          <PromptInputSubmit
            status={status}
            disabled={!input.trim()}
            className="absolute bottom-1 right-1"
          />
        </PromptInput>
      </div>
    </div>
  );
};

export default AiChat;
