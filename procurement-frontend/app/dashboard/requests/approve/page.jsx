"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useUserRole } from '@/hooks/useUserRole';

export default function ReviewRequestsPage() {
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
      if (!role || !["team_lead", "admin", "procurement_officer"].includes(role)) {
        router.push("/dashboard"); // Redirect to dashboard if not authorized
      }
    }
  }, [role, roleLoading, router]);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoadingRequests(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("User not logged in.");
        setLoadingRequests(false);
        return;
      }

      let query = supabase
        .from('procurement_requests')
        .select('*, profiles(full_name), teams(name), currency'); // Include currency in the select

      // If Team Lead, filter by their team_id
      if (role === 'team_lead') {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('team_id')
          .eq('id', user.id)
          .single();

        if (profileError || !profileData?.team_id) {
          setError(`Error fetching team ID: ${profileError?.message || "Team not found for user."}`);
          setLoadingRequests(false);
          return;
        }
        query = query.eq('team_id', profileData.team_id);
      }

      // Filter by status based on role
      if (role === 'team_lead') {
        query = query.in('status', ['pending']); // Changed 'Pending' to 'pending'
      } else if (role === 'admin') {
        query = query.in('status', ['approved by team lead', 'rejected by team lead']); // Ensure consistency
      } else if (role === 'procurement_officer') {
        query = query.in('status', ['approved by admin', 'rejected by admin']); // Ensure consistency
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching requests:', fetchError.message);
        setError(fetchError.message);
      } else {
        setRequests(data);
      }
      setLoadingRequests(false);
    };

    if (!roleLoading && role && ["team_lead", "admin", "procurement_officer"].includes(role)) {
      fetchRequests();
    }
  }, [role, roleLoading]);

  const handleStatusUpdate = async (requestId, newStatus) => {
    // Determine which field to update based on the user's role
    let updateField = '';
    if (role === 'team_lead') {
      updateField = newStatus === 'approved by team lead' ? 'approved_by_team_lead' : 'rejected_by_team_lead';
    } else if (role === 'admin') {
      updateField = newStatus === 'approved by admin' ? 'approved_by_admin' : 'rejected_by_admin';
    } else if (role === 'procurement_officer') {
        // Procurement officer logic for final approval or processing
        updateField = newStatus === 'approved by procurement officer' ? 'approved_by_procurement_officer' : 'rejected_by_procurement_officer';
    }

    const { data, error: updateError } = await supabase
      .from('procurement_requests')
      .update({
        status: newStatus,
        [updateField]: true,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request status:', updateError.message);
      setError(updateError.message);
    } else {
      // Update the local state to reflect the change
      setRequests(requests.map((req) =>
        req.id === requestId ? { ...req, status: newStatus, [updateField]: true } : req
      ));
    }
  };

  if (roleLoading || loadingRequests) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading requests for review...</div>;
  }

  if (!role || !["team_lead", "admin", "procurement_officer"].includes(role)) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Access Denied</div>;
  }

  const filteredRequests = requests.filter(request => {
    if (role === 'team_lead') {
      return request.status === 'pending'; // Changed 'Pending' to 'pending'
    } else if (role === 'admin') {
      return request.status === 'approved by team lead'; // Ensure consistency
    } else if (role === 'procurement_officer') {
        // Procurement officers should not review requests here once approved by admin
        return false; // No requests for Procurement Officer on this page at this stage
    }
    return false;
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Review Procurement Requests</h1>

        {error && <p className="text-red-500 text-sm mb-4 text-center">Error: {error}</p>}

        {filteredRequests.length === 0 ? (
          <p className="text-center text-lg text-gray-700 dark:text-gray-300">No requests to review at this time.</p>
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
                {filteredRequests.map((request) => (
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
                      <div className="flex space-x-2">
                        {((role === 'team_lead' && request.status === 'pending') ||
                          (role === 'admin' && request.status === 'approved by team lead')) && ( // Removed procurement_officer condition
                            <>
                              <button
                                onClick={() => handleStatusUpdate(request.id, role === 'team_lead' ? 'approved by team lead' : 'approved by admin')}
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(request.id, role === 'team_lead' ? 'rejected by team lead' : 'rejected by admin')}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs"
                              >
                                Reject
                              </button>
                            </>
                          )}
                      </div>
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
