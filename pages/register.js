import { useState } from 'react';
import { auth, db } from '../firebase/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user data in Firestore (including username)
      await setDoc(doc(db, 'users', user.uid), {
        username: username,
        email: user.email,
        userId: user.uid,
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      setError('Error signing up: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center px-4 py-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Create Account</h1>
      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleSignUp} className="flex flex-col gap-4 w-full max-w-md">
        <input
          type="text"
          placeholder="Username"
          className="px-4 py-2 rounded-full text-black"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
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
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default SignUp;
