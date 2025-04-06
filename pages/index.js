import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold mb-4">Welcome to Steadly</h1>
      <p className="text-lg mb-6 text-center text-gray-300">Track your lifts. Grow steadily. Minimalist strength training built for consistency.</p>

      <Image
        src="/images/MathiasHyrox.avif"
        alt="Athlete training"
        width={320}
        height={480}
        className="rounded-2xl shadow-lg mb-6"
      />

      <Link href="/dashboard">
        <button className="bg-white text-gray-900 px-6 py-3 rounded-2xl shadow hover:bg-gray-200">
          Start Logging
        </button>
      </Link>
    </div>
  );
}
