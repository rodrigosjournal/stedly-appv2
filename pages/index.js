
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold mb-4">Welcome to Stedly</h1>
      <p className="text-lg mb-8 text-center">Track your lifts. Grow steadily. Minimalist strength training built for consistency.</p>
      <Link href="/dashboard">
        <button className="bg-white text-gray-900 px-6 py-3 rounded-2xl shadow hover:bg-gray-200">
          Start Logging
        </button>
      </Link>
    </div>
  );
}
