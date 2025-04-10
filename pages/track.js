import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const Dashboard = () => {
  const [editId, setEditId] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [dailyLog, setDailyLog] = useState({
    date: new Date().toISOString().split('T')[0],
    sleepStart: '',
    sleepEnd: '',
    workStart: '',
    workEnd: '',
    meals: '',
    exercised: false
  });

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        fetchWorkouts(user.uid);
      } else {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchWorkouts = async (uid) => {
    const q = query(collection(db, 'workouts'), where('userId', '==', uid));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setWorkouts(data);
  };

  const handleDailyLogSubmit = async () => {
    try {
      const user = auth.currentUser;

      if (editId) {
        await updateDoc(doc(db, 'workouts', editId), {
          ...dailyLog,
          userId: user.uid,
        });
      } else {
        const q = query(collection(db, 'workouts'), where('userId', '==', user.uid), where('date', '==', dailyLog.date));
        const existingSnapshot = await getDocs(q);
        if (!existingSnapshot.empty) {
          console.warn('Entry for this date already exists.');
          return;
        }

        await addDoc(collection(db, 'workouts'), {
          ...dailyLog,
          userId: user.uid,
        });
      }

      setDailyLog({
        date: new Date().toISOString().split('T')[0],
        sleepStart: '',
        sleepEnd: '',
        workStart: '',
        workEnd: '',
        meals: '',
        exercised: false
      });
      setEditId(null);
      fetchWorkouts(user.uid);
    } catch (err) {
      console.error('Failed to submit daily log:', err);
    }
  };

  const processedData = workouts.map((entry) => {
    const sleepHours = entry.sleepStart && entry.sleepEnd
      ? (new Date(`1970-01-01T${entry.sleepEnd}`) - new Date(`1970-01-01T${entry.sleepStart}`)) / (1000 * 60 * 60)
      : 0;
    const workHours = entry.workStart && entry.workEnd
      ? (new Date(`1970-01-01T${entry.workEnd}`) - new Date(`1970-01-01T${entry.workStart}`)) / (1000 * 60 * 60)
      : 0;
    return {
      date: entry.date,
      sleepHours,
      workHours,
      meals: entry.meals
    };
  });

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <nav className="bg-black border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-semibold tracking-tight">Steadly.app</span>
      </nav>

      <div className="px-6 py-10 w-full max-w-7xl mx-auto">
        <p className="text-neutral-500 text-center py-8">Graph and table go here</p>
      </div>
    </div>
  );
};

export default Dashboard;
