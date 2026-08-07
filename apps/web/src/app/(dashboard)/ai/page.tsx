'use client';

import * as React from 'react';
import { Sparkles, Library, ShieldCheck } from 'lucide-react';
import { Container, Stack, PageHeader, PageActions } from '@/components/ui/layout-primitives';
import { Heading, Text } from '@/components/ui/typography';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModelSelector } from '@/components/ai/model-selector';
import { AIChat } from '@/components/ai/ai-chat';
import { useAI } from '@/hooks/use-ai';

export default function AIWorkspacePage() {
  const {
    messages,
    sendMessage,
    isStreaming,
    selectedProvider,
    setSelectedProvider,
    selectedModel,
    setSelectedModel,
  } = useAI();

  return (
    <Container size="full" className="py-6">
      <Stack gap={6}>
        {/* Page Header */}
        <PageHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <Heading level="h1" className="text-xl font-bold">AI Workspace & Sales Copilot</Heading>
              <Text color="muted" variant="body-s">Provider-agnostic AI assistant powered by Model Context Protocol (MCP) and RAG document intelligence.</Text>
            </div>
          </div>
          <PageActions>
            <ModelSelector
              provider={selectedProvider}
              onProviderChange={setSelectedProvider}
              model={selectedModel}
              onModelChange={setSelectedModel}
            />
          </PageActions>
        </PageHeader>

        {/* Workspace Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Prompt Templates Sidebar */}
          <Card variant="surface" className="p-4 space-y-4 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Library className="h-3.5 w-3.5 text-accent" />
                Prompt Library
              </span>
              <Badge variant="neutral">System</Badge>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => sendMessage('Summarize top high-value deal risks in the pipeline')}
                className="w-full text-left p-2.5 rounded-lg bg-elevated hover:bg-surface-hover border border-border-subtle text-xs text-primary transition-all active:scale-[0.98]"
              >
                🎯 <strong className="font-semibold">Pipeline Risk Assessment</strong>
                <p className="text-muted mt-0.5 text-[11px]">Identify deals stuck &gt;30 days.</p>
              </button>

              <button
                onClick={() => sendMessage('Draft a follow-up email for Acme Corp Q3 renewal')}
                className="w-full text-left p-2.5 rounded-lg bg-elevated hover:bg-surface-hover border border-border-subtle text-xs text-primary transition-all active:scale-[0.98]"
              >
                📧 <strong className="font-semibold">Draft Follow-Up Email</strong>
                <p className="text-muted mt-0.5 text-[11px]">Personalized proposal follow-up.</p>
              </button>

              <button
                onClick={() => sendMessage('Predict lead conversion probability for new leads')}
                className="w-full text-left p-2.5 rounded-lg bg-elevated hover:bg-surface-hover border border-border-subtle text-xs text-primary transition-all active:scale-[0.98]"
              >
                ⚡ <strong className="font-semibold">AI Lead Scoring Audit</strong>
                <p className="text-muted mt-0.5 text-[11px]">Score leads based on ICP fit.</p>
              </button>
            </div>

            <div className="border-t border-border-subtle pt-3 text-[11px] text-muted space-y-1">
              <div className="flex items-center gap-1 text-status-success-fg">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>RBAC & Multi-tenant Protected</span>
              </div>
              <p>All AI queries enforce workspace isolation.</p>
            </div>
          </Card>

          {/* Main AI Chat Shell */}
          <div className="lg:col-span-3">
            <AIChat messages={messages} onSendMessage={sendMessage} isStreaming={isStreaming} />
          </div>
        </div>
      </Stack>
    </Container>
  );
}
