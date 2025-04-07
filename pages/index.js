import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center px-4 py-8 text-center">
      {/* Brand + Slogan */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">steadly.app</h1>
        <p className="text-3xl font-bold text-white">
          An online tracker for your sports and recovery.
        </p>
        <p className="text-base text-white mt-2">
          Steadly.app simplifies tracking your progress, offering statistical data that can be downloaded to share or store elsewhere.
        </p>
      </div>

      {/* Login Form */}
      <div className="flex flex-col gap-6 mb-10 w-full max-w-md">
        <input
          type="email"
          placeholder="Email"
          className="px-4 py-2 rounded-full text-black"
        />
        <input
          type="password"
          placeholder="Password"
          className="px-4 py-2 rounded-full text-black"
        />
        <button className="bg-white text-black px-6 py-3 rounded-full shadow hover:bg-gray-200 font-bold text-lg">
          Login
        </button>
        <p className="text-white text-center">
          Don't have an account? <Link href="/register"><a className="text-blue-500">Register</a></Link>
          <br />
          <Link href="/forgot-password"><a className="text-blue-500">Forgot Password?</a></Link>
        </p>
      </div>

      {/* Google Sign-In Button */}
      <div className="flex flex-col gap-4 mb-6 w-full max-w-md mt-6">
        <button className="bg-white text-black px-6 py-3 rounded-full shadow hover:bg-gray-200 font-bold text-lg">
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
