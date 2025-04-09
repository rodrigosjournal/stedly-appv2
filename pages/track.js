import { useEffect, useState } from 'react';
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
  const [workouts, setWorkouts] = useState([]);
  const [dailyLog, setDailyLog] = useState({
    date: new Date().toISOString().split('T')[0],
    sleep: '',
    work: '',
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
      await addDoc(collection(db, 'workouts'), {
        ...dailyLog,
        userId: user.uid,
        timestamp: new Date()
      });
      setDailyLog({
        date: new Date().toISOString().split('T')[0],
        sleep: '',
        work: '',
        meals: '',
        exercised: false
      });
      fetchWorkouts(user.uid);
    } catch (err) {
      console.error('Failed to submit daily log:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Navigation Bar */}
      <nav className="bg-black border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-semibold tracking-tight">Stedly.app</span>
        <div className="space-x-6">
          <button className="text-white hover:text-neutral-400 transition">Dashboard</button>
          <button className="text-white hover:text-neutral-400 transition">Workouts</button>
          <button className="text-white hover:text-neutral-400 transition">Settings</button>
        </div>
      </nav>

      <div className="px-6 py-10 w-full max-w-7xl mx-auto">
        {/* Daily Log Entry */}
        <div className="mb-12 p-6 rounded-xl bg-neutral-900 border border-neutral-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-black border border-neutral-700 rounded-md">
              <label className="block text-sm text-neutral-400 mb-2">Date</label>
              <input
                type="date"
                value={dailyLog.date}
                onChange={(e) => setDailyLog({ ...dailyLog, date: e.target.value })}
                className="w-full bg-black border border-neutral-700 text-white px-4 py-2 rounded-md focus:outline-none focus:border-white"
              />
            </div>

            {['sleep', 'work', 'meals'].map((key) => (
              <div key={key} className="p-4 bg-black border border-neutral-700 rounded-md">
                <label className="block text-sm text-neutral-400 mb-2 capitalize">{key}</label>
                <input
                  type="number"
                  value={dailyLog[key]}
                  onChange={(e) => setDailyLog({ ...dailyLog, [key]: e.target.value })}
                  placeholder={`Enter ${key}`}
                  className="w-full bg-black border border-neutral-700 text-white placeholder-neutral-500 px-4 py-2 rounded-md focus:outline-none focus:border-white"
                />
              </div>
            ))}

            <div className="p-4 bg-black border border-neutral-700 rounded-md">
              <label className="block text-sm text-neutral-400 mb-2">Did you exercise today?</label>
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="exercised"
                    checked={dailyLog.exercised === true}
                    onChange={() => setDailyLog({ ...dailyLog, exercised: true })}
                    className="form-radio text-white bg-black border-white"
                  />
                  <span className="ml-2">1</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="exercised"
                    checked={dailyLog.exercised === false}
                    onChange={() => setDailyLog({ ...dailyLog, exercised: false })}
                    className="form-radio text-white bg-black border-white"
                  />
                  <span className="ml-2">0</span>
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={handleDailyLogSubmit}
            className="mt-6 w-full border border-white text-white hover:bg-white hover:text-black font-medium py-2 rounded-md transition"
          >
            Log Day
          </button>
        </div>

        {/* Table of logged entries */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-neutral-800">
            <thead className="text-neutral-400 uppercase bg-neutral-900 border-b border-neutral-800">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Sleep</th>
                <th className="px-4 py-2">Work</th>
                <th className="px-4 py-2">Meals</th>
                <th className="px-4 py-2">Exercised</th>
              </tr>
            </thead>
            <tbody>
              {workouts.map((entry) => (
                <tr key={entry.id} className="border-b border-neutral-800">
                  <td className="px-4 py-2 text-white">{entry.date}</td>
                  <td className="px-4 py-2 text-white">{entry.sleep}</td>
                  <td className="px-4 py-2 text-white">{entry.work}</td>
                  <td className="px-4 py-2 text-white">{entry.meals}</td>
                  <td className="px-4 py-2 text-white">{entry.exercised ? 1 : 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
