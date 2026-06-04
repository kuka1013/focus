import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PREDEFINED_SUBJECTS = [
  'История России',
  'Операционные системы',
  'Математическая логика и теория алгоритмов',
  'Иностранный язык',
  'Языки программирования',
  'Интегралы и дифференциальные уравнения',
  'Физика',
  'Безопасность объектов критической информационной инфраструктуры',
  'Линейная алгебра',
  'Элективный курс по физической культуре и спорту',
];

export const TYPE_COLORS: Record<string, string> = {
  'ЛР': 'bg-blue-900/20 text-blue-400',
  'КР': 'bg-purple-900/20 text-purple-400',
  'РК': 'bg-orange-900/20 text-orange-400',
  'ДЗ': 'bg-green-900/20 text-green-400',
  'Экзамен': 'bg-red-900/20 text-red-400',
};

export const TYPE_STRIPE_COLORS: Record<string, string> = {
  'ЛР': 'bg-blue-500',
  'КР': 'bg-purple-500',
  'РК': 'bg-orange-500',
  'ДЗ': 'bg-green-500',
  'Экзамен': 'bg-red-500',
};

export const TYPE_DOT_COLORS: Record<string, string> = {
  'ЛР': 'bg-blue-400',
  'КР': 'bg-purple-400',
  'РК': 'bg-orange-400',
  'ДЗ': 'bg-green-400',
  'Экзамен': 'bg-red-400',
};

export const STATUS_LABELS = {
  'not_started': '🔴 Не начато',
  'in_progress': '🟡 В процессе',
  'ready': '🔵 Готово к сдаче',
  'closed': '🟢 Сдано (Закрыто)'
};
