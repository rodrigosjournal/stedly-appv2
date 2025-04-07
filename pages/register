import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useRouter } from 'next/router';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect to dashboard after successful login
      router.push('/dashboard');
    } catch (error) {
      setError('Error logging in: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center px-4 py-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Log In</h1>
      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-md">
        <input
          type="email"
          placeholder="Email"
          className="px-4 py-2 rounded-full text-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="px-4 py-2 rounded-full text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="bg-white text-black px-6 py-3 rounded-full shadow hover:bg-gray-200">
          Login
        </button>
      </form>
      <p className="text-white text-center mt-4">
        Don't have an account?{' '}
        <a href="/sign-up" className="text-blue-500">
          Register
        </a>
      </p>
    </div>
  );
};

export default Login;
