import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { Task } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useFirebaseSync(isDemoLoggedIn: boolean) {
  const user = isDemoLoggedIn ? { uid: 'demo-user' } : null;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjectsHistory, setSubjectsHistory] = useState<string[]>([]);
  const [timerSettings, setTimerSettings] = useState<{studySecs: number, restSecs: number}>({ studySecs: 25 * 60, restSecs: 5 * 60 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setSubjectsHistory([]);
      return;
    }
    
    setLoading(true);
    
    // Listen to tasks
    const tasksPath = `users/${user.uid}/tasks`;
    const qTasks = query(collection(db, tasksPath), orderBy('createdAt', 'asc'));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const newTasks: Task[] = [];
      snapshot.forEach((doc) => {
        newTasks.push(doc.data() as Task);
      });
      setTasks(newTasks);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, tasksPath);
    });

    // Listen to preferences
    const prefsPath = `users/${user.uid}`;
    const unsubPrefs = onSnapshot(doc(db, prefsPath), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.subjectsHistory) setSubjectsHistory(data.subjectsHistory);
            if (data.studySecs !== undefined && data.restSecs !== undefined) {
                setTimerSettings({ studySecs: data.studySecs, restSecs: data.restSecs });
            }
        } else {
            setSubjectsHistory([]);
        }
        setLoading(false);
    }, (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.GET, prefsPath);
    });

    return () => {
      unsubTasks();
      unsubPrefs();
    };
  }, [user?.uid]);

  const addTask = async (taskData: Omit<Task, 'id' | 'status' | 'createdAt'>) => {
    if (!user) return;
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      status: 'not_started',
      createdAt: Date.now(),
      userId: user.uid,
    } as Task; // Adding userId for rules
    
    // Remove undefined values to prevent FirebaseError
    const cleanTask = Object.fromEntries(Object.entries(newTask).filter(([_, v]) => v !== undefined)) as Task;

    // Optimistic update
    setTasks(prev => [...prev, cleanTask]);
    
    const taskPath = `users/${user.uid}/tasks`;
    try {
        await setDoc(doc(db, taskPath, cleanTask.id), cleanTask);
    } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, taskPath);
    }
  };

  const updateTaskStatus = async (id: string, status: string) => {
    if (!user) return;
    
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: status as any } : t));
    
    const taskPath = `users/${user.uid}/tasks`;
    try {
        await updateDoc(doc(db, taskPath, id), { status });
    } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, taskPath);
    }
  };

  const updateTaskProgress = async (id: string, progress: number) => {
    if (!user) return;
    
    setTasks(prev => prev.map(t => t.id === id ? { ...t, progress } : t));
    
    const taskPath = `users/${user.uid}/tasks`;
    try {
        await updateDoc(doc(db, taskPath, id), { progress });
    } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, taskPath);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    
    setTasks(prev => prev.filter(t => t.id !== id));
    
    const taskPath = `users/${user.uid}/tasks`;
    try {
        await deleteDoc(doc(db, taskPath, id));
    } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, taskPath);
    }
  };

  const updateSubjectsHistory = async (newSubjects: string[]) => {
      if (!user) return;
      setSubjectsHistory(newSubjects);
      const prefsPath = `users/${user.uid}`;
      try {
          await setDoc(doc(db, prefsPath), { subjectsHistory: newSubjects }, { merge: true });
      } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, prefsPath);
      }
  };

  const updateTimerSettings = async (studySecs: number, restSecs: number) => {
      if (!user) return;
      setTimerSettings({ studySecs, restSecs });
      const prefsPath = `users/${user.uid}`;
      try {
          await setDoc(doc(db, prefsPath), { studySecs, restSecs }, { merge: true });
      } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, prefsPath);
      }
  };

  return { user, loading, tasks, subjectsHistory, timerSettings, addTask, updateTaskStatus, updateTaskProgress, deleteTask, updateSubjectsHistory, updateTimerSettings };
}
