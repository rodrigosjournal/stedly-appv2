// pages/dashboard.js
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
  const [sets, setSets] = useState('');
  const [repetitions, setRepetitions] = useState('');
  const [weight, setWeight] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [restTime, setRestTime] = useState('');
  const [note, setNote] = useState('');
  const [rpe, setRpe] = useState('');
  const [workouts, setWorkouts] = useState([]);
  const [showToast, setShowToast] = useState(false);

  const workoutsRef = collection(db, 'workouts');

  const fetchWorkouts = async () => {
    const q = query(workoutsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setWorkouts(data);
  };

  const handleAddWorkout = async () => {
    if (!exercise || !sets || !repetitions || !weight || !workoutDuration || !restTime) return;
    await addDoc(workoutsRef, {
      exercise,
      sets,
      repetitions,
      weight,
      workoutDuration,
      restTime,
      note,
      rpe,
      createdAt: serverTimestamp(),
    });
    setExercise('');
    setSets('');
    setRepetitions('');
    setWeight('');
    setWorkoutDuration('');
    setRestTime('');
    setNote('');
    setRpe('');
    fetchWorkouts();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
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
          placeholder="Sets"
          value={sets}
          onChange={(e) => setSets(e.target.value)}
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
          placeholder="Workout Duration (min)"
          value={workoutDuration}
          onChange={(e) => setWorkoutDuration(e.target.value)}
        />
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-gray-700 text-white"
          placeholder="Rest Time (e.g. 60s, 90s)"
          value={restTime}
          onChange={(e) => setRestTime(e.target.value)}
        />
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-gray-700 text-white"
          placeholder="RPE (1-10, optional)"
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
        />
        <textarea
          className="w-full mb-3 px-3 py-2 rounded bg-gray-700 text-white"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
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
                <div>{w.sets} sets, {w.repetitions} repetitions @ {w.weight} kg</div>
                <div>Workout Duration: {w.workoutDuration} min</div>
                <div>Rest Time: {w.restTime}</div>
                {w.rpe && <div className="text-gray-300">RPE: {w.rpe}</div>}
                {w.note && <div className="italic text-gray-300 mt-1">Note: {w.note}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-lg z-50">
          ✅ Workout saved!
        </div>
      )}
    </div>
  );
}
