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
    <div className="min-h-screen bg-[#101010] text-white px-6 py-10 font-sans">
      <h1 className="text-4xl font-semibold mb-10 text-center tracking-tight">Stedly.app</h1>

      <div className="max-w-3xl mx-auto mb-12 p-6 rounded-3xl bg-[#1A1A1A] shadow-xl shadow-black/20 backdrop-blur">
        <h2 className="text-2xl mb-6 text-gray-200">Log a New Workout</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {['exercise', 'sets', 'reps', 'weight', 'restTime'].map((field) => (
            <input
              key={field}
              type={field === 'exercise' ? 'text' : 'number'}
              value={editData[field]}
              onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              className="bg-[#262626] text-white placeholder-gray-500 px-5 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0A84FF] transition"
            />
          ))}
        </div>
        <button
          onClick={handleAddWorkout}
          className="mt-6 w-full bg-[#0A84FF] hover:bg-[#0060DF] text-white font-medium py-3 rounded-2xl transition"
        >
          ➕ Add Workout
        </button>
      </div>

      {editing && (
        <div className="max-w-3xl mx-auto mb-12 p-6 rounded-3xl bg-[#1A1A1A] shadow-xl">
          <h2 className="text-xl mb-4">Edit Workout</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['exercise', 'sets', 'reps', 'weight', 'restTime'].map((field) => (
              <input
                key={field}
                type={field === 'exercise' ? 'text' : 'number'}
                value={editData[field]}
                onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                className="bg-[#262626] text-white placeholder-gray-500 px-5 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5AC8FA] transition"
              />
            ))}
          </div>
          <button
            onClick={saveEdit}
            className="mt-6 w-full bg-[#5AC8FA] hover:bg-[#3AAED8] text-black font-semibold py-3 rounded-2xl transition"
          >
            💾 Save Changes
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {workouts.length === 0 ? (
          <p className="text-center text-gray-500">No workouts logged yet.</p>
        ) : (
          workouts.map((workout) => (
            <div
              key={workout.id}
              className="bg-[#1C1C1E] p-6 rounded-3xl border border-[#2C2C2E] shadow-md hover:shadow-lg transition"
            >
              <h2 className="text-xl font-medium mb-2">{workout.exercise}</h2>
              <p className="text-gray-300">Sets: {workout.sets}</p>
              <p className="text-gray-300">Reps: {workout.reps}</p>
              <p className="text-gray-300">Weight: {workout.weight} kg</p>
              <p className="text-gray-300">Rest: {workout.restTime} sec</p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleEdit(workout)}
                  className="bg-[#FFD60A] text-black px-4 py-2 rounded-xl font-medium"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(workout.id)}
                  className="bg-[#FF453A] text-white px-4 py-2 rounded-xl font-medium"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
