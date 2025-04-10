import { useEffect, useState, useMemo } from 'react'; // Added useMemo
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
// Removed XLSX import as it wasn't used for export in the provided code
// import * as XLSX from 'xlsx';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase/firebase'; // Ensure this path is correct
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  orderBy // Import orderBy for sorting
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// REMINDER: Consider renaming the Firestore collection from 'workouts' to something more descriptive like 'dailyLogs' or 'trackingEntries' if it stores more than just workout info.

const Dashboard = () => {
  const [editId, setEditId] = useState(null); // ID of the entry being edited
  const [entries, setEntries] = useState([]); // Renamed from 'workouts' for clarity
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [dailyLog, setDailyLog] = useState({ // State for the input form
    date: new Date().toISOString().split('T')[0],
    sleepStart: '',
    sleepEnd: '',
    workStart: '',
    workEnd: '',
    meals: '',
    exercised: false // Default value
  });

  const router = useRouter();

  // Initial auth check and data fetch
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchEntries(user.uid); // Fetch user's data
        setIsLoading(false);
      } else {
        router.push('/'); // Redirect to login if not authenticated
        // No need to setIsLoading(false) here as component will unmount/redirect
      }
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [router]); // Rerun effect if router changes (shouldn't typically happen)

  // Fetch entries from Firestore for the logged-in user
  const fetchEntries = async (uid) => {
    // setIsLoading(true); // Optional: set loading true if called manually elsewhere
    try {
      // Query the 'workouts' collection, filter by userId, and order by date descending
      const q = query(
          collection(db, 'workouts'), // *** Your collection name ***
          where('userId', '==', uid),
          orderBy('date', 'desc') // Order by date, newest first
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setEntries(data);
    } catch (error) {
        console.error("Error fetching entries:", error);
        alert("Could not fetch your data. Please try refreshing the page.");
    } finally {
        // setIsLoading(false); // Set loading false if set true at the start
    }
  };

  // --- Helper Function for Duration Calculation (Handles Overnight) ---
  const calculateDuration = (startStr, endStr) => {
    if (!startStr || !endStr) return 0; // Return 0 if start or end is missing

    try {
        // Use a fixed date prefix to handle time comparison correctly
        let startDate = new Date(`1970-01-01T${startStr}:00Z`); // Assume UTC or consistently handle timezones if needed
        let endDate = new Date(`1970-01-01T${endStr}:00Z`);

        // If end time is earlier than start time, assume it wraps to the next day
        if (endDate < startDate) {
            endDate.setDate(endDate.getDate() + 1); // Add 24 hours
        }

        const durationMs = endDate - startDate;
        const durationHours = durationMs / (1000 * 60 * 60);

        // Basic sanity check - duration shouldn't be negative or excessively long (e.g., > 24h for sleep/work)
         if (durationHours < 0) return 0; // Should not happen with the logic above, but as a safeguard
         // if (durationHours > 24) return 24; // Optional: Cap duration if needed

        return durationHours;
    } catch (e) {
        console.error("Error calculating duration for:", startStr, endStr, e);
        return 0; // Return 0 on error
    }
  };

  // --- Handle Form Submission (Add or Update) ---
  const handleDailyLogSubmit = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in.');

      // Basic Validation
      if (!dailyLog.date || !dailyLog.meals || dailyLog.meals < 0) {
        throw new Error("Valid Date and non-negative Meals count are required.");
      }
       // Add more specific validation for time formats if necessary

      const dataToSave = {
        ...dailyLog,
        userId: user.uid,
        meals: Number(dailyLog.meals) || 0, // Ensure meals is stored as a number
        // Ensure boolean is stored correctly
        exercised: Boolean(dailyLog.exercised),
      };

      if (editId) {
        // Update existing entry
        const docRef = doc(db, 'workouts', editId); // *** Your collection name ***
        await updateDoc(docRef, dataToSave);
        alert('Entry updated successfully!');
      } else {
        // Add new entry - Check for duplicates first
        const q = query(
          collection(db, 'workouts'), // *** Your collection name ***
          where('userId', '==', user.uid),
          where('date', '==', dailyLog.date)
        );
        const existingSnapshot = await getDocs(q);
        if (!existingSnapshot.empty) {
          throw new Error(`An entry for ${dailyLog.date} already exists. Please edit the existing entry or choose a different date.`);
        }
        await addDoc(collection(db, 'workouts'), dataToSave); // *** Your collection name ***
        alert('Entry submitted successfully!');
      }

      // Reset form and edit state, then refetch data
      setDailyLog({
        date: new Date().toISOString().split('T')[0],
        sleepStart: '', sleepEnd: '', workStart: '', workEnd: '', meals: '', exercised: false
      });
      setEditId(null);
      await fetchEntries(user.uid); // Refetch to show the latest data/order

    } catch (err) {
      console.error('Failed to submit daily log:', err);
      alert(`Submission failed: ${err.message}`); // Show specific error to user
    } finally {
      setIsLoading(false); // Ensure loading is set to false
    }
  };

  // --- Handle Deleting an Entry ---
  const handleDelete = async (id, entryDate) => {
    // Ask for confirmation
    if (window.confirm(`Are you sure you want to delete the entry for ${entryDate}?`)) {
      setIsLoading(true);
      try {
        const docRef = doc(db, 'workouts', id); // *** Your collection name ***
        await deleteDoc(docRef);
        // Update state locally *after* successful delete for immediate UI feedback
        setEntries(currentEntries => currentEntries.filter((entry) => entry.id !== id));
        alert('Entry deleted.');
        // If deleting the entry currently being edited, reset the form
        if (id === editId) {
             setEditId(null);
             setDailyLog({ date: new Date().toISOString().split('T')[0], sleepStart: '', sleepEnd: '', workStart: '', workEnd: '', meals: '', exercised: false });
        }
      } catch (err) {
        console.error("Failed to delete entry:", err);
        alert('Failed to delete entry. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // --- Handle Setting Up Edit Mode ---
  const handleEdit = (entry) => {
    setEditId(entry.id);
    // Populate form state with the selected entry's data
    setDailyLog({
      date: entry.date || '', // Use stored date
      sleepStart: entry.sleepStart || '',
      sleepEnd: entry.sleepEnd || '',
      workStart: entry.workStart || '',
      workEnd: entry.workEnd || '',
      meals: entry.meals !== undefined ? String(entry.meals) : '', // Convert number to string for input field
      exercised: entry.exercised !== undefined ? entry.exercised : false,
    });
    // Scroll to the top to bring the form into view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Memoized Processed Data for Table and Chart ---
  const processedData = useMemo(() => {
    // Map entries to include calculated durations and default values for display
    return entries.map((entry) => {
      const sleepHours = calculateDuration(entry.sleepStart, entry.sleepEnd);
      const workHours = calculateDuration(entry.workStart, entry.workEnd);
      return {
        id: entry.id,
        date: entry.date,
        sleepStart: entry.sleepStart || '--',
        sleepEnd: entry.sleepEnd || '--',
        sleepHours: sleepHours, // Keep as number for charts
        workStart: entry.workStart || '--',
        workEnd: entry.workEnd || '--',
        workHours: workHours, // Keep as number for charts
        meals: entry.meals !== undefined ? entry.meals : 0, // Keep as number for charts
        exercised: entry.exercised !== undefined ? entry.exercised : false,
      };
    });
  }, [entries]); // Recalculate only when the 'entries' array changes

  // --- JSX Rendering ---
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <nav className="bg-black border-b border-neutral-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <span className="text-xl font-semibold tracking-tight">Steadly.app</span>
        {/* Add logout button or user info here if needed */}
      </nav>

      <div className="px-6 py-10 w-full max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:gap-8"> {/* Increased gap */}

          {/* --- Input Form (Left Column - Sticky) --- */}
          <div className="w-full lg:w-[35%] xl:w-[30%] mb-10 lg:mb-0 p-8 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-lg lg:sticky lg:top-24 self-start"> {/* Adjusted width and sticky position */}
            <h2 className="text-2xl font-semibold mb-6 text-white">{editId ? 'Edit Entry' : 'Add Daily Log'}</h2>
            <div className="space-y-5"> {/* Adjusted spacing */}
              {/* Date Input */}
              <div className="flex flex-col">
                <label htmlFor="log-date" className="text-neutral-300 text-sm mb-1">Date</label>
                <input id="log-date" type="date" value={dailyLog.date} onChange={(e) => setDailyLog({ ...dailyLog, date: e.target.value })} className="bg-neutral-900 border border-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Sleep Times */}
              <div className="flex flex-col sm:flex-row sm:space-x-4">
                <div className="flex-1 flex flex-col mb-4 sm:mb-0">
                  <label htmlFor="sleep-start" className="text-neutral-300 text-sm mb-1">Sleep Start</label>
                  <input id="sleep-start" type="time" value={dailyLog.sleepStart} onChange={(e) => setDailyLog({ ...dailyLog, sleepStart: e.target.value })} className="bg-neutral-900 border border-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex-1 flex flex-col">
                  <label htmlFor="sleep-end" className="text-neutral-300 text-sm mb-1">Sleep End</label>
                  <input id="sleep-end" type="time" value={dailyLog.sleepEnd} onChange={(e) => setDailyLog({ ...dailyLog, sleepEnd: e.target.value })} className="bg-neutral-900 border border-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Work Times */}
              <div className="flex flex-col sm:flex-row sm:space-x-4">
                <div className="flex-1 flex flex-col mb-4 sm:mb-0">
                  <label htmlFor="work-start" className="text-neutral-300 text-sm mb-1">Work Start</label>
                  <input id="work-start" type="time" value={dailyLog.workStart} onChange={(e) => setDailyLog({ ...dailyLog, workStart: e.target.value })} className="bg-neutral-900 border border-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex-1 flex flex-col">
                  <label htmlFor="work-end" className="text-neutral-300 text-sm mb-1">Work End</label>
                  <input id="work-end" type="time" value={dailyLog.workEnd} onChange={(e) => setDailyLog({ ...dailyLog, workEnd: e.target.value })} className="bg-neutral-900 border border-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Meals Input */}
              <div className="flex flex-col">
                <label htmlFor="meals-count" className="text-neutral-300 text-sm mb-1">Meals Count</label>
                <input id="meals-count" type="number" min="0" placeholder="e.g., 3" value={dailyLog.meals} onChange={(e) => setDailyLog({ ...dailyLog, meals: e.target.value })} className="bg-neutral-900 border border-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Exercised Toggle */}
              <div className="flex flex-col">
                <label className="text-neutral-300 text-sm mb-2">Exercised Today?</label>
                <div className="flex space-x-3">
                  <button onClick={() => setDailyLog({ ...dailyLog, exercised: true })} className={`flex-1 px-4 py-2 rounded-lg border font-medium transition ${dailyLog.exercised ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'}`}>Yes</button>
                  <button onClick={() => setDailyLog({ ...dailyLog, exercised: false })} className={`flex-1 px-4 py-2 rounded-lg border font-medium transition ${!dailyLog.exercised ? 'bg-rose-600 text-white border-rose-600' : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'}`}>No</button>
                </div>
              </div>

              {/* Submit/Update Button */}
              <div className="pt-2">
                <button
                  onClick={handleDailyLogSubmit}
                  disabled={isLoading}
                  className={`w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold border border-blue-700 hover:bg-blue-700 transition ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Processing...' : (editId ? 'Update Entry' : 'Submit Log')}
                </button>
                {/* Cancel Edit Button */}
                {editId && (
                  <button
                    onClick={() => { setEditId(null); setDailyLog({ date: new Date().toISOString().split('T')[0], sleepStart: '', sleepEnd: '', workStart: '', workEnd: '', meals: '', exercised: false }); }}
                    disabled={isLoading}
                    className="w-full mt-3 bg-neutral-700 text-neutral-300 px-6 py-2 rounded-xl font-semibold border border-neutral-600 hover:bg-neutral-600 transition"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div> {/* End Form Fields Space */}
          </div> {/* End Form Div */}


          {/* --- Right Column (Graph and Table) --- */}
          <div className="w-full lg:w-[65%] xl:w-[70%] space-y-10"> {/* Adjusted width and spacing */}

            {/* --- Graph Section --- */}
            <div className="p-6 rounded-xl bg-neutral-950 border border-neutral-800 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-white">Daily Trends</h2>
              {isLoading && entries.length === 0 && <p className="text-neutral-400 text-center py-10">Loading chart data...</p>}
              {!isLoading && entries.length === 0 && <p className="text-neutral-500 text-center py-10">Log some data to see the trends chart.</p>}
              {entries.length > 0 && (
                // Ensure chart has enough vertical space
                <div className="w-full h-80 md:h-96"> {/* Responsive height */}
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={processedData.slice().reverse()} // Reverse data for chronological chart X-axis
                        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}> {/* Adjust margins */}
                      <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="#9CA3AF" tickLine={false} axisLine={{ stroke: "#4B5563" }} tick={{ fontSize: 10 }} />
                      <YAxis stroke="#9CA3AF" tickLine={false} axisLine={{ stroke: "#4B5563" }} tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '6px', color: '#E5E7EB' }}
                        labelStyle={{ color: '#D1D5DB', fontWeight: 'bold' }}
                        itemStyle={{ fontSize: '12px' }}
                        formatter={(value, name) => [`${typeof value === 'number' ? value.toFixed(1) : value}`, name]} // Format numbers
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }} />
                      <Line type="monotone" dataKey="sleepHours" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Sleep (hrs)" />
                      <Line type="monotone" dataKey="workHours" stroke="#10B981" strokeWidth={2} dot={false} name="Work (hrs)" />
                      <Line type="monotone" dataKey="meals" stroke="#F59E0B" strokeWidth={2} dot={false} name="Meals (count)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div> {/* End Graph Div */}


            {/* --- Table Section --- */}
            <div className="p-6 rounded-xl bg-neutral-950 border border-neutral-800 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-white">Logged Entries</h2>
              {isLoading && entries.length === 0 && <p className="text-neutral-400 text-center py-10">Loading entries...</p>}
              {!isLoading && entries.length === 0 && <p className="text-neutral-500 text-center py-10">No entries logged yet.</p>}
              {entries.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-neutral-400 uppercase bg-neutral-900 border-b border-neutral-700">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Sleep</th>
                        <th className="px-4 py-3">Work</th>
                        <th className="px-4 py-3 text-center">Meals</th>
                        <th className="px-4 py-3 text-center">Exercised</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-neutral-200">
                      {/* Use processedData which is already calculated and memoized */}
                      {processedData.map((entry) => (
                        <tr key={entry.id} className={`border-b border-neutral-800 ${entry.id === editId ? 'bg-blue-900/30' : 'hover:bg-neutral-800/50'}`}> {/* Highlight row being edited */}
                          <td className="px-4 py-2 whitespace-nowrap">{entry.date}</td>
                          <td className="px-4 py-2">
                              <span className="block text-xs text-neutral-400">{entry.sleepStart} - {entry.sleepEnd}</span>
                              {entry.sleepHours > 0 && <span className="font-medium">{entry.sleepHours.toFixed(1)} hrs</span>}
                          </td>
                          <td className="px-4 py-2">
                              <span className="block text-xs text-neutral-400">{entry.workStart} - {entry.workEnd}</span>
                              {entry.workHours > 0 && <span className="font-medium">{entry.workHours.toFixed(1)} hrs</span>}
                          </td>
                          <td className="px-4 py-2 text-center">{entry.meals}</td>
                           <td className="px-4 py-2 text-center">{entry.exercised ?
                               <span className="text-emerald-400">Yes</span> :
                               <span className="text-rose-500">No</span>
                           }</td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleEdit(entry)}
                                disabled={isLoading}
                                className="text-blue-400 p-1 rounded hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Edit this entry"
                              >
                                {/* Simple Icon Example (replace with actual SVG or icon library) */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button
                                onClick={() => handleDelete(entry.id, entry.date)}
                                disabled={isLoading}
                                className="text-red-500 p-1 rounded hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete this entry"
                              >
                                {/* Simple Icon Example */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div> {/* End Table Div */}

          </div> {/* End Right Column Div */}
        </div> {/* End Main Flex Row */}
      </div> {/* End Page Content Container */}
    </div> // End Root Div
  );
};

export default Dashboard;
