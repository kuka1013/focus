import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { Task } from '../types';

export function useFirebaseSync() {
  const [user, setUser] = useState(auth.currentUser);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjectsHistory, setSubjectsHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (!u) {
        setTasks([]);
        setSubjectsHistory([]);
        setLoading(false);
      }
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    
    // Listen to tasks
    const qTasks = query(collection(db, `users/${user.uid}/tasks`), orderBy('createdAt', 'asc'));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const newTasks: Task[] = [];
      snapshot.forEach((doc) => {
        newTasks.push(doc.data() as Task);
      });
      setTasks(newTasks);
    }, (error) => {
      console.error("Firestore Error Tasks:", error);
    });

    // Listen to preferences
    const unsubPrefs = onSnapshot(doc(db, `users/${user.uid}`), (docSnap) => {
        if (docSnap.exists() && docSnap.data().subjectsHistory) {
            setSubjectsHistory(docSnap.data().subjectsHistory);
        } else {
            setSubjectsHistory([]);
        }
        setLoading(false);
    }, (error) => {
        console.error("Firestore Error Prefs:", error);
        setLoading(false);
    });

    return () => {
      unsubTasks();
      unsubPrefs();
    };
  }, [user]);

  const addTask = async (taskData: Omit<Task, 'id' | 'status' | 'createdAt'>) => {
    if (!user) return;
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      status: 'not_started',
      createdAt: Date.now(),
      userId: user.uid,
    } as Task; // Adding userId for rules
    
    // Optimistic update
    setTasks(prev => [...prev, newTask]);
    
    try {
        await setDoc(doc(db, `users/${user.uid}/tasks`, newTask.id), newTask);
    } catch (e) {
        console.error("Failed to add task", e);
    }
  };

  const updateTaskStatus = async (id: string, status: string) => {
    if (!user) return;
    
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: status as any } : t));
    
    try {
        await updateDoc(doc(db, `users/${user.uid}/tasks`, id), { status });
    } catch (e) {
        console.error("Failed to update status", e);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    
    setTasks(prev => prev.filter(t => t.id !== id));
    
    try {
        await deleteDoc(doc(db, `users/${user.uid}/tasks`, id));
    } catch (e) {
        console.error("Failed to delete task", e);
    }
  };

  const updateSubjectsHistory = async (newSubjects: string[]) => {
      if (!user) return;
      setSubjectsHistory(newSubjects);
      try {
          await setDoc(doc(db, `users/${user.uid}`), { subjectsHistory: newSubjects }, { merge: true });
      } catch (e) {
          console.error("Failed to save subjects", e);
      }
  };

  return { user, loading, tasks, subjectsHistory, addTask, updateTaskStatus, deleteTask, updateSubjectsHistory };
}
