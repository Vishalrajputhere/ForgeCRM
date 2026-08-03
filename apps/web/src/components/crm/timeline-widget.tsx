'use client';

import { useCRM } from '@/hooks/use-crm';
import { useFormatters } from '@/hooks/use-formatters';

interface TimelineWidgetProps {
  entityType: string;
  entityId: string;
  className?: string;
}

const TITLE_ICON_MAP: Record<string, { icon: string; color: string }> = {
  Created: { icon: 'M12 4v16m8-8H4', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  Updated: { icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  Moved: { icon: 'M13 7l5 5m0 0l-5 5m5-5H6', color: 'text-violet-400 bg-violet-500/20 border-violet-500/30' },
  Converted: { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  Completed: { icon: 'M5 13l4 4L19 7', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  Cancelled: { icon: 'M6 18L18 6M6 6l12 12', color: 'text-rose-400 bg-rose-500/20 border-rose-500/30' },
  Deactivated: { icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', color: 'text-rose-400 bg-rose-500/20 border-rose-500/30' },
  Disqualified: { icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-rose-400 bg-rose-500/20 border-rose-500/30' },
};

function getIconForTitle(title: string): { icon: string; color: string } {
  for (const [key, config] of Object.entries(TITLE_ICON_MAP)) {
    if (title.includes(key)) return config;
  }
  return { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-slate-400 bg-slate-800 border-slate-700' };
}

export function TimelineWidget({ entityType, entityId, className = '' }: TimelineWidgetProps): React.JSX.Element {
  const { useTimeline } = useCRM();
  const { formatDateTime } = useFormatters();
  const { data: activities, isLoading } = useTimeline(entityType, entityId);

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-3 bg-slate-800 rounded w-3/4" />
              <div className="h-2.5 bg-slate-800/60 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className={`py-8 text-center ${className}`}>
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">No activity recorded yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-0 ${className}`}>
      {activities.map((activity, index) => {
        const iconConfig = getIconForTitle(activity.title ?? '');
        const isLast = index === activities.length - 1;
        const dateStr = formatDateTime(activity.occurred_at ?? activity.created_at);

        return (
          <div key={activity.id} className="flex gap-3">
            {/* Timeline line + icon */}
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${iconConfig.color}`}>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconConfig.icon} />
                </svg>
              </div>
              {!isLast && <div className="w-px flex-1 bg-slate-800 mt-1 mb-0.5 min-h-[16px]" />}
            </div>

            {/* Content */}
            <div className={`${isLast ? 'pb-0' : 'pb-4'} min-w-0`}>
              <p className="text-sm font-medium text-slate-300">{activity.title}</p>
              {activity.description && (
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{activity.description}</p>
              )}
              <p className="text-xs text-slate-600 mt-1">{dateStr}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
