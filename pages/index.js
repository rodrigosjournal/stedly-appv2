import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-between px-4 py-8 text-center">
      {/* Brand + Slogan */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">steadly.app</h1>
        <p className="text-3xl font-bold text-white">A minimalist tracker for your entire training journey</p>
<p className="text-base text-white mt-2">Whether you're lifting, swimming, or in rehab — steadly.app helps you log consistently, reflect easily, and build insights over time.</p>
      </div>

      {/* CTA Buttons */}
      <div className="flex gap-4 mb-10">
        <Link href="/login">
          <button className="bg-white text-black px-6 py-2 rounded-full shadow hover:bg-gray-200">Login</button>
        </Link>
        <Link href="/register">
          <button className="border border-white px-6 py-2 rounded-full hover:bg-white hover:text-black">Register</button>
        </Link>
      </div>

      {/* Hero Image */}
      <img
        src="/images/Hyrox.avif"
        alt="Athlete training"
        width={320}
        height={480}
        className="rounded-2xl shadow-lg mb-6"
      />
    </div>
  );
}
