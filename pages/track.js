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

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'workouts', id));
    setWorkouts(workouts.filter((entry) => entry.id !== id));
  };

  const processedData = workouts.map((entry) => {
    const sleepHours = entry.sleepStart && entry.sleepEnd
      ? (new Date(`1970-01-01T${entry.sleepEnd}`) - new Date(`1970-01-01T${entry.sleepStart}`)) / (1000 * 60 * 60)
      : 0;
    const workHours = entry.workStart && entry.workEnd
      ? (new Date(`1970-01-01T${entry.workEnd}`) - new Date(`1970-01-01T${entry.workStart}`)) / (1000 * 60 * 60)
      : 0;
    return {
      id: entry.id,
      date: entry.date,
      sleepStart: entry.sleepStart,
      sleepEnd: entry.sleepEnd,
      sleepHours,
      workStart: entry.workStart,
      workEnd: entry.workEnd,
      workHours,
      meals: entry.meals,
      exercised: entry.exercised
    };
  });

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <nav className="bg-black border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-semibold tracking-tight">Steadly.app</span>
      </nav>

      <div className="px-6 py-10 w-full max-w-4xl mx-auto">
        {/* Input Form */}
        <div className="mb-12 p-8 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-lg">
          <h2 className="text-white text-xl font-semibold mb-6">Log Daily Entry</h2>

          <div className="space-y-6">
            <div className="flex flex-col">
              <label className="text-white mb-1">Date</label>
              <input type="date" value={dailyLog.date} onChange={(e) => setDailyLog({ ...dailyLog, date: e.target.value })} className="bg-black border border-neutral-700 text-white px-4 py-2 rounded-lg" />
            </div>

            <div className="flex flex-col sm:flex-row sm:space-x-4">
              <div className="flex-1 flex flex-col mb-4 sm:mb-0">
                <label className="text-white mb-1">Sleep Start</label>
                <input type="time" value={dailyLog.sleepStart} onChange={(e) => setDailyLog({ ...dailyLog, sleepStart: e.target.value })} className="bg-black border border-neutral-700 text-white px-4 py-2 rounded-lg" />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="text-white mb-1">Sleep End</label>
                <input type="time" value={dailyLog.sleepEnd} onChange={(e) => setDailyLog({ ...dailyLog, sleepEnd: e.target.value })} className="bg-black border border-neutral-700 text-white px-4 py-2 rounded-lg" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:space-x-4">
              <div className="flex-1 flex flex-col mb-4 sm:mb-0">
                <label className="text-white mb-1">Work Start</label>
                <input type="time" value={dailyLog.workStart} onChange={(e) => setDailyLog({ ...dailyLog, workStart: e.target.value })} className="bg-black border border-neutral-700 text-white px-4 py-2 rounded-lg" />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="text-white mb-1">Work End</label>
                <input type="time" value={dailyLog.workEnd} onChange={(e) => setDailyLog({ ...dailyLog, workEnd: e.target.value })} className="bg-black border border-neutral-700 text-white px-4 py-2 rounded-lg" />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-white mb-1">Meals</label>
              <input type="number" placeholder="e.g. 3" value={dailyLog.meals} onChange={(e) => setDailyLog({ ...dailyLog, meals: e.target.value })} className="bg-black border border-neutral-700 text-white px-4 py-2 rounded-lg" />
            </div>

            <div className="flex flex-col">
              <label className="text-white mb-2">Exercised</label>
              <div className="flex space-x-4">
                <button onClick={() => setDailyLog({ ...dailyLog, exercised: true })} className={`px-6 py-2 rounded-lg border font-medium transition ${dailyLog.exercised ? 'bg-white text-black' : 'bg-black border-white text-white hover:bg-neutral-800'}`}>Yes</button>
                <button onClick={() => setDailyLog({ ...dailyLog, exercised: false })} className={`px-6 py-2 rounded-lg border font-medium transition ${!dailyLog.exercised ? 'bg-white text-black' : 'bg-black border-white text-white hover:bg-neutral-800'}`}>No</button>
              </div>
            </div>

            <div>
              <button onClick={handleDailyLogSubmit} className="w-full bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-neutral-300 transition">Submit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

