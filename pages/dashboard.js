import { useState, useEffect } from 'react';
import { db, auth } from '../firebase/firebase'; // Your Firebase setup file
import { collection, getDocs, query, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';

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

  // Fetch workouts from Firestore
  useEffect(() => {
    const fetchWorkouts = async () => {
      const user = auth.currentUser;
      if (user) {
        console.log('User is authenticated:', user.uid); // Debugging line
        const q = query(collection(db, 'workouts'), where('userId', '==', user.uid));
        try {
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          console.log('Fetched workouts:', data); // Debugging line
          setWorkouts(data);
        } catch (error) {
          console.error('Error fetching workouts:', error);
        }
      } else {
        console.log('User is not authenticated'); // Debugging line
      }
    };
    fetchWorkouts();
  }, []);

  // Edit workout handler
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

  // Save edited workout
  const saveEdit = async () => {
    const workoutRef = doc(db, 'workouts', editing);
    try {
      await updateDoc(workoutRef, {
        exercise: editData.exercise,
        sets: editData.sets,
        reps: editData.reps,
        weight: editData.weight,
        restTime: editData.restTime,
      });
      setEditing(null);
      setEditData({
        exercise: '',
        sets: '',
        reps: '',
        weight: '',
        restTime: '',
      });
    } catch (error) {
      console.error('Error updating workout:', error);
    }
  };

  // Delete workout
  const handleDelete = async (id) => {
    const workoutRef = doc(db, 'workouts', id);
    try {
      await deleteDoc(workoutRef);
      setWorkouts(workouts.filter((workout) => workout.id !== id));
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-6">Your Workout Logs</h1>

      {/* Edit Form */}
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
          <button onClick={saveEdit} className="bg-blue-500 text-white px-6 py-3 rounded-full shadow hover:bg-blue-600">
            Save Changes
          </button>
        </div>
      )}

      {/* Display Workouts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {workouts.length === 0 ? (
          <p className="text-white">No workouts logged yet.</p>
        ) : (
          workouts.map((workout) => (
            <div key={workout.id} className="bg-gray-800 p-4 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold">{workout.exercise}</h2>
              <p>Sets: {workout.sets}</p>
              <p>Reps: {workout.reps}</p>
              <p>Weight: {workout.weight} kg</p>
              <p>Rest Time: {workout.restTime} sec</p>
              <button
                onClick={() => handleEdit(workout)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-full mt-4 mr-2"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(workout.id)}
                className="bg-red-500 text-white px-4 py-2 rounded-full mt-4"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
