'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Heading } from '@/components/ui/typography';
import { IconButton } from '@/components/ui/button';

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'fullscreen';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  children: React.ReactNode;
}

const modalSizeMap: Record<ModalSize, string> = {
  xs:   'max-w-xs',
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-xl',
  '2xl':'max-w-2xl',
  fullscreen: 'max-w-full h-full m-0 rounded-none',
};

export function Modal({ open, onClose, title, size = 'md', children }: ModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'w-full max-h-[90vh] overflow-y-auto rounded-xl border border-border-strong bg-overlay shadow-xl animate-scale-in-95 transition-all',
          modalSizeMap[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <Heading level="h3">{title}</Heading>
            <IconButton icon={<X className="h-4 w-4" />} variant="ghost" size="sm" aria-label="Close dialog" onClick={onClose} />
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
