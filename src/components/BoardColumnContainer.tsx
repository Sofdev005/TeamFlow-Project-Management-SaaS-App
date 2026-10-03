'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import TaskCard from '@/components/TaskCard';
import type { BoardColumn, TaskItem } from '@/types';

interface Props {
  column: BoardColumn;
  compact?: boolean;
  onTaskClick: (task: TaskItem) => void;
  onAddTask: (columnId: string) => void;
}

export default function BoardColumnContainer({ column, compact = false, onTaskClick, onAddTask }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border bg-slate-100/60 transition-colors ${
        isOver ? 'border-indigo-400 bg-indigo-50/60' : 'border-slate-200'
      }`}
    >
      <div className={`flex items-center justify-between ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-800">{column.title}</h3>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
            {column.tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
          title="Add task"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto pb-3 ${compact ? 'space-y-1 px-2' : 'space-y-2 px-3'}`} style={{ minHeight: 120 }}>
        <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} compact={compact} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
        {column.tasks.length === 0 && (
          <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
