"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

export default function Home() {
  useEffect(() => {
  console.log("Runtime Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log(
      "Runtime Supabase Key:",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10) + "..."
    );
}, []);

  const router = useRouter();

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push("/dashboard");
        } else {
          router.push("/login"); // Redirect to login if no session
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login"); // Redirect to login on error
      }
    };
    checkSessionAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
      </div>
      </div>
  );
}
