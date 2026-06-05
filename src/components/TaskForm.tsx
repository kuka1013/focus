import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn, PREDEFINED_SUBJECTS } from '../lib/utils';
import type { Task, TaskType } from '../types';
import { Calendar } from './Calendar';

interface TaskFormProps {
  onAdd: (task: Omit<Task, 'id' | 'status' | 'createdAt'>) => void;
  subjectsList: string[];
  onSaveSubject: (subject: string) => void;
  tasks: Task[];
}

export function TaskForm({ onAdd, subjectsList, onSaveSubject, tasks }: TaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<TaskType>('');
  const [topic, setTopic] = useState('');
  const [hasDeadline, setHasDeadline] = useState(true);
  const [deadline, setDeadline] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [link, setLink] = useState('');

  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const filteredSubjects = Array.from(new Set([...subjectsList, ...PREDEFINED_SUBJECTS]))
    .filter(s => s.toLowerCase().includes(subject.toLowerCase()));

  const taskTypes: { value: TaskType, label: string }[] = [
    { value: 'ЛР', label: 'Лабораторная работа (ЛР)' },
    { value: 'КР', label: 'Контрольная работа (КР)' },
    { value: 'РК', label: 'Рубежный контроль (РК)' },
    { value: 'ДЗ', label: 'Домашнее задание (ДЗ)' },
    { value: 'Экзамен', label: 'Экзамен' },
  ];

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (subjectInputRef.current && !subjectInputRef.current.contains(e.target as Node)) {
        setShowSubjectDropdown(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || (hasDeadline && !deadline)) return;

    onAdd({
      subject: subject.trim(),
      type,
      topic: topic.trim(),
      deadline: hasDeadline ? deadline : undefined,
      link: link.trim() || undefined,
    });

    // Reset form
    setSubject('');
    setType('');
    setTopic('');
    setHasDeadline(true);
    setDeadline(format(new Date(), 'yyyy-MM-dd'));
    setLink('');
    setIsOpen(false);
  };

  return (
    <div className="mb-6 flex flex-col items-end">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-zinc-100 text-zinc-950 px-4 py-2 rounded flex items-center gap-2 font-bold text-xs uppercase tracking-tight transition-colors hover:bg-zinc-200"
      >
        <span>{isOpen ? '—' : '+'}</span> {isOpen ? 'Скрыть форму' : 'Создать запись'}
      </button>

      {isOpen && (
        <div className="w-full mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleSubmit} className="p-4 border border-zinc-800 rounded bg-zinc-900/40 space-y-4 flex flex-col">
            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 gap-4">
              {/* Subject */}
              <div className="space-y-1 relative" ref={subjectInputRef}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Задание / Дисциплина</label>
                </div>
                <input
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setShowSubjectDropdown(true);
                  }}
                  onFocus={() => setShowSubjectDropdown(true)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600 transition-colors"
                  placeholder="Название задания..."
                  required
                />
                
                {showSubjectDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded shadow-xl z-30 custom-scrollbar origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                    {filteredSubjects.length > 0 ? (
                      filteredSubjects.map(sub => (
                        <div
                          key={sub}
                          onClick={() => {
                            setSubject(sub);
                            setShowSubjectDropdown(false);
                          }}
                          className="px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer transition-colors"
                        >
                          {sub}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-zinc-500 italic">Нет совпадений</div>
                    )}
                    
                    {subject && !filteredSubjects.includes(subject) && (
                      <div className="px-3 py-2 border-t border-zinc-800">
                        <button
                          type="button"
                          onClick={() => {
                            onSaveSubject(subject);
                            setShowSubjectDropdown(false);
                          }}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Сохранить в список
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Type */}
              <div className="space-y-1 relative" ref={typeDropdownRef}>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Тип</label>
                <div className="relative">
                  <input
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      setShowTypeDropdown(true);
                    }}
                    onFocus={() => setShowTypeDropdown(true)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600 transition-colors pr-8"
                    placeholder="ЛР, КР..."
                  />
                  <ChevronDown 
                    className={cn("w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-transform cursor-pointer hover:text-zinc-300", showTypeDropdown && "rotate-180")}
                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  />
                </div>
                
                {showTypeDropdown && taskTypes.filter(t => t.value.toLowerCase().includes(type.toLowerCase()) || t.label.toLowerCase().includes(type.toLowerCase())).length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded shadow-2xl z-30 overflow-y-auto max-h-48 origin-top animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar">
                    {taskTypes
                      .filter(t => t.value.toLowerCase().includes(type.toLowerCase()) || t.label.toLowerCase().includes(type.toLowerCase()))
                      .map(t => (
                      <div
                        key={t.value}
                        onClick={() => {
                          setType(t.value);
                          setShowTypeDropdown(false);
                        }}
                        className={cn(
                          "px-3 py-2 text-sm cursor-pointer transition-colors",
                          type === t.value ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                        )}
                      >
                        {t.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Topic */}
              <div className="space-y-1 sm:col-span-2 border-t border-zinc-900 pt-4 mt-2 sm:border-none sm:pt-0 sm:mt-0">
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Тема / Описание</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600 transition-colors"
                  placeholder="Что нужно сделать..."
                />
              </div>

              {/* Deadline */}
              <div className="space-y-1 relative" ref={datePickerRef}>
                <div className="flex items-center justify-between mt-4 sm:mt-0">
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Дедлайн</label>
                  <button 
                    type="button" 
                    onClick={() => setHasDeadline(!hasDeadline)}
                    className={cn(
                      "text-[10px] uppercase font-mono tracking-wider transition-colors",
                      hasDeadline ? "text-zinc-500 hover:text-zinc-300" : "text-blue-400 hover:text-blue-300"
                    )}
                  >
                    {hasDeadline ? 'Без дедлайна' : '+ Добавить дедлайн'}
                  </button>
                </div>
                {hasDeadline ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className={cn(
                        "w-full bg-zinc-950 border rounded px-3 py-2 text-sm text-left transition-colors flex items-center justify-between",
                        deadline ? "border-zinc-800 text-zinc-100" : "border-zinc-800 text-zinc-500",
                        showDatePicker && "border-zinc-600"
                      )}
                    >
                      <span>{deadline ? format(new Date(deadline), 'dd MMMM yyyy') : 'Выберите дату...'}</span>
                      <CalendarIcon className="w-4 h-4 text-zinc-600" />
                    </button>
                    {showDatePicker && typeof document !== 'undefined' && createPortal(
                      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={(e) => {
                        if (e.target === e.currentTarget) setShowDatePicker(false);
                      }}>
                        <div className="w-full max-w-[320px] bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                          <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/30">
                            <span className="font-mono text-xs uppercase text-zinc-400 font-medium">Выберите дату</span>
                            <button type="button" onClick={() => setShowDatePicker(false)} className="text-zinc-500 hover:text-white transition-colors" title="Закрыть">
                              <Plus className="w-4 h-4 rotate-45" />
                            </button>
                          </div>
                          <div className="p-2">
                            <Calendar
                              tasks={tasks}
                              selectedDate={deadline || format(new Date(), 'yyyy-MM-dd')}
                              onSelectDate={(d) => {
                                if (d) setDeadline(d);
                                setShowDatePicker(false);
                              }}
                              minimal
                            />
                          </div>
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>
                ) : (
                  <div className="w-full bg-zinc-950/50 border border-zinc-800 border-dashed rounded px-3 py-2 text-sm text-zinc-600 font-mono tracking-wide text-center">
                    Дедлайн не установлен
                  </div>
                )}
              </div>

              {/* Link */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Ссылка</label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600 transition-colors"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-zinc-100 text-zinc-950 px-4 py-2 rounded text-sm font-medium hover:bg-white transition-colors"
              >
                Сохранить задачу
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
