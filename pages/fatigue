// Dashboard.jsx (Updated Form with Fatigue Tracking Fields)
import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';
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
    nutrition_score: '',
    training_volume: '',
    training_type: '',
    rpe: '',
    calories: '',
    protein_intake: '',
    hydration_liters: '',
    stress_level: '',
    financial_stress: '',
    social_interaction: null,
    screen_time: '',
    caffeine_mg: '',
    alcohol_drinks: ''
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
        fatigue_score: '', sleep_quality: '', nutrition_score: '', training_volume: '', training_type: '',
        rpe: '', calories: '', protein_intake: '', hydration_liters: '', stress_level: '', financial_stress: '',
        social_interaction: null, screen_time: '', caffeine_mg: '', alcohol_drinks: ''
      });
      fetchWorkouts(user.uid);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Submit failed.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans px-6 py-10 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Daily Fatigue Tracking</h1>
      <div className="space-y-6">
        {Object.entries({
          fatigue_score: 'Fatigue Score (1–10)',
          sleep_quality: 'Sleep Quality (1–10)',
          nutrition_score: 'Nutrition Quality (1–10)',
          training_volume: 'Training Volume (sets × reps × weight)',
          rpe: 'RPE (1–10)',
          calories: 'Calories',
          protein_intake: 'Protein Intake (g)',
          hydration_liters: 'Hydration (liters)',
          stress_level: 'Stress Level (1–10)',
          financial_stress: 'Financial Stress (1–10)',
          screen_time: 'Screen Time (mins)',
          caffeine_mg: 'Caffeine (mg)',
          alcohol_drinks: 'Alcoholic Drinks'
        }).map(([key, label]) => (
          <div key={key} className="flex flex-col">
            <label className="text-white mb-1">{label}</label>
            <input
              type="number"
              value={dailyLog[key]}
              onChange={(e) => setDailyLog({ ...dailyLog, [key]: e.target.value })}
              className="bg-black border border-neutral-700 text-white px-4 py-2 rounded-lg"
            />
          </div>
        ))}

        <div className="flex flex-col">
          <label className="text-white mb-1">Training Type</label>
          <select
            value={dailyLog.training_type}
            onChange={(e) => setDailyLog({ ...dailyLog, training_type: e.target.value })}
            className="bg-black border border-neutral-700 text-white px-4 py-2 rounded-lg"
          >
            <option value="">Select...</option>
            <option value="strength">Strength</option>
            <option value="cardio">Cardio</option>
            <option value="HIIT">HIIT</option>
            <option value="rest">Rest</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-white mb-1">Social Interaction (at least one meaningful)</label>
          <div className="flex space-x-4">
            <button
              onClick={() => setDailyLog({ ...dailyLog, social_interaction: 1 })}
              className={`px-6 py-2 rounded-lg border font-medium transition ${dailyLog.social_interaction === 1 ? 'bg-white text-black' : 'bg-black border-white text-white hover:bg-neutral-800'}`}
            >Yes</button>
            <button
              onClick={() => setDailyLog({ ...dailyLog, social_interaction: 0 })}
              className={`px-6 py-2 rounded-lg border font-medium transition ${dailyLog.social_interaction === 0 ? 'bg-white text-black' : 'bg-black border-white text-white hover:bg-neutral-800'}`}
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
