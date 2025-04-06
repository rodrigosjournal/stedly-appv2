import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center px-4 py-20">
        <h1 className="text-4xl font-bold mb-4">Steadly</h1>
        <p className="text-lg mb-6 text-gray-400">
          Track your lifts. Grow steadily. Minimalist strength training built for consistency.
        </p>
        <Link href="/dashboard">
          <a className="bg-white text-gray-900 px-6 py-3 rounded-full shadow hover:bg-gray-200">
            Start Logging
          </a>
        </Link>
      </div>

      {/* Activity Feed */}
      <div className="bg-gray-900 py-10">
        <div className="max-w-4xl mx-auto px-4">
          {/* Example Activity */}
          <div className="flex items-center space-x-4 mb-6">
            <img
              src="/images/user-avatar.jpg"
              alt="User avatar"
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="font-semibold">Username</p>
              <p className="text-sm text-gray-400">Completed a workout</p>
            </div>
          </div>
          {/* Repeat the above block for more activities */}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6">
        <p className="text-gray-500 text-sm">&copy; 2025 Steadly. All rights reserved.</p>
      </footer>
    </div>
  );
}
