"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useUserRole } from '@/hooks/useUserRole';

export default function ProcessRequestsPage() {
  const { role, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState(null);

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
    if (!roleLoading) {
      if (!role || !["procurement_officer", "admin"].includes(role)) {
        router.push("/dashboard"); // Redirect to dashboard if not authorized
      }
    }
  }, [role, roleLoading, router]);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoadingRequests(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('procurement_requests')
        .select('*, profiles(full_name), teams(name), currency') // Include currency in the select
        .eq('status', 'approved by admin'); // Changed to 'approved by admin'

      if (fetchError) {
        console.error('Error fetching requests:', fetchError.message);
        setError(fetchError.message);
      } else {
        setRequests(data);
      }
      setLoadingRequests(false);
    };

    if (!roleLoading && role && ["procurement_officer", "admin"].includes(role)) {
      fetchRequests();
    }
  }, [role, roleLoading]);

  const handleProcessRequest = async (requestId) => {
    setError(null);
    const newStatus = 'processed'; // Changed to lowercase 'processed'

    const { error: updateError } = await supabase
      .from('procurement_requests')
      .update({ status: newStatus })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error processing request:', updateError.message);
      setError(updateError.message);
    } else {
      // Update the local state to remove the processed request
      setRequests(requests.filter(req => req.id !== requestId));
    }
  };

  if (roleLoading || loadingRequests) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading requests for processing...</div>;
  }

  if (!role || !["procurement_officer", "admin"].includes(role)) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Access Denied</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Process Procurement Requests</h1>

        {error && <p className="text-red-500 text-sm mb-4 text-center">Error: {error}</p>}

        {requests.length === 0 ? (
          <p className="text-center text-lg text-gray-700 dark:text-gray-300">No requests to process at this time.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Request Name</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Description</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Quantity</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Unit Price</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Total Estimated Price</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Status</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Submitted By</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Team</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{request.request_name}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{request.description}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{request.quantity}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{getCurrencySymbol(request.currency)}{request.unit_price}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{getCurrencySymbol(request.currency)}{request.total_estimated_price}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 capitalize text-gray-800 dark:text-gray-200">{request.status.replace(/_/g, ' ')}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{request.profiles?.full_name || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{request.teams?.name || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => handleProcessRequest(request.id)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
                      >
                        Mark as Processed
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
