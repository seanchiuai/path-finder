"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChatHeader } from "./chat-header";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { MemoryPanel } from "./memory-panel";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMemoryPanelOpen, setIsMemoryPanelOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const messages = useQuery(api.chatMessages.listRecentMessages, {
    limit: 50,
  });

  // Mutations and actions
  const clearHistory = useMutation(api.chatMessages.clearHistory);
  const getChatResponse = useAction(api.chat.getChatResponse);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (userMessage: string) => {
    setIsLoading(true);
    try {
      // Build conversation history from recent messages
      const conversationHistory =
        messages
          ?.slice(0, 10)
          .reverse()
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          })) || [];

      // Get response from AI
      await getChatResponse({
        userMessage,
        conversationHistory,
      });
    } catch (error) {
      console.error("Failed to get chat response:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to send message", {
        description: `Could not get AI response: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (
      window.confirm("Are you sure you want to clear the conversation history?")
    ) {
      try {
        await clearHistory();
        toast.success("Chat history cleared");
      } catch (error) {
        console.error("Failed to clear history:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error("Failed to clear chat history", {
          description: errorMessage,
        });
      }
    }
  };

  // Reverse messages to show newest at bottom
  const displayMessages = messages ? [...messages].reverse() : [];

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          onKeyDown={handleOverlayKeyDown}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-full bg-background shadow-lg transition-transform duration-300 lg:w-96",
          "flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <ChatHeader
          onClose={onClose}
          onClearHistory={handleClearHistory}
          onOpenMemoryPanel={() => setIsMemoryPanelOpen(true)}
          messageCount={displayMessages.length}
        />

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4">
          {displayMessages.length === 0 && !isLoading && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  No messages yet. Ask me anything about your bookmarks!
                </p>
              </div>
            </div>
          )}

          {displayMessages.map((msg) => (
            <ChatMessage
              key={msg._id ?? `${msg.createdAt}-${msg.role}`}
              role={msg.role}
              content={msg.content}
              timestamp={msg.createdAt}
            />
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>

      {/* Memory Panel */}
      <MemoryPanel
        isOpen={isMemoryPanelOpen}
        onClose={() => setIsMemoryPanelOpen(false)}
      />
    </>
  );
}
