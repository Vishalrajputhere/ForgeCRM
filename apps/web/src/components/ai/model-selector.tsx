'use client';

import * as React from 'react';
import { Cpu } from 'lucide-react';
import { Select } from '@/components/ui/select';

export interface ModelSelectorProps {
  provider: string;
  onProviderChange: (provider: string) => void;
  model: string;
  onModelChange: (model: string) => void;
}

export function ModelSelector({
  provider,
  onProviderChange,
  model,
  onModelChange,
}: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Cpu className="h-4 w-4 text-accent" />
      <Select
        value={`${provider}:${model}`}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          const parts = e.target.value.split(':');
          onProviderChange(parts[0] || 'gemini');
          onModelChange(parts[1] || 'gemini-1.5-flash');
        }}
        options={[
          { label: 'Google Gemini 1.5 Flash (Fast & Low Cost)', value: 'gemini:gemini-1.5-flash' },
          { label: 'Google Gemini 1.5 Pro (Deep Reasoning)', value: 'gemini:gemini-1.5-pro' },
          { label: 'OpenAI GPT-4o-mini (Balanced)', value: 'openai:gpt-4o-mini' },
          { label: 'OpenAI GPT-4o (High Performance)', value: 'openai:gpt-4o' },
          { label: 'Ollama Llama 3.1 (Local / On-Premise)', value: 'ollama:llama3.1' },
        ]}
      />
    </div>
  );
}
