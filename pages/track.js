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
    sleep: '',
    work: '',
    recovery: '',
    movement: '',
    exercise: ''
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
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date()
      });
      setDailyLog({ sleep: '', work: '', recovery: '', movement: '', exercise: '' });
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

      <div className="px-6 py-10 max-w-6xl mx-auto">
        {/* Daily Log Entry */}
        <div className="mb-12 p-6 rounded-xl bg-neutral-900 border border-neutral-800">
          <h2 className="text-xl mb-6 text-white">Log Your Day</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(dailyLog).map((key) => (
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
          </div>

          <button
            onClick={handleDailyLogSubmit}
            className="mt-6 w-full border border-white text-white hover:bg-white hover:text-black font-medium py-2 rounded-md transition"
          >
            Log Day
          </button>
        </div>

        {/* Insights and Log remain here (unchanged) */}
      </div>
    </div>
  );
};

export default Dashboard;
