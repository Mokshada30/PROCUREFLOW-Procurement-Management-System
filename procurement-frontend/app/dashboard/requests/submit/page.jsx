"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { useUserRole } from "@/hooks/useUserRole";

export default function SubmitRequestPage() {
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [unitPrice, setUnitPrice] = useState(""); // New state for unitPrice
  const [selectedCurrency, setSelectedCurrency] = useState("USD"); // New state for currency
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { role, loading: roleLoading } = useUserRole();

  const getCurrencySymbol = (currencyCode) => {
    switch (currencyCode) {
      case "USD":
        return "$";
      case "INR":
        return "₹";
      case "EUR":
        return "€";
      case "GBP":
        return "£";
      case "JPY":
        return "¥";
      case "CAD":
        return "C$";
      default:
        return ""; // No symbol for unknown currencies
    }
  };

  useEffect(() => {
    if (!roleLoading && !["employee", "admin", "team_lead", "procurement_officer"].includes(role)) {
      router.push("/dashboard");
    }
  }, [role, roleLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Error: User not logged in.");
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('team_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData?.team_id) {
      setMessage(`Error fetching user team: ${profileError?.message || "Team not found for user."}`);
      setLoading(false);
      return;
    }

    const userTeamId = profileData.team_id;

    const { error } = await supabase.from("procurement_requests").insert([
      {
        submitted_by: user.id, // Changed 'user_id' to 'submitted_by'
        team_id: userTeamId, // Include the fetched team_id
        request_name: item, // Changed 'item' to 'request_name'
        quantity,
        unit_price: parseFloat(unitPrice), // Include unitPrice
        description: reason, // Changed 'reason' to 'description'
        status: "pending",
        currency: selectedCurrency, // Include the selected currency
      },
    ]);

    if (error) {
      setMessage(`Error submitting request: ${error.message}`);
    } else {
      setMessage("Request submitted successfully!");
      setItem("");
      setQuantity("");
      setReason("");
      setUnitPrice(""); // Clear unitPrice field
      setSelectedCurrency("USD"); // Clear and reset currency field
    }
    setLoading(false);
  };

  if (roleLoading || !["employee", "admin", "team_lead", "procurement_officer"].includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        Loading or Unauthorized...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg z-10">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">Submit New Request</h2>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="item" className="sr-only">Item</label>
            <input
              id="item"
              name="item"
              type="text"
              autoComplete="off"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-gray-50 dark:bg-gray-700"
              placeholder="Item Name"
              value={item}
              onChange={(e) => setItem(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="quantity" className="sr-only">Quantity</label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              autoComplete="off"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-gray-50 dark:bg-gray-700"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="unitPrice" className="sr-only">Unit Price</label>
            <input
              id="unitPrice"
              name="unitPrice"
              type="number"
              step="0.01"
              autoComplete="off"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-gray-50 dark:bg-gray-700"
              placeholder="Unit Price"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="currency" className="sr-only">Currency</label>
            <select
              id="currency"
              name="currency"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-gray-50 dark:bg-gray-700"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="CAD">CAD (C$)</option>
              {/* Add more currency options as needed */}
            </select>
          </div>
          <div>
            <label htmlFor="reason" className="sr-only">Reason</label>
            <textarea
              id="reason"
              name="reason"
              rows="3"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-gray-50 dark:bg-gray-700"
              placeholder="Reason for request"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            ></textarea>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
        {message && <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">{message}</p>}
      </div>
    </div>
  );
}
