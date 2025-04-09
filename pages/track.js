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
  const [editing, setEditing] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('exercise');
  const [editData, setEditData] = useState({
    value: ''
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

  const handleAddWorkout = async () => {
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, 'workouts'), {
        category: selectedCategory,
        value: editData.value,
        userId: user.uid,
        timestamp: new Date()
      });
      setEditData({ value: '' });
      fetchWorkouts(user.uid);
    } catch (err) {
      console.error('Failed to add entry:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'workouts', id));
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const categories = ['sleep', 'work', 'recovery', 'movement', 'exercise'];

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
        {/* Log Entry */}
        <div className="mb-12 p-6 rounded-xl bg-neutral-900 border border-neutral-800">
          <h2 className="text-xl mb-6 text-white">Log a New Entry</h2>

          <div className="flex flex-wrap gap-3 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-md border transition text-sm ${
                  selectedCategory === category
                    ? 'bg-white text-black border-white'
                    : 'border-white text-white hover:bg-white hover:text-black'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          <input
            type="number"
            value={editData.value}
            onChange={(e) => setEditData({ value: e.target.value })}
            placeholder={`Enter value for ${selectedCategory}`}
            className="w-full bg-black border border-neutral-700 text-white placeholder-neutral-500 px-4 py-2 rounded-md focus:outline-none focus:border-white"
          />

          <button
            onClick={handleAddWorkout}
            className="mt-6 w-full border border-white text-white hover:bg-white hover:text-black font-medium py-2 rounded-md transition"
          >
            Add Entry
          </button>
        </div>

        {/* Insights and Log remain here (unchanged) */}
      </div>
    </div>
  );
};

export default Dashboard;
