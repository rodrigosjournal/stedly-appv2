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
  const [lastWorkout, setLastWorkout] = useState(null);
  const [showToast, setShowToast] = useState(false);

  const workoutsRef = collection(db, 'workouts');

  const fetchWorkouts = async () => {
    const q = query(workoutsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setWorkouts(data);
    if (data.length > 0) setLastWorkout(data[0]);
  };

  const handleAddWorkout = async () => {
    if (!exercise || !sets || !repetitions || !weight || !workoutDuration || !restTime) return;
    const newWorkout = {
      exercise,
      sets,
      repetitions,
      weight,
      workoutDuration,
      restTime,
      note,
      rpe,
      createdAt: serverTimestamp(),
    };
    await addDoc(workoutsRef, newWorkout);
    setExercise('');
    setSets('');
    setRepetitions('');
    setWeight('');
    setWorkoutDuration('');
    setRestTime('');
    setNote('');
    setRpe('');
    setLastWorkout({ ...newWorkout });
    fetchWorkouts();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Activity Tracker</h1>

      {lastWorkout && (
        <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-gray-900 border-l-4 border-green-500 shadow">
          <div className="text-sm uppercase text-gray-400 mb-1">🕓 Last Logged Workout</div>
          <div className="font-bold text-white">{lastWorkout.exercise}</div>
          <div>{lastWorkout.sets} sets × {lastWorkout.repetitions} reps @ {lastWorkout.weight} kg</div>
          {lastWorkout.rpe && <div>RPE: {lastWorkout.rpe}</div>}
          {lastWorkout.note && <div className="italic text-gray-300">Note: {lastWorkout.note}</div>}
        </div>
      )}

      <div className="w-full bg-gray-900 p-4 rounded-xl shadow">
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-400"
          placeholder="Exercise"
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
        />
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-400"
          placeholder="Sets"
          value={sets}
          onChange={(e) => setSets(e.target.value)}
        />
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-400"
          placeholder="Repetitions"
          value={repetitions}
          onChange={(e) => setRepetitions(e.target.value)}
        />
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-400"
          placeholder="Weight (kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-400"
          placeholder="Workout Duration (min)"
          value={workoutDuration}
          onChange={(e) => setWorkoutDuration(e.target.value)}
        />
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-400"
          placeholder="Rest Time (e.g. 60s, 90s)"
          value={restTime}
          onChange={(e) => setRestTime(e.target.value)}
        />
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-400"
          placeholder="RPE (1-10, optional)"
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
        />
        <textarea
          className="w-full mb-3 px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-400"
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

      <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <h2 className="text-xl font-semibold mb-3 lg:col-span-2">Logged Workouts</h2>
        {workouts.length === 0 ? (
          <p className="text-gray-400">No workouts logged yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workouts.map((w) => (
              <div
                key={w.id}
                className="bg-gray-900 p-3 rounded-xl shadow border border-gray-800"
              >
                <div className="font-bold text-white">{w.exercise}</div>
                <div>{w.sets} sets, {w.repetitions} repetitions @ {w.weight} kg</div>
                <div className="text-gray-300">Workout Duration: {w.workoutDuration} min</div>
                <div className="text-gray-300">Rest Time: {w.restTime}</div>
                {w.rpe && <div className="text-gray-400">RPE: {w.rpe}</div>}
                {w.note && <div className="italic text-gray-400 mt-1">Note: {w.note}</div>}
                {w.createdAt && (
                  <div className="text-sm text-gray-500 mt-1">
                    Logged on: {new Date(w.createdAt.seconds * 1000).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
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
