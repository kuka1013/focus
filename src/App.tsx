/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Calendar } from './components/Calendar';
import { TaskList } from './components/TaskList';
import { TaskForm } from './components/TaskForm';
import { Timer } from './components/Timer';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Task, TaskStatus } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('pomodoro_tasks', []);
  const [subjectsHistory, setSubjectsHistory] = useLocalStorage<string[]>('pomodoro_subjects', []);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'status' | 'createdAt'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: crypto.randomUUID(),
      status: 'not_started',
      createdAt: Date.now(),
    };
    
    setTasks(prev => [...prev, newTask]);
    
    // We don't auto-save subject to history here anymore. 
    // It's handled by TaskForm manually if the user asks.
  };

  const handleUpdateStatus = (id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Filter tasks
  const mainListTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!t.deadline) return false;
      const matchSearch = t.topic.toLowerCase().includes(search.toLowerCase()) || 
                          t.subject.toLowerCase().includes(search.toLowerCase());
      
      const matchStatus = statusFilter === 'all' 
        ? t.status !== 'closed' 
        : t.status === statusFilter;
        
      const matchDate = !selectedDate || t.deadline === selectedDate;
      
      return matchSearch && matchStatus && matchDate;
    });
  }, [tasks, search, statusFilter, selectedDate]);

  const sidebarTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.deadline) return false;
      if (statusFilter === 'all') return t.status !== 'closed';
      return t.status === statusFilter;
    });
  }, [tasks, statusFilter]);

  return (
    <div className="flex flex-col xl:flex-row h-screen w-full bg-zinc-800 text-zinc-100 font-sans overflow-hidden">
      
      {/* Left Sidebar: Calendar & No Deadline Tasks */}
      <aside className="h-auto xl:h-full xl:w-80 border-b xl:border-b-0 xl:border-r border-zinc-700 shrink-0 flex flex-col bg-zinc-800/50 z-10 overflow-hidden relative">
        <div className="p-4 pb-0 shrink-0">
          <div className="mb-4 xl:mb-6 shrink-0">
            <h1 className="text-lg xl:text-xl font-medium tracking-tight">Focus & Tasks</h1>
            <p className="text-xs font-mono text-zinc-400 mt-1">Обучение и дедлайны</p>
          </div>
          <div className="shrink-0 mb-6">
            <Calendar tasks={tasks} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </div>
        </div>
        
        {sidebarTasks.length > 0 && (
          <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-4 flex flex-col items-start min-h-0 relative -mx-1">
            <div className="sticky top-0 bg-zinc-800/95 backdrop-blur-sm z-10 w-full py-2 mb-2 rounded-sm border-b border-zinc-700/50 shadow-sm">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">Без дедлайна</h3>
            </div>
            <div className="space-y-2 w-full">
              {sidebarTasks.map(task => (
                <div key={task.id} className="p-3 bg-zinc-800/80 border border-zinc-700 rounded relative group">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">{task.subject}</span>
                    <button onClick={() => handleDelete(task.id)} className="text-zinc-600 hover:text-red-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity" title="Удалить"><span className="text-[10px] uppercase font-mono tracking-widest pl-2">DEL</span></button>
                  </div>
                  {task.topic && <p className="text-sm font-medium mt-1 leading-tight text-white/90">{task.topic}</p>}
                  
                  <div className="flex gap-1 mt-3">
                    {(['not_started', 'in_progress', 'ready', 'closed'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => handleUpdateStatus(task.id, s)}
                        title={s === 'not_started' ? 'Не начато' : s === 'in_progress' ? 'В процессе' : s === 'ready' ? 'Готово к сдаче' : 'Закрыто'}
                        className={cn(
                          "w-2.5 h-2.5 rounded-full transition-all duration-300",
                          task.status === s ? "ring-2 ring-offset-2 ring-offset-zinc-800 scale-110" : "opacity-40 hover:opacity-100 hover:scale-110",
                          s === 'not_started' ? (task.status === s ? 'bg-red-500 ring-red-500/50' : 'bg-red-500') :
                          s === 'in_progress' ? (task.status === s ? 'bg-yellow-500 ring-yellow-500/50' : 'bg-yellow-500') :
                          s === 'ready' ? (task.status === s ? 'bg-blue-500 ring-blue-500/50' : 'bg-blue-500') : 
                          (task.status === s ? 'bg-green-500 ring-green-500/50' : 'bg-green-500')
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content: Tasks */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-900 relative h-[60vh] xl:h-full border-b xl:border-b-0 border-zinc-700">
        <header className="shrink-0 p-6 border-b border-zinc-800 bg-zinc-900 flex flex-col lg:flex-row items-start lg:items-center justify-between z-20 gap-4">
          <div className="flex bg-zinc-800/50 rounded p-1 border border-zinc-700/50 w-full lg:w-auto overflow-x-auto hide-scrollbar order-2 lg:order-1">
            {(['all', 'not_started', 'in_progress', 'ready', 'closed'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-mono tracking-wider uppercase rounded transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap min-w-fit",
                  statusFilter === s ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                {s !== 'all' && (
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    s === 'not_started' ? "bg-red-500" : 
                    s === 'in_progress' ? "bg-yellow-500" : 
                    s === 'ready' ? "bg-blue-500" : "bg-green-500"
                  )} />
                )}
                {s === 'all' ? 'Все' : s === 'not_started' ? 'Не начато' : s === 'in_progress' ? 'В процессе' : s === 'ready' ? 'Готово' : 'Закрыто'}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-64 order-1 lg:order-2 group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs opacity-50 grayscale">🔍</span>
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search task or subject..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 pl-8 text-xs outline-none focus:border-zinc-600 transition-colors"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-8">
            <TaskForm 
      onAdd={handleAddTask} 
      subjectsList={subjectsHistory} 
      onSaveSubject={(sub) => setSubjectsHistory(prev => Array.from(new Set([...prev, sub])))} 
      tasks={tasks}
    />
            <TaskList 
              tasks={mainListTasks} 
              onUpdateStatus={handleUpdateStatus} 
              onDelete={handleDelete} 
            />
          </div>
        </div>
      </main>

      {/* Right Sidebar: Timer */}
      <aside className="h-[50vh] xl:h-full xl:w-96 p-4 shrink-0 flex flex-col bg-zinc-800/50 z-10 xl:border-l border-zinc-700">
        <Timer />
      </aside>

    </div>
  );
}
