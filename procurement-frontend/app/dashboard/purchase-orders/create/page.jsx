"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { useUserRole } from "@/hooks/useUserRole";

export default function CreatePOPage() {
  const [request, setRequest] = useState("");
  const [vendor, setVendor] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const router = useRouter();
  const { role, loading: roleLoading } = useUserRole();
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [vendors, setVendors] = useState([]);

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
        router.push("/dashboard");
      }
    }
  }, [role, roleLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch approved requests (ready for PO creation)
      const { data: requestsData, error: requestsError } = await supabase
        .from('procurement_requests')
        .select('id, request_name, description, quantity, unit_price, total_estimated_price, profiles(full_name), currency') // Include currency
        .eq('status', 'approved by admin'); // Changed from 'Processed' to 'approved by admin'

      if (requestsError) {
        console.error("Error fetching approved requests:", requestsError.message);
        setStatusMessage(`Error fetching requests: ${requestsError.message}`);
      } else {
        setApprovedRequests(requestsData);
      }

      // Fetch vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('id, name');

      if (vendorsError) {
        console.error("Error fetching vendors:", vendorsError.message);
        setStatusMessage(`Error fetching vendors: ${vendorsError.message}`);
      } else {
        setVendors(vendorsData);
      }
    };

    if (!roleLoading && role && ["procurement_officer", "admin"].includes(role)) {
      fetchData();
    }
  }, [role, roleLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage("");

    if (!request || !vendor || !poNumber) {
      setStatusMessage("Please fill in all fields.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStatusMessage("Error: User not logged in.");
      return;
    }

    const selectedRequest = approvedRequests.find(req => req.id === request);
    if (!selectedRequest) {
      setStatusMessage("Selected request not found.");
      return;
    }

    const { data: poData, error: poError } = await supabase.from('purchase_orders').insert([
      {
        request_id: selectedRequest.id,
        vendor_id: vendor,
        po_number: poNumber, // Add this line to save the PO number
        total_amount: selectedRequest.total_estimated_price, // Use total estimated price from request
        status: 'Issued',
        ordered_by: user.id, // Include the current user's ID
      },
    ]);

    if (poError) {
      setStatusMessage(`Error creating Purchase Order: ${poError.message}`);
      console.error("Error creating PO:", poError);
    } else {
      // Update the status of the procurement request to 'PO Issued'
      const { error: updateRequestError } = await supabase
        .from('procurement_requests')
        .update({ status: 'po issued' }) // Changed to lowercase 'po issued'
        .eq('id', selectedRequest.id);

      if (updateRequestError) {
        console.error("Error updating request status:", updateRequestError.message);
        setStatusMessage(`PO created, but error updating request status: ${updateRequestError.message}`);
      } else {
        setStatusMessage("Purchase Order created successfully!");
        setRequest("");
        setVendor("");
        setPoNumber("");
        // Refresh approved requests list after successful PO creation
        setApprovedRequests(approvedRequests.filter(req => req.id !== selectedRequest.id));
        router.push("/dashboard/purchase-orders/view");
      }
    }
  };

  if (roleLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  if (!role || !["procurement_officer", "admin"].includes(role)) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Access Denied</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Create New Purchase Order</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="request" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Approved Request</label>
            <select
              id="request"
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              required
            >
              <option value="">-- Select a request --</option>
              {approvedRequests.map((req) => (
                <option key={req.id} value={req.id}>
                  {req.request_name} (Qty: {req.quantity}, Est. Price: {getCurrencySymbol(req.currency)}{req.total_estimated_price}, By: {req.profiles?.full_name || 'N/A'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Vendor</label>
            <select
              id="vendor"
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              required
            >
              <option value="">-- Select a vendor --</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="poNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Purchase Order Number</label>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">e.g., REQ-2025-001 (alphanumeric, unique)</p>
            <input
              type="text"
              id="poNumber"
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Purchase Order
          </button>
        </form>
        {statusMessage && (
          <p className="mt-4 text-center text-sm font-medium text-red-600">{statusMessage}</p>
        )}
      </div>
    </div>
  );
}
