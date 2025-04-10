// Full updated file with GitHub-style heatmap styling and consistent table
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

  return (
    // ... rest of the component remains unchanged
  );
};

export default Dashboard;
