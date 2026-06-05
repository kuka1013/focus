import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Brain, Coffee } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLocalStorage } from '../hooks/useLocalStorage';

type TimerMode = 'study' | 'rest';

export function Timer() {
  const [studySecs, setStudySecs] = useLocalStorage('pomodoro_study_v2', 25 * 60);
  const [restSecs, setRestSecs] = useLocalStorage('pomodoro_rest_v2', 5 * 60);
  
  const [mode, setMode] = useState<TimerMode>('study');
  const [timeLeft, setTimeLeft] = useState(studySecs);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings values (temporary while editing)
  const [editMin, setEditMin] = useState(Math.floor((mode === 'study' ? studySecs : restSecs) / 60));
  const [editSec, setEditSec] = useState((mode === 'study' ? studySecs : restSecs) % 60);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playGameOver = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const notes = [
      { f: 300, d: 0.15 },
      { f: 250, d: 0.15 },
      { f: 200, d: 0.15 },
      { f: 150, d: 0.5 }
    ];

    let startTime = ctx.currentTime;
    
    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, startTime);
      
      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.d - 0.05);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + note.d);
      
      startTime += note.d + 0.05;
    });
  };

  useEffect(() => {
    let interval: number;
    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      playGameOver();
      // Switch mode
      const nextMode = mode === 'study' ? 'rest' : 'study';
      setMode(nextMode);
      setTimeLeft(nextMode === 'study' ? studySecs : restSecs);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, studySecs, restSecs]);

  const toggleTimer = () => {
    if (!isRunning) initAudio();
    setIsRunning(!isRunning);
  };
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'study' ? studySecs : restSecs);
  };

  const handleModeSwitch = (newMode: TimerMode) => {
    if (mode === newMode) return;
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'study' ? studySecs : restSecs);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>, setter: React.Dispatch<React.SetStateAction<number>>, max: number) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    setter(prev => {
      let next = prev + delta;
      if (next < 0) next = max;
      if (next > max) next = 0;
      return next;
    });
  };

  const saveSettings = () => {
    const totalSecs = Math.max(1, editMin * 60 + editSec);
    if (mode === 'study') {
      setStudySecs(totalSecs);
      setTimeLeft(totalSecs);
    } else {
      setRestSecs(totalSecs);
      setTimeLeft(totalSecs);
    }
    setShowSettings(false);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const hasHours = timeLeft >= 3600;

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded border border-zinc-800 p-6 relative overflow-hidden">
      
      <div className="flex justify-between items-center mb-6 w-full shrink-0">
        <h3 className="hidden sm:block font-mono text-[10px] uppercase tracking-widest text-zinc-500">Productivity Engine</h3>
        <div className="flex gap-1 p-0.5 bg-zinc-900 rounded border border-zinc-800">
          <button
            onClick={() => handleModeSwitch('study')}
            className={cn(
              "px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded-sm transition-colors",
              mode === 'study' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Study
          </button>
          <button
            onClick={() => handleModeSwitch('rest')}
            className={cn(
              "px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded-sm transition-colors",
              mode === 'rest' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Rest
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative pt-2">
        <div 
          className={cn(
            "text-[4.5rem] sm:text-[5rem] font-mono leading-none font-light tracking-tight transition-all duration-500 select-none cursor-pointer",
            hasHours ? "text-[3.5rem] sm:text-[4rem] text-zinc-300" : "text-zinc-100",
            isRunning ? "opacity-100" : "opacity-80 hover:opacity-100 flex-col items-center justify-center"
          )}
          onClick={() => {
            if (!isRunning) {
              setEditMin(Math.floor(timeLeft / 60));
              setEditSec(timeLeft % 60);
              setShowSettings(true);
            }
          }}
        >
          {formatTime(timeLeft)}
        </div>

        {showSettings && !isRunning && (
          <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center border border-zinc-800 rounded z-10 backdrop-blur-sm">
            <p className="text-[10px] font-mono text-zinc-500 mb-4 tracking-wider uppercase text-center">Прокрутите колесико</p>
            <div className="flex items-center gap-4 text-4xl font-mono font-light text-zinc-100">
              <div 
                className="flex flex-col items-center group cursor-n-resize"
                onWheel={(e) => handleWheel(e, setEditMin, 120)}
              >
                <div className="py-2 px-4 bg-transparent border-b border-zinc-800 transition-colors">
                  {editMin.toString().padStart(2, '0')}
                </div>
                <span className="text-[9px] text-zinc-600 mt-2 uppercase tracking-widest text-center">Мин</span>
              </div>
              <span className="mb-6 opacity-30 text-zinc-800">:</span>
              <div 
                className="flex flex-col items-center group cursor-n-resize"
                onWheel={(e) => handleWheel(e, setEditSec, 59)}
              >
                <div className="py-2 px-4 bg-transparent border-b border-zinc-800 transition-colors">
                  {editSec.toString().padStart(2, '0')}
                </div>
                <span className="text-[9px] text-zinc-600 mt-2 uppercase tracking-widest text-center">Сек</span>
              </div>
            </div>
            
            <button 
              onClick={saveSettings}
              className="mt-8 px-6 py-2 bg-zinc-100 text-zinc-950 text-[10px] uppercase font-mono font-bold hover:bg-zinc-200 transition-colors"
            >
              Сохранить
            </button>
          </div>
        )}

        <div className="flex gap-2 w-full mt-10">
          <button
            onClick={toggleTimer}
            className="flex-1 py-2 bg-zinc-100 text-zinc-950 font-mono text-[10px] uppercase font-bold hover:bg-zinc-200"
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={resetTimer}
            disabled={isRunning}
            className="w-10 flex items-center justify-center border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
