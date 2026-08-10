'use client';

import * as React from 'react';
import { Languages } from 'lucide-react';

interface EmailTranslationPanelProps {
  onTranslate?: ((lang: string) => void) | undefined;
}

const LANGUAGES = ['Spanish', 'French', 'German', 'Japanese', 'Portuguese', 'Chinese'];

export function EmailTranslationPanel({ onTranslate }: EmailTranslationPanelProps) {
  const [selectedLang, setSelectedLang] = React.useState('Spanish');

  return (
    <div className="p-3.5 rounded-xl bg-surface border border-border-subtle space-y-2.5">
      <div className="flex items-center gap-2">
        <Languages className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-bold text-primary">Multilingual Localization</h3>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="flex-1 px-3 py-1.5 rounded-lg bg-elevated border border-border-subtle text-xs font-semibold text-primary outline-none focus:border-accent"
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <button
          onClick={() => onTranslate?.(selectedLang)}
          className="px-3 py-1.5 rounded-lg bg-accent text-accent-fg text-xs font-semibold hover:bg-accent/90 transition-colors shrink-0"
        >
          Translate
        </button>
      </div>
    </div>
  );
}
