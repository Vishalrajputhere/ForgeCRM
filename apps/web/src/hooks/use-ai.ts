'use client';

import { useState, useCallback } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface AIProviderInfo {
  provider: string;
  model: string;
  max_context_tokens: number;
}

export function useAI() {
  const { currentWorkspace } = useWorkspace();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am ForgeCRM AI Copilot. How can I help you analyze deals, summarize accounts, or draft sales emails today?',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const sendMessage = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || isStreaming) return;

      const userMsg: AIMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: prompt,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      const assistantMsgId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: '🤖 Thinking…',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      try {
        const response = await fetch('/api/v1/ai/chat', {
          method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Workspace-ID': currentWorkspace?.id || '',
            },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
            provider: selectedProvider,
            model: selectedModel,
          }),
        });

        if (!response.ok) {
          throw new Error('AI service error');
        }

        const data = await response.json();
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: data.message.content } : msg
          )
        );
      } catch (err) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: `⚠️ AI Service response simulated: Processing prompt '${prompt}' for workspace context.` }
              : msg
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming, selectedProvider, selectedModel, currentWorkspace]
  );

  return {
    messages,
    sendMessage,
    isStreaming,
    selectedProvider,
    setSelectedProvider,
    selectedModel,
    setSelectedModel,
  };
}
