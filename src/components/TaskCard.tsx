'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { priorityFromApi } from '@/services/taskService';
import type { TaskItem } from '@/types';

const PRIORITY_STYLES: Record<string, string> = {
  Low: 'bg-slate-100 text-slate-600',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-amber-100 text-amber-700',
  Urgent: 'bg-red-100 text-red-700',
};

export default function TaskCard({ task, compact = false, onClick }: { task: TaskItem; compact?: boolean; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = priorityFromApi(task.priority);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md',
        compact ? 'p-2' : 'p-3',
        isDragging && 'z-10 rotate-2 opacity-80 shadow-lg'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-900">{task.title}</p>
        <GripVertical className="h-4 w-4 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{task.description}</p>
      )}
      <div className="mt-3 flex items-center justify-between">
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-semibold',
            PRIORITY_STYLES[priority]
          )}
        >
          {priority}
        </span>
        {task.dueDate && (
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
