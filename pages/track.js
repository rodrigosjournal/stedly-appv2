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
      if (!user) {
        alert('User not logged in.');
        return;
      }

      if (editId) {
        await updateDoc(doc(db, 'workouts', editId), {
          ...dailyLog,
          userId: user.uid,
        });
      } else {
        const q = query(
          collection(db, 'workouts'),
          where('userId', '==', user.uid),
          where('date', '==', dailyLog.date)
        );
        const existingSnapshot = await getDocs(q);
        if (!existingSnapshot.empty) {
          alert('Entry for this date already exists.');
          return;
        }

        await addDoc(collection(db, 'workouts'), {
          ...dailyLog,
          userId: user.uid,
        });
      }

      alert('Entry submitted!');
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
      alert('Failed to submit. Check the console for more details.');
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

      <div className="px-6 py-10 w-full max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:gap-6">
        {/* Input Form */}
        <div className="w-full lg:w-[30%] mb-10 lg:mb-0 p-8 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-lg">
         
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
              
              <button onClick={handleDailyLogSubmit} className="w-full bg-black text-white px-6 py-3 rounded-xl font-semibold border border-neutral-700 hover:bg-neutral-900 transition">Submit</button>

  
            </div>
          </div>
        </div>

{/* Exercise Frequency Heatmap */}
<div className="w-full p-6 rounded-xl bg-black border border-neutral-800">
  <h2 className="text-lg font-semibold mb-4 text-white">Exercise Frequency</h2>
  <CalendarHeatmap
    startDate={new Date(new Date().setMonth(new Date().getMonth() - 2))} // last 2 months
    endDate={new Date()}
    values={workouts.map(entry => ({
      date: entry.date,
      count: entry.exercised ? 1 : 0
    }))}
    classForValue={(value) => {
      if (!value || value.count === 0) return 'bg-black';
      return 'bg-green-500';
    }}
    showWeekdayLabels={true}
    gutterSize={3}
  />
</div>
          {/* Graph */}
<div className="w-full lg:w-[70%] p-6 rounded-xl bg-black border border-neutral-800">
  <h2 className="text-lg font-semibold mb-4 text-white">Daily Trends</h2>
  <div className="w-full h-[600px]">
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

        {/* Table */}
        <div className="w-full lg:w-[70%] p-6 rounded-xl bg-black border border-neutral-800">
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
};

export default Dashboard;
