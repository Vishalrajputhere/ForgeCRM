'use client';

import * as React from 'react';
import { Send, Bot, User, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AIMessage } from '@/hooks/use-ai';

export interface AIChatProps {
  messages: AIMessage[];
  onSendMessage: (prompt: string) => void;
  isStreaming: boolean;
}

export function AIChat({ messages, onSendMessage, isStreaming }: AIChatProps) {
  const [inputPrompt, setInputPrompt] = React.useState('');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputPrompt.trim() || isStreaming) return;
    onSendMessage(inputPrompt);
    setInputPrompt('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-surface border border-border-default rounded-xl overflow-hidden">
      {/* Messages Stream Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="h-8 w-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div className={`max-w-[80%] space-y-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-3.5 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-accent text-accent-fg rounded-br-none'
                    : 'bg-elevated border border-border-subtle text-primary rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>

              <div className="flex items-center gap-2 px-1 text-xs text-muted">
                <span>{msg.timestamp}</span>
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="h-3 w-3 text-status-success-fg" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="h-8 w-8 rounded-lg bg-surface-hover border border-border-default flex items-center justify-center text-muted shrink-0">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-3 bg-elevated border-t border-border-default flex items-center gap-2">
        <Input
          placeholder="Ask AI Copilot about deals, lead scoring, email drafts, or accounts…"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={!inputPrompt.trim() || isStreaming} variant="primary">
          <Send className="h-4 w-4 mr-1.5" />
          Send
        </Button>
      </div>
    </div>
  );
}
