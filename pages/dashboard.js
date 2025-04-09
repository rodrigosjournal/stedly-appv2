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

  // Protect route + fetch data
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
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-6">Your Workout Logs</h1>

      {/* Add New Workout */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Log a New Workout</h2>
        <input
          type="text"
          value={editData.exercise}
          onChange={(e) => setEditData({ ...editData, exercise: e.target.value })}
          placeholder="Exercise"
          className="mb-4 px-4 py-2 rounded-full w-full"
        />
        <input
          type="number"
          value={editData.sets}
          onChange={(e) => setEditData({ ...editData, sets: e.target.value })}
          placeholder="Sets"
          className="mb-4 px-4 py-2 rounded-full w-full"
        />
        <input
          type="number"
          value={editData.reps}
          onChange={(e) => setEditData({ ...editData, reps: e.target.value })}
          placeholder="Reps"
          className="mb-4 px-4 py-2 rounded-full w-full"
        />
        <input
          type="number"
          value={editData.weight}
          onChange={(e) => setEditData({ ...editData, weight: e.target.value })}
          placeholder="Weight"
          className="mb-4 px-4 py-2 rounded-full w-full"
        />
        <input
          type="number"
          value={editData.restTime}
          onChange={(e) => setEditData({ ...editData, restTime: e.target.value })}
          placeholder="Rest Time (sec)"
          className="mb-4 px-4 py-2 rounded-full w-full"
        />
        <button
          onClick={handleAddWorkout}
          className="bg-green-500 text-white px-6 py-3 rounded-full shadow hover:bg-green-600"
        >
          Add Workout
        </button>
      </div>

      {/* Edit Workout */}
      {editing && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Edit Workout</h2>
          <input
            type="text"
            value={editData.exercise}
            onChange={(e) => setEditData({ ...editData, exercise: e.target.value })}
            placeholder="Exercise"
            className="mb-4 px-4 py-2 rounded-full w-full"
          />
          <input
            type="number"
            value={editData.sets}
            onChange={(e) => setEditData({ ...editData, sets: e.target.value })}
            placeholder="Sets"
            className="mb-4 px-4 py-2 rounded-full w-full"
          />
          <input
            type="number"
            value={editData.reps}
            onChange={(e) => setEditData({ ...editData, reps: e.target.value })}
            placeholder="Reps"
            className="mb-4 px-4 py-2 rounded-full w-full"
          />
          <input
            type="number"
            value={editData.weight}
            onChange={(e) => setEditData({ ...editData, weight: e.target.value })}
            placeholder="Weight"
            className="mb-4 px-4 py-2 rounded-full w-full"
          />
          <input
            type="number"
            value={editData.restTime}
            onChange={(e) => setEditData({ ...editData, restTime: e.target.value })}
            placeholder="Rest Time (sec)"
            className="mb-4 px-4 py-2 rounded-full w-full"
          />
          <button
            onClick={saveEdit}
            className="bg-blue-500 text-white px-6 py-3 rounded-full shadow hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Workout Logs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {workouts.length === 0 ? (
          <p>No workouts logged yet.</p>
        ) : (
          workouts.map((workout) => (
            <div key={workout.id} className="bg-gray-800 p-4 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold">{workout.exercise}</h2>
              <p>Sets: {workout.sets}</p>
              <p>Reps: {workout.reps}</p>
              <p>Weight: {workout.weight} kg</p>
              <p>Rest Time: {workout.restTime} sec</p>
              <div className="mt-4">
                <button
                  onClick={() => handleEdit(workout)}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-full mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(workout.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-full"
                >
                  Delete
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
