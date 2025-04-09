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
    <div className="min-h-screen bg-[#0D0D0D] text-white px-6 py-10 font-sans">
      <h1 className="text-4xl font-bold mb-8 text-center">🧠 Stedly Dashboard</h1>

      {/* Log New Workout */}
      <div className="max-w-3xl mx-auto mb-10 p-6 bg-[#1A1A1A] rounded-2xl shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Log a New Workout</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['exercise', 'sets', 'reps', 'weight', 'restTime'].map((field) => (
            <input
              key={field}
              type={field === 'exercise' ? 'text' : 'number'}
              value={editData[field]}
              onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              className="bg-[#2A2A2A] text-white placeholder-gray-400 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
            />
          ))}
        </div>
        <button
          onClick={handleAddWorkout}
          className="mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-3 rounded-xl transition"
        >
          ➕ Add Workout
        </button>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="max-w-3xl mx-auto mb-10 p-6 bg-[#1A1A1A] rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Edit Workout</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['exercise', 'sets', 'reps', 'weight', 'restTime'].map((field) => (
              <input
                key={field}
                type={field === 'exercise' ? 'text' : 'number'}
                value={editData[field]}
                onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                className="bg-[#2A2A2A] text-white placeholder-gray-400 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            ))}
          </div>
          <button
            onClick={saveEdit}
            className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-xl transition"
          >
            💾 Save Changes
          </button>
        </div>
      )}

      {/* Workout Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {workouts.length === 0 ? (
          <p className="text-center text-gray-400">No workouts logged yet.</p>
        ) : (
          workouts.map((workout) => (
            <div key={workout.id} className="bg-[#1F1F1F] p-6 rounded-2xl shadow-lg border border-[#2A2A2A]">
              <h2 className="text-2xl font-semibold mb-2">{workout.exercise}</h2>
              <p>Sets: {workout.sets}</p>
              <p>Reps: {workout.reps}</p>
              <p>Weight: {workout.weight} kg</p>
              <p>Rest Time: {workout.restTime} sec</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(workout)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-xl"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(workout.id)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl"
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
