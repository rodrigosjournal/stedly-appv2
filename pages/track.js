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

      <div className="px-6 py-10 w-full max-w-7xl mx-auto space-y-10">
        {/* Input Form & Graph Side-by-Side */}
        <div className="flex flex-col lg:flex-row lg:space-x-6">
          {/* Input Form */}
          <div className="lg:w-1/3 mb-10 lg:mb-0 p-6 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-lg">
            {/* ...input form content remains unchanged... */}
          </div>

          {/* Graph */}
          <div className="lg:w-2/3 p-6 rounded-2xl bg-black border border-neutral-800">
            {/* ...graph content remains unchanged... */}
          </div>
        </div>

        {/* Table */}
        <div className="p-6 rounded-xl bg-black border border-neutral-800">
          <h2 className="text-lg font-semibold mb-4 text-white">Logged Entries</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border border-neutral-800">
              <thead className="text-neutral-400 uppercase bg-neutral-900 border-b border-neutral-800">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Sleep Start</th>
                  <th className="px-4 py-2">Sleep End</th>
                  <th className="px-4 py-2">Sleep Hours</th>
                  <th className="px-4 py-2">Work Start</th>
                  <th className="px-4 py-2">Work End</th>
                  <th className="px-4 py-2">Work Hours</th>
                  <th className="px-4 py-2">Meals</th>
                  <th className="px-4 py-2">Exercised</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedData.map((entry) => (
                  <tr key={entry.id} className="border-b border-neutral-800">
                    <td className="px-4 py-2 text-white">{entry.date}</td>
                    <td className="px-4 py-2 text-white">{entry.sleepStart}</td>
                    <td className="px-4 py-2 text-white">{entry.sleepEnd}</td>
                    <td className="px-4 py-2 text-white">{entry.sleepHours.toFixed(2)}</td>
                    <td className="px-4 py-2 text-white">{entry.workStart}</td>
                    <td className="px-4 py-2 text-white">{entry.workEnd}</td>
                    <td className="px-4 py-2 text-white">{entry.workHours.toFixed(2)}</td>
                    <td className="px-4 py-2 text-white">{entry.meals}</td>
                    <td className="px-4 py-2 text-white">{entry.exercised ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => handleDelete(entry.id)} className="text-red-500 border border-red-500 rounded-md px-3 py-1 text-sm hover:bg-red-500 hover:text-black transition">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
