"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: fullName,
            role: 'employee',
          });

        if (profileError) {
          setError('Error creating profile: ' + profileError.message);
          return;
        }
        setMessage('Registration successful! Please check your email for verification.');
      } else {
        setError('Something went wrong during registration.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // Redirects back to the current page after OAuth
      },
    });
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center 
                 bg-gray-100 dark:bg-gray-900 
                 text-gray-900 dark:text-gray-100 p-4 relative overflow-hidden"
    >
      {/* Full-size background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center "
        style={{ backgroundImage: 'url(/images/procureflow-banner.png)' }}
      ></div>
      <div className="absolute inset-0 bg-black opacity-50"></div> {/* Dark overlay */}

      {/* ProcureFlow Title and Tagline positioned top-left */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 text-white text-center">
        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-wide mb-3 text-shadow-light-dark">
          Procure<span className="text-blue-300">Flow</span>
        </h1>
        <p className="text-sm md:text-lg text-center 
                  text-orange-200 whitespace-nowrap italic text-shadow-light-dark">
          "Streamlined procurement and purchase management for modern teams."
        </p>
      </div>

      {/* Central content container (formerly the right column/form) */}
      <div className="relative z-10 
                  bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl 
                  w-full max-w-md translate-y-24">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Sign Up</h2>
        <form onSubmit={handleSignUp}>
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
            <input
              type="text"
              id="fullName"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign Up
          </button>
        </form>

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-gray-400 dark:border-gray-500"></div>
          <span className="flex-shrink mx-4 text-gray-400">OR</span>
          <div className="flex-grow border-t border-gray-400 dark:border-gray-500"></div>
        </div>

        <button
          onClick={handleGoogleSignUp}
          className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 flex items-center justify-center"
        >
          <img src="/google-g.png" alt="Google G logo" className="h-5 w-5 mr-2" />
          Sign Up with Google
        </button>

        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        {message && <p className="text-green-500 text-sm mt-4 text-center">{message}</p>}
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          Already have an account? <a href="/login" className="text-blue-600 hover:underline">Login here</a>
        </p>
      </div>
    </div>
  );
}
