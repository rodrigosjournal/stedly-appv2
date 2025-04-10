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
        {/* Input Form */}
        <div className="mb-12 p-6 rounded-xl bg-black border border-neutral-800 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 bg-black border border-neutral-700 rounded-md col-span-1">
              <label className="block text-sm text-neutral-400 mb-2">Date</label>
              <input
                type="date"
                value={dailyLog.date}
                onChange={(e) => setDailyLog({ ...dailyLog, date: e.target.value })}
                className="w-full bg-black border border-neutral-700 text-white px-4 py-2 rounded-md focus:outline-none focus:border-white"
              />
            </div>
            <div className="p-4 bg-black border border-neutral-800 rounded-md col-span-1">
              <label className="block text-sm text-neutral-400 mb-2">Sleep Start</label>
              <input
                type="time"
                value={dailyLog.sleepStart}
                onChange={(e) => setDailyLog({ ...dailyLog, sleepStart: e.target.value })}
                className="w-full bg-black border border-neutral-800 text-white px-4 py-2 rounded-md focus:outline-none focus:border-white"
              />
            </div>
            <div className="p-4 bg-black border border-neutral-800 rounded-md col-span-1">
              <label className="block text-sm text-neutral-400 mb-2">Sleep End</label>
              <input
                type="time"
                value={dailyLog.sleepEnd}
                onChange={(e) => setDailyLog({ ...dailyLog, sleepEnd: e.target.value })}
                className="w-full bg-black border border-neutral-800 text-white px-4 py-2 rounded-md focus:outline-none focus:border-white"
              />
            </div>
            <div className="p-4 bg-black border border-neutral-800 rounded-md col-span-1">
              <label className="block text-sm text-neutral-400 mb-2">Work Start</label>
              <input
                type="time"
                value={dailyLog.workStart}
                onChange={(e) => setDailyLog({ ...dailyLog, workStart: e.target.value })}
                className="w-full bg-black border border-neutral-800 text-white px-4 py-2 rounded-md focus:outline-none focus:border-white"
              />
            </div>
            <div className="p-4 bg-black border border-neutral-800 rounded-md col-span-1">
              <label className="block text-sm text-neutral-400 mb-2">Work End</label>
              <input
                type="time"
                value={dailyLog.workEnd}
                onChange={(e) => setDailyLog({ ...dailyLog, workEnd: e.target.value })}
                className="w-full bg-black border border-neutral-800 text-white px-4 py-2 rounded-md focus:outline-none focus:border-white"
              />
            </div>
            <div className="p-4 bg-black border border-neutral-800 rounded-md col-span-1">
              <label className="block text-sm text-neutral-400 mb-2">Meals</label>
              <input
                type="number"
                value={dailyLog.meals}
                onChange={(e) => setDailyLog({ ...dailyLog, meals: e.target.value })}
                placeholder="Enter meals"
                className="w-full bg-black border border-neutral-800 text-white placeholder-white px-4 py-2 rounded-md focus:outline-none focus:border-white"
              />
            </div>
            <div className="p-4 bg-black border border-neutral-800 rounded-md col-span-1">
              <label className="block text-sm text-neutral-400 mb-2">Exercise</label>
              <div className="flex justify-between gap-2">
                <button
                  onClick={() => setDailyLog({ ...dailyLog, exercised: true })}
                  className={`w-full py-2 rounded-md text-white border transition ${dailyLog.exercised ? 'bg-neutral-800 text-white border-neutral-700' : 'bg-black border-neutral-800'}`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setDailyLog({ ...dailyLog, exercised: false })}
                  className={`w-full py-2 rounded-md text-white border transition ${!dailyLog.exercised ? 'bg-neutral-800 text-white border-neutral-700' : 'bg-black border-neutral-800'}`}
                >
                  No
                </button>
              </div>
            </div>
            <div className="p-4 bg-black border border-neutral-800 rounded-md col-span-1 flex items-end">
              <button
                onClick={handleDailyLogSubmit}
                className="w-full h-full bg-black border border-neutral-800 text-white hover:border-white hover:text-white font-medium rounded-md transition flex items-center justify-center"
              >
                Submit
              </button>
            </div>
          </div>
        </div>

        {/* Graph */}
        <div className="mt-10 p-6 rounded-xl bg-black border border-neutral-800">
          <h2 className="text-lg font-semibold mb-4 text-white">Daily Trends</h2>
          <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData}>
                <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#666" tickLine={false} axisLine={{ stroke: "#333" }} tick={{ fontSize: 12 }} />
                <YAxis stroke="#666" tickLine={false} axisLine={{ stroke: "#333" }} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f0f0f', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} labelStyle={{ color: '#aaa' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#aaa' }} />
                <Line type="monotone" dataKey="sleepHours" stroke="#6B7280" strokeWidth={2} dot={false} name="Sleep" />
                <Line type="monotone" dataKey="workHours" stroke="#10B981" strokeWidth={2} dot={false} name="Work" />
                <Line type="monotone" dataKey="meals" stroke="#F59E0B" strokeWidth={2} dot={false} name="Meals" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
