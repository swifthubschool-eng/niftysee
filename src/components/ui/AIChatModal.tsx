"use client";

import React, { useEffect, useRef } from "react";
import { useChat, Message } from "ai/react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Send, X, Bot, User, Sparkles, Loader2, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // We use a custom fetch wrapper to dynamically inject the current pathname on EVERY request
  const { messages, input, handleInputChange, handleSubmit, isLoading, reload, stop } = useChat({
    api: "/api/chat",
    fetch: async (url, options) => {
      // Intercept the outgoing request to inject the latest pathname
      if (options?.body) {
        const bodyObj = JSON.parse(options.body as string);
        bodyObj.pathname = pathname;
        options.body = JSON.stringify(bodyObj);
      }
      return fetch(url, options);
    },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: "Hi there! I'm your TradeVision AI assistant. I can analyze the current page you're on to give you insights, such as stock predictions based on recent news. How can I help you today?"
      }
    ]
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[100] w-full max-w-[400px] sm:w-[400px] h-[600px] max-h-[calc(100vh-120px)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in-20 duration-300">

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-primary/20 bg-muted shrink-0 shadow-sm">
            <Image src="/ai-bot.jpg" alt="AI Assistant" fill className="object-cover" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">TradeVision AI</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Online
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 1 && (
            <button
              onClick={() => reload()}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Regenerate last response"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10 custom-scrollbar">
        {messages.map((m: Message) => (
          <div
            key={m.id}
            className={cn(
              "flex gap-3 max-w-[85%]",
              m.role === "user" ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 border overflow-hidden relative",
              m.role === "user"
                ? "bg-muted border-border text-muted-foreground"
                : "border-blue-500/20 bg-muted"
            )}>
              {m.role === "user" ? <User className="w-4 h-4" /> : <Image src="/ai-bot.jpg" alt="AI" fill className="object-cover" />}
            </div>

            <div className={cn(
              "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap shadow-sm",
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-card border border-border text-foreground rounded-tl-sm leading-relaxed"
            )}>
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 border border-blue-500/20 bg-muted overflow-hidden relative">
              <Image src="/ai-bot.jpg" alt="AI" fill className="object-cover" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-card border border-border text-foreground rounded-tl-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-card border-t border-border shrink-0">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end gap-2 bg-muted/50 border border-border rounded-xl p-1 focus-within:ring-1 focus-within:ring-primary/50 transition-shadow"
        >
          <textarea
            value={input || ""}
            onChange={handleInputChange}
            placeholder="Ask about this page..."
            className="w-full bg-transparent border-none focus:ring-0 resize-none py-2.5 px-3 text-sm max-h-32 min-h-[44px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                // trigger submit programmatically
                if ((input || "").trim() && !isLoading) {
                  const form = e.currentTarget.form;
                  if (form) form.requestSubmit();
                }
              }
            }}
          />
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="mb-1 mr-1 p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!(input || "").trim() || isLoading}
              className="mb-1 mr-1 p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
        <div className="text-center mt-2">
          <span className="text-[10px] text-muted-foreground/60">
            AI can make mistakes. Verify important financial decisions.
          </span>
        </div>
      </div>
    </div>
  );
}
