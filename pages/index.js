import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-between px-4 py-8 text-center">
      {/* Brand */}
      <h1 className="text-2xl font-semibold text-gray-400 mb-2">Steadly</h1>

      {/* Hero Section */}
      <div>
        <img
          src="/images/Hyrox.avif"
          alt="Athlete training"
          width={320}
          height={480}
          className="rounded-2xl shadow-lg mx-auto mb-6"
        />

        <h2 className="text-3xl font-bold mb-2">Train Smart. Track Easy.</h2>
        <p className="text-gray-400 text-base max-w-sm mx-auto mb-6">
          A minimalist fitness tracker for strength training, progressive overload, and steady gains.
        </p>
      </div>

      {/* CTA */}
      <Link href="/dashboard">
        <button className="bg-white text-gray-900 px-6 py-3 rounded-full shadow hover:bg-gray-200">
          Open App
        </button>
      </Link>
    </div>
  );
}
