// Dashboard.jsx (Vercel Style UI)
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase/firebase';
import {
  collection, getDocs, query, where, doc, deleteDoc, updateDoc, addDoc
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
    exercised: false,
    fatigue_score: '',
    sleep_quality: '',
    calories: '',
    training_volume: '',
    training_type: '',
    rpe: '',
    stress_level: '',
    available_balance: '',
    social_interaction: null
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
      setDailyLog({
        date: new Date().toISOString().split('T')[0],
        sleepStart: '', sleepEnd: '', workStart: '', workEnd: '', meals: '', exercised: false,
        fatigue_score: '', sleep_quality: '', calories: '', training_volume: '', training_type: '',
        rpe: '', stress_level: '', available_balance: '', social_interaction: null
      });
      fetchWorkouts(user.uid);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Submit failed.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans px-4 py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold mb-8">Log Daily Fatigue</h1>
      <div className="space-y-5">
        {Object.entries({
          fatigue_score: 'Fatigue Score (1–10)',
          sleep_quality: 'Sleep Quality (1–10)',
          calories: 'Calories',
          training_volume: 'Training Volume (sets × reps × weight)',
          rpe: 'RPE (1–10)',
          stress_level: 'Stress Level (1–10)',
          available_balance: 'Available Balance (EUR/USD/etc.)'
        }).map(([key, label]) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-sm text-neutral-400">{label}</label>
            <input
              type="number"
              value={dailyLog[key]}
              onChange={(e) => setDailyLog({ ...dailyLog, [key]: e.target.value })}
              className="bg-neutral-900 border border-neutral-700 text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        ))}

        <div className="flex flex-col gap-1">
          <label className="text-sm text-neutral-400">Training Type</label>
          <select
            value={dailyLog.training_type}
            onChange={(e) => setDailyLog({ ...dailyLog, training_type: e.target.value })}
            className="bg-neutral-900 border border-neutral-700 text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select...</option>
            <option value="strength">Strength</option>
            <option value="cardio">Cardio</option>
            <option value="HIIT">HIIT</option>
            <option value="rest">Rest</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-neutral-400">Social Interaction</label>
          <div className="flex gap-3">
            <button
              onClick={() => setDailyLog({ ...dailyLog, social_interaction: 1 })}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${dailyLog.social_interaction === 1 ? 'bg-white text-black' : 'bg-neutral-900 border-white text-white hover:bg-neutral-800'}`}
            >Yes</button>
            <button
              onClick={() => setDailyLog({ ...dailyLog, social_interaction: 0 })}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${dailyLog.social_interaction === 0 ? 'bg-white text-black' : 'bg-neutral-900 border-white text-white hover:bg-neutral-800'}`}
            >No</button>
          </div>
        </div>

        <button
          onClick={handleDailyLogSubmit}
          className="w-full bg-green-600 text-white px-6 py-3 rounded-xl font-semibold border border-green-700 hover:bg-green-700 transition"
        >Submit</button>
      </div>
    </div>
  );
};

export default Dashboard;
