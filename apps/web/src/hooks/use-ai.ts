'use client';

import { useState, useCallback } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import { useAuthStore } from '@/stores/auth-store';

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
        // Build auth headers — mirrors api-client.ts interceptor logic
        let token = useAuthStore.getState().accessToken;
        if (!token && typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('forge_auth_storage');
            if (raw) token = JSON.parse(raw)?.state?.accessToken ?? null;
          } catch { /* ignore */ }
        }
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Workspace-ID': currentWorkspace?.id || '',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/ai/chat', {
          method: 'POST',
          headers,
          credentials: 'include',
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
      } catch (_err) {
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
