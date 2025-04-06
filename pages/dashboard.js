// pages/dashboard.js
import { useState } from 'react';

export default function Dashboard() {
  const [exercise, setExercise] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [workouts, setWorkouts] = useState([]);

  const handleAddWorkout = () => {
    if (!exercise || !reps || !weight) return;
    const newWorkout = {
      exercise,
      reps,
      weight,
      date: new Date().toLocaleString(),
    };
    setWorkouts([newWorkout, ...workouts]);
    setExercise('');
    setReps('');
    setWeight('');
  };

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
          placeholder="Reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
        />
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-gray-700 text-white"
          placeholder="Weight (kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
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
            {workouts.map((w, i) => (
              <li
                key={i}
                className="bg-gray-800 p-3 rounded-xl shadow border border-gray-700"
              >
                <div className="font-bold">{w.exercise}</div>
                <div>{w.reps} reps @ {w.weight} kg</div>
                <div className="text-sm text-gray-400">{w.date}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
