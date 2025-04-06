import { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';

export default function Dashboard() {
  const [exercise, setExercise] = useState('');
  const [repetitions, setRepetitions] = useState('');
  const [weight, setWeight] = useState('');
  const [time, setTime] = useState('');
  const [workouts, setWorkouts] = useState([]);

  const workoutsRef = collection(db, 'workouts');

  const fetchWorkouts = async () => {
    const q = query(workoutsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setWorkouts(data);
  };

  const handleAddWorkout = async () => {
    if (!exercise || !repetitions || !weight || !time) return;
    await addDoc(workoutsRef, {
      exercise,
      repetitions,
      weight,
      time,
      createdAt: serverTimestamp(),
    });
    setExercise('');
    setRepetitions('');
    setWeight('');
    setTime('');
    fetchWorkouts();
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Dashboard</h1>
      <div className="max-w-md mx-auto bg-gray-800 p-4 rounded-xl shadow">
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-gray-700 text-white"
          placeholder="Exercise"
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
        />
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-gray-700 text-white"
          placeholder="Repetitions"
          value={repetitions}
          onChange={(e) => setRepetitions(e.target.value)}
        />
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-gray-700 text-white"
          placeholder="Weight (kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-gray-700 text-white"
          placeholder="Time (e.g. 45s, 1:30)"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <button
          onClick={handleAddWorkout}
          className="w-full bg-white text-gray-900 py-2 rounded hover:bg-gray-200 font-semibold"
        >
          Add Workout
        </button>
      </div>

      <div className="max-w-md mx-auto mt-6">
        <h2 className="text-xl font-semibold mb-3">Logged Workouts</h2>
        {workouts.length === 0 ? (
          <p className="text-gray-400">No workouts logged yet.</p>
        ) : (
          <ul className="space-y-3">
            {workouts.map((w) => (
              <li
                key={w.id}
                className="bg-gray-800 p-3 rounded-xl shadow border border-gray-700"
              >
                <div className="font-bold">{w.exercise}</div>
                <div>{w.repetitions} repetitions @ {w.weight} kg</div>
                <div>Time: {w.time}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
