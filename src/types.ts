export type TaskType = string;
export type TaskStatus = 'not_started' | 'in_progress' | 'ready' | 'closed';

export interface Task {
  id: string;
  subject: string;
  type: TaskType;
  topic: string;
  deadline?: string; // YYYY-MM-DD
  link?: string;
  status: TaskStatus;
  createdAt: number;
  userId?: string;
}
