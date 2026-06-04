import { isSameDay, format, parseISO, addDays, isPast as isPastDate, startOfDay } from 'date-fns';
import { ExternalLink, Trash2 } from 'lucide-react';
import { cn, TYPE_COLORS, TYPE_STRIPE_COLORS, STATUS_LABELS } from '../lib/utils';
import type { Task, TaskStatus } from '../types';

interface TaskListProps {
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}

export function TaskList({ tasks, onUpdateStatus, onDelete }: TaskListProps) {
  // Group tasks by deadline
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.deadline]) {
      acc[task.deadline] = [];
    }
    acc[task.deadline].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Sort dates
  const sortedDates = Object.keys(groupedTasks).sort((a, b) => a.localeCompare(b));

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 pb-20">
      {sortedDates.map(date => {
        const dateObj = parseISO(date);
        const today = startOfDay(new Date());
        const isPast = dateObj < today;
        const isTomorrow = isSameDay(dateObj, addDays(today, 1));
        
        return (
          <div key={date} className="space-y-3">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "font-mono text-xs uppercase tracking-[0.2em]",
                  isPast ? "text-red-500/80" : "text-zinc-500"
                )}>
                  {format(dateObj, 'MMM dd — yyyy')}
                </span>
                {isTomorrow && <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded text-[9px] font-bold tracking-widest font-mono uppercase">Завтра</span>}
              </div>
              <div className="h-px bg-zinc-800 flex-1"></div>
            </div>

            <div className="grid gap-3">
              {groupedTasks[date].map(task => (
                <div
                  key={task.id}
                  className={cn(
                    "flex gap-4 border border-zinc-800 rounded p-4 transition-all duration-300",
                    task.status === 'closed' 
                      ? "bg-zinc-900/20 opacity-40 grayscale" 
                      : "bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60"
                  )}
                >
                  <div className={cn("w-1 flex-shrink-0 rounded-full", task.status === 'closed' ? 'bg-zinc-500' : TYPE_STRIPE_COLORS[task.type] || "bg-zinc-500")} />
                  
                  <div className="flex-1 flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1">
                        {task.type && (
                          <span className={cn(
                            "text-[10px] font-mono uppercase px-2 py-0.5 rounded inline-block",
                            TYPE_COLORS[task.type] || "bg-zinc-800 text-zinc-300"
                          )}>
                            {task.type}
                          </span>
                        )}
                        <h4 className={cn(
                          "text-sm font-semibold mt-1",
                          task.status === 'closed' ? "text-zinc-500 line-through" : "text-zinc-100"
                        )}>
                          {task.subject}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-0.5">{task.topic}</p>
                      </div>

                      <div className="text-left sm:text-right flex flex-col sm:items-end">
                        <div className="text-[11px] font-mono text-zinc-400">
                           {format(parseISO(task.deadline), 'dd.MM')} DEADLINE
                        </div>
                        {task.link && (
                          <a
                            href={task.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-300 mt-2 underline transition-colors"
                          >
                            Материалы ↗
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                      <div className="flex bg-zinc-900 rounded p-0.5 border border-zinc-800 w-full sm:w-auto overflow-x-auto hide-scrollbar">
                        {(['not_started', 'in_progress', 'ready', 'closed'] as TaskStatus[]).map(s => (
                          <button
                            key={s}
                            onClick={() => onUpdateStatus(task.id, s)}
                            className={cn(
                              "px-3 py-1.5 sm:py-1 text-[10px] uppercase font-mono transition-colors whitespace-nowrap",
                              task.status === s
                                ? "bg-zinc-800 text-zinc-100 rounded-sm"
                                : "text-zinc-500 hover:text-zinc-300 rounded-sm"
                            )}
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => onDelete(task.id)}
                        className="text-red-400 font-mono text-[10px] uppercase hover:text-red-300 hover:bg-red-400/10 px-2 py-1 rounded transition-colors"
                        title="Удалить задачу"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
