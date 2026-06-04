import { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  startOfWeek, 
  endOfWeek 
} from 'date-fns';
import { ChevronLeft, ChevronRight, FilterX } from 'lucide-react';
import { cn, TYPE_DOT_COLORS } from '../lib/utils';
import type { Task } from '../types';

interface CalendarProps {
  tasks?: Task[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  minimal?: boolean;
}

export function Calendar({ tasks = [], selectedDate, onSelectDate, minimal = false }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => startOfMonth(new Date()));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  // Start week on Monday (weekStartsOn: 1)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const handleDayClick = (dayStr: string) => {
    if (selectedDate === dayStr && !minimal) {
      onSelectDate(null);
    } else {
      onSelectDate(dayStr);
    }
  };

  return (
    <div className={cn("flex flex-col border border-zinc-700 rounded bg-zinc-800/80 p-4 relative", !minimal && "h-full")}>
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          className="text-zinc-500 hover:text-zinc-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="font-mono text-[11px] tracking-widest uppercase text-zinc-100">
          {format(currentDate, 'LLLL yyyy').replace(/^\w/, c => c.toUpperCase())}
        </h2>
        <button 
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="text-zinc-500 hover:text-zinc-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center text-[10px] font-mono text-zinc-500 mb-2">
        {weekDays.map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, i) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const isSelected = selectedDate === dayStr;
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          
          // Find tasks for this day
          const dayTasks = tasks.filter(t => t.deadline === dayStr && t.status !== 'closed');
          // Unique task types to show dots
          const types = Array.from(new Set(dayTasks.map(t => t.type))).slice(0, 3);

          return (
            <button
              key={i}
              onClick={() => handleDayClick(dayStr)}
              className={cn(
                "relative text-[11px] py-1 flex items-center justify-center font-sans transition-colors rounded",
                !isCurrentMonth && "text-zinc-600",
                isCurrentMonth && !isSelected && "text-zinc-300 hover:bg-zinc-700",
                isSelected && "bg-zinc-100 text-zinc-950 font-bold",
                isToday && !isSelected && "border border-zinc-600 bg-zinc-700/50"
              )}
            >
              <span>{format(day, 'd')}</span>
              
              {types.length > 0 && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {types.map((type, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "w-1 h-1 rounded-full",
                        TYPE_DOT_COLORS[type] || "bg-zinc-500",
                      )} 
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {!minimal && (
        <div className="mt-4 border-t border-transparent pt-2">
          <button
            onClick={() => onSelectDate(null)}
            disabled={!selectedDate}
            className="w-full mt-1 py-1 flex items-center justify-center text-[10px] uppercase tracking-tighter text-zinc-400 border border-dashed border-zinc-600 hover:border-zinc-400 hover:text-zinc-200 transition-all disabled:opacity-30 disabled:hover:border-zinc-600 disabled:hover:text-zinc-400"
          >
            Очистить фильтр дат
          </button>
        </div>
      )}
    </div>
  );
}
