'use client';

import React from 'react';
import { Bell, Check, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { Heading, Text, Caption } from '@/components/ui/typography';
import { IconButton } from '@/components/ui/button';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'deal' | 'task' | 'system';
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', title: 'Deal Closed Won', message: 'Enterprise Cloud Renewal worth $120,000 was moved to Closed Won.', time: '10m ago', read: false, type: 'deal' },
  { id: '2', title: 'Task Due Soon', message: 'Follow up with Acme Corp VP of Engineering is due today.', time: '1h ago', read: false, type: 'task' },
  { id: '3', title: 'Automation Triggered', message: 'High-Value Lead Routing rule dispatched successfully.', time: '3h ago', read: true, type: 'system' },
];

export function NotificationCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-border-default bg-surface shadow-2xl animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between border-b border-border-subtle p-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-accent" />
          <Heading level="h4">Notifications</Heading>
        </div>
        <IconButton icon={<Check className="h-4 w-4" />} variant="ghost" size="sm" aria-label="Close notifications" onClick={onClose} />
      </div>

      <div className="divide-y divide-border-subtle overflow-y-auto max-h-[calc(100vh-60px)]">
        {SAMPLE_NOTIFICATIONS.map((n) => (
          <div key={n.id} className={`p-4 transition-colors hover:bg-hover ${!n.read ? 'bg-accent/5' : ''}`}>
            <div className="flex items-start gap-3">
              {n.type === 'deal' ? (
                <TrendingUp className="h-4 w-4 text-status-success-fg shrink-0 mt-0.5" />
              ) : n.type === 'task' ? (
                <Zap className="h-4 w-4 text-status-warning-fg shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-status-info-fg shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <Text variant="body-s" className="font-semibold text-primary">{n.title}</Text>
                  <Caption color="muted" tabular>{n.time}</Caption>
                </div>
                <Caption color="secondary" className="mt-1 block leading-relaxed">{n.message}</Caption>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
