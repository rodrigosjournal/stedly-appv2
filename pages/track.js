// Full updated file with logic and layout fixes
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
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

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
      if (user) fetchWorkouts(user.uid);
      else router.push('/');
    });
    return () => unsubscribe();
  }, [router]);

  const fetchWorkouts = async (uid) => {
    const q = query(collection(db, 'workouts'), where('userId', '==', uid));
    const querySnapshot = await getDocs(q);
    setWorkouts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleDailyLogSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return alert('User not logged in.');

      const q = query(
        collection(db, 'workouts'),
        where('userId', '==', user.uid),
        where('date', '==', dailyLog.date)
      );
      const existing = await getDocs(q);
      if (!existing.empty && !editId) return alert('Entry for this date already exists.');

      const docRef = editId ? doc(db, 'workouts', editId) : collection(db, 'workouts');
      const fn = editId ? updateDoc : addDoc;
      await fn(docRef, { ...dailyLog, userId: user.uid });

      setEditId(null);
      setDailyLog({ date: new Date().toISOString().split('T')[0], sleepStart: '', sleepEnd: '', workStart: '', workEnd: '', meals: '', exercised: false });
      fetchWorkouts(user.uid);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Submit failed.');
    }
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'workouts', id));
    setWorkouts(workouts.filter(w => w.id !== id));
  };

  const processedData = workouts.map(entry => {
    const sleep = entry.sleepStart && entry.sleepEnd ? (new Date(`1970-01-01T${entry.sleepEnd}`) - new Date(`1970-01-01T${entry.sleepStart}`)) / 3600000 : 0;
    const work = entry.workStart && entry.workEnd ? (new Date(`1970-01-01T${entry.workEnd}`) - new Date(`1970-01-01T${entry.workStart}`)) / 3600000 : 0;
    return { ...entry, sleepHours: sleep, workHours: work };
  });

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <nav className="bg-black border-b border-neutral-800 px-6 py-4 flex justify-between">
        <span className="text-xl font-semibold">Steadly.app</span>
      </nav>

      <div className="px-6 py-10 w-full max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:gap-6">

          {/* Form */}
          <div className="w-full lg:w-[30%] p-8 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-lg space-y-6">
            <div>
              <label className="text-white mb-1 block">Date</label>
              <input type="date" value={dailyLog.date} onChange={e => setDailyLog({ ...dailyLog, date: e.target.value })} className="w-full bg-black border border-neutral-700 text-white px-4 py-2 rounded-lg" />
            </div>

            <div className="flex flex-col sm:flex-row sm:space-x-4">
              <div className="flex-1">
                <label className="text-white mb-1 block">Sleep Start</label>
                <input type="time" value={dailyLog.sleepStart} onChange={e => setDailyLog({ ...dailyLog, sleepStart: e.target.value })} className="w-full bg-black border border-neutral-700 text-white px-4 py-2 rounded-lg" />
              </div>
              <div className="flex-1">
                <label className="text-white mb-1 block">Sleep End</label>
                <input type="time" value={dailyLog.sleepEnd} onChange={e => setDailyLog({ ...dailyLog, sleepEnd: e.target.value })} className="w-full bg-black border border-neutral-700 text-white px-4 py-2 rounded-lg" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:space-x-4">
              <div className="flex-1">
                <label className="text-white mb-1 block">Work Start</label>
                <input type="time" value={dailyLog.workStart} onChange={e => setDailyLog({ ...dailyLog, workStart: e.target.value })} className="w-full bg-black border border-neutral-700 text-white px-4 py-2 rounded-lg" />
              </div>
              <div className="flex-1">
                <label className="text-white mb-1 block">Work End</label>
                <input type="time" value={dailyLog.workEnd} onChange={e => setDailyLog({ ...dailyLog, workEnd: e.target.value })} className="w-full bg-black border border-neutral-700 text-white px-4 py-2 rounded-lg" />
              </div>
            </div>

            <div>
              <label className="text-white mb-1 block">Meals</label>
              <input type="number" placeholder="e.g. 3" value={dailyLog.meals} onChange={e => setDailyLog({ ...dailyLog, meals: e.target.value })} className="w-full bg-black border border-neutral-700 text-white px-4 py-2 rounded-lg" />
            </div>

            <div>
              <label className="text-white mb-2 block">Exercised</label>
              <div className="flex w-full border border-neutral-700 rounded-lg overflow-hidden">
                <button onClick={() => setDailyLog({ ...dailyLog, exercised: true })} className={`w-1/2 py-2 text-center font-medium ${dailyLog.exercised ? 'bg-white text-black' : 'bg-black text-white'}`}>Yes</button>
                <div className="w-px bg-neutral-700" />
                <button onClick={() => setDailyLog({ ...dailyLog, exercised: false })} className={`w-1/2 py-2 text-center font-medium ${!dailyLog.exercised ? 'bg-white text-black' : 'bg-black text-white'}`}>No</button>
              </div>
            </div>

            <button onClick={handleDailyLogSubmit} className="w-full bg-black text-white px-6 py-3 rounded-xl font-semibold border border-neutral-700 hover:bg-neutral-900 transition">Submit</button>
          </div>

          {/* Right side: Heatmap + Graph */}
          <div className="flex flex-col justify-between gap-6 w-full lg:w-[70%] max-h-[90vh] overflow-auto">
            {/* Heatmap */}
            <div className="p-6 rounded-xl bg-black border border-neutral-800">
              <h2 className="text-lg font-semibold mb-4 text-white">Exercise Frequency</h2>
              <CalendarHeatmap
                startDate={new Date(new Date().setMonth(new Date().getMonth() - 2))}
                endDate={new Date()}
                values={workouts.map(entry => ({ date: entry.date, count: entry.exercised ? 1 : 0 }))}
                classForValue={value => (!value || value.count === 0 ? 'bg-black' : 'bg-green-500')}
                showWeekdayLabels={true}
                gutterSize={3}
              />
            </div>

            {/* Graph */}
            <div className="p-6 rounded-xl bg-black border border-neutral-800">
              <h2 className="text-lg font-semibold mb-4 text-white">Daily Trends</h2>
              <div className="w-full h-[400px]">
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

        {/* Table */}
        <div className="mt-10 p-6 rounded-xl bg-black border border-neutral-800">
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
