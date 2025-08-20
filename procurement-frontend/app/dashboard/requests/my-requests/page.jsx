"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { useUserRole } from "@/hooks/useUserRole";

export default function MyRequestsPage() {
  const router = useRouter();
  const { role, loading } = useUserRole();
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const getCurrencySymbol = (currencyCode) => {
    switch (currencyCode) {
      case "USD":
        return "$";
      case "INR":
        return "₹";
      default:
        return ""; // No symbol for unknown currencies
    }
  };

  useEffect(() => {
    if (!loading) {
      // Allow admin, team_lead, procurement_officer, and employee roles
      if (!["admin", "team_lead", "procurement_officer", "employee"].includes(role)) {
        router.push("/dashboard");
      }
    }
  }, [role, loading, router]);

  useEffect(() => {
    const fetchMyRequests = async () => {
      setLoadingRequests(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // setMessage("User not logged in."); // This line was not in the new_code, so it's removed.
        setLoadingRequests(false);
        return;
      }

      const { data, error } = await supabase
        .from('procurement_requests') // Changed from 'requests' to 'procurement_requests'
        .select('*, teams(name), currency') // Include currency in the select
        .eq('submitted_by', user.id);

      if (error) {
        // setMessage(`Error fetching my requests: ${error.message}`); // This line was not in the new_code, so it's removed.
        console.error("Error fetching my requests:", error.message);
      } else {
        setRequests(data);
      }
      setLoadingRequests(false);
    };

    fetchMyRequests();

    // Realtime subscription for requests related to the current user
    const subscription = supabase.channel('my_requests_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'procurement_requests' }, // Changed 'requests' to 'procurement_requests'
        (payload) => {
          if (payload.new && payload.new.submitted_by === supabase.auth.user()?.id) { // Changed 'user_id' to 'submitted_by'
            fetchMyRequests(); // Re-fetch requests if there's a change relevant to this user
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading || loadingRequests) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        Loading my requests...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">My Requests</h1>

      {requests.length === 0 ? (
        <p className="text-lg text-gray-700 dark:text-gray-300">You have not submitted any requests yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Request ID: {request.id}</h2>
              <p className="text-gray-700 dark:text-gray-300">Item: {request.request_name}</p>
              <p className="text-gray-700 dark:text-gray-300">Quantity: {request.quantity}</p>
              {request.unit_price && (
                <p className="text-gray-700 dark:text-gray-300">Unit Price: {getCurrencySymbol(request.currency)}{request.unit_price}</p>
              )}
              {request.total_estimated_price && (
                <p className="text-gray-700 dark:text-gray-300">Total Estimated Price: {getCurrencySymbol(request.currency)}{request.total_estimated_price}</p>
              )}
              <p className="text-gray-700 dark:text-gray-300">Status: {request.status}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Submitted on: {new Date(request.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
