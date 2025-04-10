// Full updated file using D3 binary heatmap
import { useEffect, useState, useRef, useLayoutEffect } from 'react';
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
import * as d3 from 'd3';

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
  const heatmapRef = useRef(null);

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
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    setWorkouts(data);
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

  useLayoutEffect(() => {
    if (!heatmapRef.current) return;
    d3.select(heatmapRef.current).selectAll('*').remove();
    const svg = d3.select(heatmapRef.current).attr('width', 365).attr('height', 160);
    const cellSize = 10;

    const start = new Date('2025-01-01');
    const end = new Date('2025-12-31');
    const days = d3.timeDays(start, end);
    const dataMap = new Map(workouts.map(w => [w.date, w.exercised ? 1 : 0]));

    svg.selectAll('rect')
      .data(days)
      .enter()
      .append('rect')
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('x', (d, i) => Math.floor(i / 7) * (cellSize + 1))
      .attr('y', (d, i) => (i % 7) * (cellSize + 1))
      .attr('fill', d => {
        const key = d.toISOString().split('T')[0];
        const value = dataMap.get(key);
        return value ? '#22c55e' : '#0a0a0a';
      });
  }, [workouts]);

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <nav className="bg-black border-b border-neutral-800 px-6 py-4 flex justify-between">
        <span className="text-xl font-semibold">Steadly.app</span>
      </nav>

      <div className="px-6 py-10 w-full max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:gap-8">

          {/* Form */}
          <div className="w-full lg:w-[30%] mb-10 lg:mb-0 p-6 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-lg">
            {/* form content unchanged */}
          </div>

          {/* Right Column */}
          <div className="w-full lg:w-[70%] space-y-6">

            {/* D3 Heatmap */}
            <div className="p-6 rounded-xl bg-neutral-950 border border-neutral-800 shadow-lg">
              <h2 className="text-lg font-semibold mb-4 text-white">Exercise Frequency (2025)</h2>
              <svg ref={heatmapRef}></svg>
            </div>

            {/* Graph */}
            <div className="p-6 rounded-xl bg-neutral-950 border border-neutral-800 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-white">Daily Trends</h2>
              <div className="w-full h-80 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={processedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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

            {/* Table */}
            <div className="p-6 rounded-xl bg-neutral-950 border border-neutral-800 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-white">Logged Entries</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border border-neutral-800">
                  <thead className="text-neutral-400 uppercase bg-neutral-900 border-b border-neutral-800">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Sleep</th>
                      <th className="px-4 py-2">Work</th>
                      <th className="px-4 py-2">Meals</th>
                      <th className="px-4 py-2">Exercised</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedData.map((entry) => (
                      <tr key={entry.id} className="border-b border-neutral-800">
                        <td className="px-4 py-2 text-white">{entry.date}</td>
                        <td className="px-4 py-2 text-white">{entry.sleepHours?.toFixed(1)} hrs</td>
                        <td className="px-4 py-2 text-white">{entry.workHours?.toFixed(1)} hrs</td>
                        <td className="px-4 py-2 text-white">{entry.meals}</td>
                        <td className="px-4 py-2 text-white">{entry.exercised ? 'Yes' : 'No'}</td>
                        <td className="px-4 py-2">
                          <button onClick={() => handleDelete(entry.id)} className="text-red-500 border border-red-500 rounded-md px-3 py-1 text-sm hover:bg-red-500 hover:text-black transition">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
