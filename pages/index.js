import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard'); // redirect on success
    } catch (error) {
      setError('Login failed: ' + error.message);
    }
  };

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
      <form
        onSubmit={handleLogin}
        className="flex flex-col gap-6 mb-10 w-full max-w-md"
      >
        {error && <p className="text-red-500">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="px-4 py-2 rounded-full text-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="px-4 py-2 rounded-full text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-white text-black px-6 py-3 rounded-full shadow hover:bg-gray-200 font-bold text-lg"
        >
          Login
        </button>

        <p className="text-white text-center">
          Don't have an account?{' '}
          <Link href="/register">
            <span className="text-blue-500 underline cursor-pointer">Register</span>
          </Link>
          <br />
          <Link href="/forgot-password">
            <span className="text-blue-500 underline cursor-pointer">Forgot Password?</span>
          </Link>
        </p>
      </form>

      {/* Google Sign-In (not functional yet) */}
      <div className="flex flex-col gap-4 mb-6 w-full max-w-md mt-6">
        <button className="bg-white text-black px-6 py-3 rounded-full shadow hover:bg-gray-200 font-bold text-lg">
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
