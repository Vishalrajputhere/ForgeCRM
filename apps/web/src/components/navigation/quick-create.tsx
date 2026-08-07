'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Zap, Building2, Users, TrendingUp, CheckSquare2, HardDrive, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Caption } from '@/components/ui/typography';

export function QuickCreateMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const createActions = [
    { label: 'New Lead', icon: <Zap className="h-4 w-4 text-amber-400" />, href: '/leads' },
    { label: 'New Company', icon: <Building2 className="h-4 w-4 text-sky-400" />, href: '/companies' },
    { label: 'New Contact', icon: <Users className="h-4 w-4 text-emerald-400" />, href: '/contacts' },
    { label: 'New Deal', icon: <TrendingUp className="h-4 w-4 text-indigo-400" />, href: '/deals' },
    { label: 'New Task', icon: <CheckSquare2 className="h-4 w-4 text-purple-400" />, href: '/tasks' },
    { label: 'Upload File', icon: <HardDrive className="h-4 w-4 text-teal-400" />, href: '/storage' },
  ];

  return (
    <div className="relative inline-block">
      <Button
        variant="primary"
        size="sm"
        icon={<Plus className="h-4 w-4" />}
        iconPosition="left"
        onClick={() => setOpen(!open)}
      >
        <span className="hidden sm:inline">Create</span>
        <ChevronDown className="h-3 w-3 ml-0.5" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-border-default bg-overlay p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          <Caption color="muted" className="px-2.5 py-1 uppercase text-[10px] font-semibold tracking-wider block">
            Quick Actions
          </Caption>
          {createActions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                router.push(action.href);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-secondary hover:text-primary hover:bg-hover transition-colors"
            >
              {action.icon}
              <span className="font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
