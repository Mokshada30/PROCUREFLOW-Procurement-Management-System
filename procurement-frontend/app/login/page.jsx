"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const logoutSuccess = searchParams.get('logout') === 'success';
  const [showLogoutMessage, setShowLogoutMessage] = useState(logoutSuccess);

  // Hide message after a few seconds
  useEffect(() => {
    if (showLogoutMessage) {
      const timer = setTimeout(() => {
        setShowLogoutMessage(false);
        // Optionally remove the query param from URL
        router.replace('/login', undefined, { shallow: true });
      }, 3000); // Message disappears after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [showLogoutMessage, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/"); // redirect to dashboard after login
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // Redirects back to the current page after OAuth
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
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
        <p className="relative z-10 text-sm md:text-lg text-center 
                  text-orange-200 whitespace-nowrap italic text-shadow-light-dark">
          "Streamlined procurement and purchase management for modern teams."
        </p>
      </div>

      {/* Logout Success Message */}
      {showLogoutMessage && (
        <div className="absolute top-43 z-20 bg-green-500 text-white p-3 rounded-md shadow-lg">
          Successfully logged out. Visit again!
        </div>
      )}

      {/* Central content container (formerly the right column/form) */}
      <div
        className="relative z-10 
                   bg-white dark:bg-gray-800 
                   p-8 rounded-lg shadow-xl 
                   w-full max-w-md translate-y-24 
                   text-gray-900 dark:text-gray-100"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border rounded 
                         bg-gray-50 dark:bg-gray-700 
                         border-gray-300 dark:border-gray-600 
                         text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 border rounded 
                         bg-gray-50 dark:bg-gray-700 
                         border-gray-300 dark:border-gray-600 
                         text-gray-900 dark:text-gray-100"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded 
                       bg-blue-600 hover:bg-blue-700 
                       text-white font-semibold
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-gray-400"></div>
          <span className="flex-shrink mx-4 text-gray-400">OR</span>
          <div className="flex-grow border-t border-gray-400"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2 rounded flex items-center justify-center 
                     bg-black hover:bg-gray-800 
                     text-white font-semibold
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img src="/google-g.png" alt="Google G logo" className="h-5 w-5 mr-2" />
          {loading ? "Signing in with Google..." : "Sign in with Google"}
        </button>

        <p className="mt-4 text-center text-sm">
          Don't have an account?{" "}
          <a href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
