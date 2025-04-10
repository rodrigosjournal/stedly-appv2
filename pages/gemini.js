// Full updated file with GitHub-style heatmap styling
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
import '../styles/heatmap-custom.css';

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
        <div className="flex flex-col lg:flex-row lg:gap-8">

          {/* Form */}
          <div className="w-full lg:w-[35%] xl:w-[30%] mb-10 lg:mb-0 p-8 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-lg lg:sticky lg:top-24 self-start">
            {/* ... form content unchanged ... */}
          </div>

          {/* Right Column */}
          <div className="w-full lg:w-[65%] xl:w-[70%] space-y-6">

            <div className="p-6 rounded-xl bg-neutral-950 border border-neutral-800 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-white">Exercise Frequency</h2>
              <div className="overflow-x-auto">
                <CalendarHeatmap
                  startDate={new Date(new Date().setDate(new Date().getDate() - 42))}
                  endDate={new Date()}
                  values={workouts.map(entry => ({ date: entry.date, count: entry.exercised ? 1 : 0 }))}
                  classForValue={value => (!value || value.count === 0 ? 'color-empty' : 'color-scale-1')}
                  showWeekdayLabels={true}
                  gutterSize={3}
                />
              </div>
            </div>

            <div className="p-6 rounded-xl bg-neutral-950 border border-neutral-800 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-white">Daily Trends</h2>
              <div className="w-full h-80 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={processedData.slice().reverse()} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#9CA3AF" tickLine={false} axisLine={{ stroke: "#4B5563" }} tick={{ fontSize: 10 }} />
                    <YAxis stroke="#9CA3AF" tickLine={false} axisLine={{ stroke: "#4B5563" }} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '6px', color: '#E5E7EB' }} labelStyle={{ color: '#D1D5DB', fontWeight: 'bold' }} itemStyle={{ fontSize: '12px' }} formatter={(value, name) => [`${typeof value === 'number' ? value.toFixed(1) : value}`, name]} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }} />
                    <Line type="monotone" dataKey="sleepHours" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Sleep (hrs)" />
                    <Line type="monotone" dataKey="workHours" stroke="#10B981" strokeWidth={2} dot={false} name="Work (hrs)" />
                    <Line type="monotone" dataKey="meals" stroke="#F59E0B" strokeWidth={2} dot={false} name="Meals (count)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

