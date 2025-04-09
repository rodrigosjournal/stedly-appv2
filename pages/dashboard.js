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
  const [editData, setEditData] = useState({
    exercise: '',
    sets: '',
    reps: '',
    weight: '',
    restTime: '',
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
        ...editData,
        userId: user.uid
      });
      setEditData({
        exercise: '',
        sets: '',
        reps: '',
        weight: '',
        restTime: '',
      });
      fetchWorkouts(user.uid);
    } catch (err) {
      console.error('Failed to add workout:', err);
    }
  };

  const handleEdit = (workout) => {
    setEditing(workout.id);
    setEditData({
      exercise: workout.exercise,
      sets: workout.sets,
      reps: workout.reps,
      weight: workout.weight,
      restTime: workout.restTime,
    });
  };

  const saveEdit = async () => {
    const workoutRef = doc(db, 'workouts', editing);
    try {
      await updateDoc(workoutRef, {
        ...editData
      });
      setEditing(null);
      setEditData({
        exercise: '',
        sets: '',
        reps: '',
        weight: '',
        restTime: '',
      });
      const user = auth.currentUser;
      fetchWorkouts(user.uid);
    } catch (error) {
      console.error('Error updating workout:', error);
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

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Navigation Bar */}
      <nav className="bg-black border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-semibold tracking-tight">Staedly.app</span>
        <div className="space-x-6">
          <button className="text-white hover:text-neutral-400 transition">Dashboard</button>
          <button className="text-white hover:text-neutral-400 transition">Workouts</button>
          <button className="text-white hover:text-neutral-400 transition">Settings</button>
        </div>
      </nav>

      <div className="px-6 py-10">
        <div className="max-w-3xl mx-auto mb-12 p-6 rounded-xl bg-neutral-900 border border-neutral-800">
          <h2 className="text-xl mb-6 text-white">Log a New Workout</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['exercise', 'sets', 'reps', 'weight', 'restTime'].map((field) => (
              <input
                key={field}
                type={field === 'exercise' ? 'text' : 'number'}
                value={editData[field]}
                onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                className="bg-black border border-neutral-700 text-white placeholder-neutral-500 px-4 py-2 rounded-md focus:outline-none focus:border-white"
              />
            ))}
          </div>
          <button
            onClick={handleAddWorkout}
            className="mt-6 w-full border border-white text-white hover:bg-white hover:text-black font-medium py-2 rounded-md transition"
          >
            Add Workout
          </button>
        </div>

        {editing && (
          <div className="max-w-3xl mx-auto mb-12 p-6 rounded-xl bg-neutral-900 border border-neutral-800">
            <h2 className="text-xl mb-4">Edit Workout</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['exercise', 'sets', 'reps', 'weight', 'restTime'].map((field) => (
                <input
                  key={field}
                  type={field === 'exercise' ? 'text' : 'number'}
                  value={editData[field]}
                  onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  className="bg-black border border-neutral-700 text-white placeholder-neutral-500 px-4 py-2 rounded-md focus:outline-none focus:border-white"
                />
              ))}
            </div>
            <button
              onClick={saveEdit}
              className="mt-6 w-full border border-white text-white hover:bg-white hover:text-black font-medium py-2 rounded-md transition"
            >
              Save Changes
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {workouts.length === 0 ? (
            <p className="text-center text-neutral-500">No workouts logged yet.</p>
          ) : (
            workouts.map((workout) => (
              <div
                key={workout.id}
                className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 hover:border-white transition"
              >
                <h2 className="text-lg font-medium mb-2">{workout.exercise}</h2>
                <p className="text-neutral-300">Sets: {workout.sets}</p>
                <p className="text-neutral-300">Reps: {workout.reps}</p>
                <p className="text-neutral-300">Weight: {workout.weight} kg</p>
                <p className="text-neutral-300">Rest: {workout.restTime} sec</p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleEdit(workout)}
                    className="border border-white text-white hover:bg-white hover:text-black px-4 py-2 rounded-md transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(workout.id)}
                    className="border border-white text-white hover:bg-white hover:text-black px-4 py-2 rounded-md transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
