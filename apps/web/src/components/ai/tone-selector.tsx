'use client';

import * as React from 'react';
import { Sliders } from 'lucide-react';

export type EmailTone = 'Executive' | 'Formal' | 'Friendly' | 'Persuasive' | 'Urgent' | 'Empathetic';

interface ToneSelectorProps {
  selectedTone?: EmailTone | undefined;
  onSelectTone?: ((tone: EmailTone) => void) | undefined;
}

const TONES: EmailTone[] = ['Executive', 'Formal', 'Friendly', 'Persuasive', 'Urgent', 'Empathetic'];

export function ToneSelector({ selectedTone = 'Professional' as EmailTone, onSelectTone }: ToneSelectorProps) {
  return (
    <div className="p-3.5 rounded-xl bg-surface border border-border-subtle space-y-2.5">
      <div className="flex items-center gap-2">
        <Sliders className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-bold text-primary">Tone Switcher</h3>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TONES.map((t) => {
          const isActive = selectedTone === t;
          return (
            <button
              key={t}
              onClick={() => onSelectTone?.(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                isActive
                  ? 'bg-accent text-accent-fg border-accent shadow-sm'
                  : 'bg-elevated text-secondary border-border-subtle hover:bg-surface-hover'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}
