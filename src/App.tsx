/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Search, CalendarDays, ListTodo, Clock, LogOut } from 'lucide-react';
import { Calendar } from './components/Calendar';
import { TaskList } from './components/TaskList';
import { TaskForm } from './components/TaskForm';
import { Timer } from './components/Timer';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Task, TaskStatus } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [isDemoLoggedIn, setIsDemoLoggedIn] = useLocalStorage('demo_logged_in', false);
  const { user, loading, tasks, subjectsHistory, timerSettings, addTask, updateTaskStatus, updateTaskProgress, deleteTask, updateSubjectsHistory, updateTimerSettings } = useFirebaseSync(isDemoLoggedIn);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<'tasks' | 'timer' | 'calendar'>('tasks');

  // Login form state
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'status' | 'createdAt'>) => {
    addTask(newTaskData);
  };

  const handleUpdateStatus = (id: string, status: TaskStatus) => {
    updateTaskStatus(id, status);
  };

  const handleDelete = (id: string) => {
    deleteTask(id);
  };

  const handleSaveSubject = (sub: string) => {
    updateSubjectsHistory(Array.from(new Set([...subjectsHistory, sub])));
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

  if (loading) {
      return (
          <div className="flex items-center justify-center h-screen w-full bg-zinc-900 text-zinc-100">
              <div className="animate-pulse flex flex-col items-center">
                  <div className="w-8 h-8 border-2 border-t-zinc-100 border-zinc-700 rounded-full animate-spin mb-4" />
                  <span className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Загрузка...</span>
              </div>
          </div>
      );
  }

  if (!isDemoLoggedIn) {
      const handleLogin = (e: React.FormEvent) => {
          e.preventDefault();
          if (loginForm.username === 'demo' && loginForm.password === '123456') {
              setIsDemoLoggedIn(true);
          } else {
              alert("Неверный логин или пароль.\nДля входа используйте заготовленный аккаунт:\nЛогин: demo\nПароль: 123456");
          }
      };

      return (
          <div className="flex items-center justify-center h-[100dvh] w-full bg-zinc-900 text-zinc-100 px-4">
              <div className="max-w-sm w-full bg-zinc-800/50 border border-zinc-700 rounded-xl p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-6">
                      <ListTodo className="w-8 h-8" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight mb-2">Focus & Tasks</h1>
                  <p className="text-zinc-400 text-sm mb-6">Войдите в заранее подготовленный аккаунт для синхронизации.</p>
                  
                  <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
                      <input 
                          type="text" 
                          placeholder="Логин (demo)" 
                          value={loginForm.username}
                          onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-zinc-500 transition-colors"
                      />
                      <input 
                          type="password" 
                          placeholder="Пароль (123456)" 
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-zinc-500 transition-colors"
                      />
                      <button type="submit" className="w-full bg-white text-black font-medium py-3 px-4 rounded-lg hover:bg-zinc-200 transition-colors mt-2">
                          Войти в систему
                      </button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col xl:flex-row h-[100dvh] w-full bg-zinc-800 text-zinc-100 font-sans overflow-hidden">
      
      {/* Left Sidebar: Calendar & No Deadline Tasks */}
      <aside className={cn(
        "xl:w-80 border-r border-zinc-700 shrink-0 flex flex-col bg-zinc-800/50 z-10 overflow-hidden relative",
        mobileTab === 'calendar' ? "flex h-full flex-1" : "hidden xl:flex xl:h-full"
      )}>
        <div className="p-4 pb-0 shrink-0">
          <div className="mb-4 xl:mb-6 shrink-0 flex items-center justify-between">
            <div>
              <h1 className="text-lg xl:text-xl font-medium tracking-tight">Focus & Tasks</h1>
              <p className="text-xs font-mono text-zinc-400 mt-1">Обучение и дедлайны</p>
            </div>
            <div className="flex items-center gap-2">
                {sidebarTasks.length > 0 && (
                  <span className="xl:hidden bg-zinc-700/50 text-zinc-300 text-[10px] uppercase font-mono px-2 py-1 rounded">
                    Без дедлайна: {sidebarTasks.length}
                  </span>
                )}
                <button onClick={() => setIsDemoLoggedIn(false)} className="p-2 text-zinc-500 hover:text-zinc-200 transition-colors rounded-lg bg-zinc-800/50 border border-zinc-700" title="Выйти">
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
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
            <div className="space-y-2 w-full pb-6">
              {sidebarTasks.map(task => (
                <div key={task.id} className="p-3 bg-zinc-800/80 border border-zinc-700 rounded relative group">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">{task.subject}</span>
                    <button onClick={() => handleDelete(task.id)} className="text-zinc-600 hover:text-red-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity" title="Удалить"><span className="text-[10px] uppercase font-mono tracking-widest pl-2">DEL</span></button>
                  </div>
                  {task.topic && <p className="text-sm font-medium mt-1 leading-tight text-white/90">{task.topic}</p>}
                  
                  <div className="flex bg-zinc-900 rounded p-0.5 border border-zinc-700/50 w-fit mt-3 overflow-x-auto hide-scrollbar">
                    {(['not_started', 'in_progress', 'ready', 'closed'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => handleUpdateStatus(task.id, s)}
                        title={s === 'not_started' ? 'Не начато' : s === 'in_progress' ? 'В процессе' : s === 'ready' ? 'Готово к сдаче' : 'Закрыто'}
                        className={cn(
                          "w-6 h-6 flex items-center justify-center rounded-sm transition-all duration-300",
                          task.status === s ? "bg-zinc-800" : "hover:bg-zinc-800/50"
                        )}
                      >
                        <div className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          s === 'not_started' ? (task.status === s ? 'bg-red-500 ring-2 ring-red-500/50 ring-offset-1 ring-offset-zinc-800' : 'bg-red-500/40') :
                          s === 'in_progress' ? (task.status === s ? 'bg-yellow-500 ring-2 ring-yellow-500/50 ring-offset-1 ring-offset-zinc-800' : 'bg-yellow-500/40') :
                          s === 'ready' ? (task.status === s ? 'bg-blue-500 ring-2 ring-blue-500/50 ring-offset-1 ring-offset-zinc-800' : 'bg-blue-500/40') : 
                          (task.status === s ? 'bg-green-500 ring-2 ring-green-500/50 ring-offset-1 ring-offset-zinc-800' : 'bg-green-500/40')
                        )} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content: Tasks */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 bg-zinc-900 relative border-r border-zinc-700",
        mobileTab === 'tasks' ? "flex h-full flex-1" : "hidden xl:flex xl:h-full"
      )}>
        <header className="shrink-0 p-4 xl:p-6 border-b border-zinc-800 bg-zinc-900 flex flex-col lg:flex-row items-stretch lg:items-center justify-between z-20 gap-4">
          <div className="flex bg-zinc-800/50 rounded p-1 border border-zinc-700/50 w-full lg:w-auto overflow-x-auto hide-scrollbar order-2 lg:order-1">
            {(['all', 'not_started', 'in_progress', 'ready', 'closed'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-2 lg:py-1.5 text-[10px] font-mono tracking-wider uppercase rounded transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap min-w-[70px]",
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
              className="w-full bg-zinc-100/5 xl:bg-zinc-900 border border-zinc-700 xl:border-zinc-800 rounded px-3 py-2 xl:py-1.5 pl-8 text-xs outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-all text-zinc-100"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 xl:p-6 custom-scrollbar pb-24 xl:pb-6">
          <div className="max-w-4xl mx-auto space-y-6 xl:space-y-8 relative">
            <div className="sticky top-0 z-10 -mx-4 px-4 pb-4 pt-1 bg-gradient-to-b from-zinc-900 via-zinc-900 to-transparent xl:static xl:p-0 xl:bg-none">
              <TaskForm 
                onAdd={handleAddTask} 
                subjectsList={subjectsHistory} 
                onSaveSubject={handleSaveSubject} 
                tasks={tasks}
              />
            </div>
            <TaskList 
              tasks={mainListTasks} 
              onUpdateStatus={handleUpdateStatus} 
              onUpdateProgress={updateTaskProgress}
              onDelete={handleDelete} 
            />
          </div>
        </div>
      </main>

      {/* Right Sidebar: Timer */}
      <aside className={cn(
        "xl:w-96 p-4 shrink-0 flex flex-col bg-zinc-800/50 z-10",
        mobileTab === 'timer' ? "flex h-full flex-1" : "hidden xl:flex xl:h-full"
      )}>
        <Timer studySecs={timerSettings.studySecs} restSecs={timerSettings.restSecs} onUpdateSettings={updateTimerSettings} />
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="xl:hidden shrink-0 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 flex items-center justify-around p-2 pb-safe absolute bottom-0 left-0 right-0 z-50">
        <button 
          onClick={() => setMobileTab('calendar')}
          className={cn("flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[70px]", mobileTab === 'calendar' ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300")}
        >
          <CalendarDays className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] uppercase font-mono tracking-wider font-semibold">Календарь</span>
        </button>
        <button 
          onClick={() => setMobileTab('tasks')}
          className={cn("flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[70px]", mobileTab === 'tasks' ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300")}
        >
          <ListTodo className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] uppercase font-mono tracking-wider font-semibold">Задачи</span>
        </button>
        <button 
          onClick={() => setMobileTab('timer')}
          className={cn("flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[70px]", mobileTab === 'timer' ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300")}
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] uppercase font-mono tracking-wider font-semibold">Фокус</span>
        </button>
      </nav>

    </div>
  );
}
