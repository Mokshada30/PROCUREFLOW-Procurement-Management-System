"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase";
import { useUserRole } from "@/hooks/useUserRole";

export default function DashboardContent() {
  const { role, loading: roleLoading } = useUserRole();
  const [userName, setUserName] = useState("Guest");
  const [userRoleDisplay, setUserRoleDisplay] = useState("Loading Role...");
  const [loadingUser, setLoadingUser] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setLoadingUser(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", authUser.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error.message);
          setUserName("User");
          setUserRoleDisplay("Unknown Role");
        } else if (profile) {
          setUserName(profile.full_name || "User");
          setUserRoleDisplay(profile.role ? profile.role.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) : "Unknown Role");
        }
      } else {
        setUserName("Guest");
        setUserRoleDisplay("Not Logged In");
      }
      setLoadingUser(false);
    };

    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        fetchUserData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loadingUser || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        Loading user data...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 text-shadow-light-dark">Welcome to Procure<span className="text-blue-300">Flow</span>!</h1>
      <p className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{getGreeting()}, {userName}</p>
      <p className="text-lg text-indigo-600 dark:text-indigo-400 mb-8">Role: {userRoleDisplay}</p>
      <p className="text-base text-gray-700 dark:text-gray-300 mb-8 max-w-5xl whitespace-nowrap italic">
        Your streamlined solution for efficient procurement and purchase management.<br />Easily submit requests, track their status, and manage your inventory.
      </p>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-2xl min-h-[300px]">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Quick Start Guide:</h2>
        <div className="flex flex-col space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm text-gray-800 dark:text-gray-200 text-left">
            <span className="mr-2 text-xl text-blue-300">•</span>Hover over the sidebar to expand it and reveal navigation labels. Click the arrow to lock it open or closed.
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm text-gray-800 dark:text-gray-200 text-left">
            <span className="mr-2 text-xl text-blue-300">•</span>Use the "Submit Request" link in the sidebar to create new procurement requests.
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm text-gray-800 dark:text-gray-200 text-left">
            <span className="mr-2 text-xl text-blue-300">•</span>Track your submitted requests under "My Requests".
          </div>
          {["admin", "team_lead", "procurement_officer"].includes(role) && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm text-gray-800 dark:text-gray-200 text-left">
              <span className="mr-2 text-xl text-blue-300">•</span>Procurement Officers and Team Leads can use "Review Requests" and "Process Requests" to manage approvals and fulfillments.
            </div>
          )}
          {["admin", "procurement_officer"].includes(role) && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm text-gray-800 dark:text-gray-200 text-left">
              <span className="mr-2 text-xl text-blue-300">•</span>Explore "Inventory" to view current stock and "Manage Vendors" to update vendor information.
            </div>
          )}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm text-gray-800 dark:text-gray-200 text-left">
            <span className="mr-2 text-xl text-blue-300">•</span>Access "Settings" to update your profile, change theme
            {role === "admin" && " and manage user roles"}.
          </div>
        </div>
      </div>
    </div>
  );
}
