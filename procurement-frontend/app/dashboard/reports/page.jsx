"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useUserRole } from '@/hooks/useUserRole';

export default function ReportsPage() {
  const { role, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roleLoading) {
      if (!role || !["admin", "procurement_officer"].includes(role)) {
        router.push("/dashboard");
      }
    }
  }, [role, roleLoading, router]);

  useEffect(() => {
    const fetchReportsData = async () => {
      setLoadingReports(true);
      setError(null);

      // Fetch all procurement requests with related profiles and teams
      const { data: requestsData, error: requestsError } = await supabase
        .from('procurement_requests')
        .select('*, profiles(full_name), teams(name)')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching requests for reports:', requestsError.message);
        setError(`Error fetching requests: ${requestsError.message}`);
      } else {
        setRequests(requestsData);
      }

      // Fetch all purchase orders with related requests and vendors
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select('*, procurement_requests(request_name, quantity, unit_price, profiles(full_name)), vendors(name)')
        .order('created_at', { ascending: false });

      if (poError) {
        console.error('Error fetching purchase orders for reports:', poError.message);
        setError(`Error fetching purchase orders: ${poError.message}`);
      } else {
        setPurchaseOrders(poData);
      }

      // Fetch all vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .order('name', { ascending: true });

      if (vendorsError) {
        console.error('Error fetching vendors for reports:', vendorsError.message);
        setError(`Error fetching vendors: ${vendorsError.message}`);
      } else {
        setVendors(vendorsData);
      }

      setLoadingReports(false);
    };
    if (!roleLoading && role && ["admin", "procurement_officer"].includes(role)) {
      fetchReportsData();
    }
  }, [role, roleLoading]);

  if (roleLoading || loadingReports) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading Reports...</div>;
  }

  if (!role || !["admin", "procurement_officer"].includes(role)) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Access Denied</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Reports & Analytics</h1>

        {error && <p className="text-red-500 text-sm mb-4 text-center">Error: {error}</p>}

        {/* Section: Procurement Request Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Procurement Request Overview</h2>
          {requests.length === 0 ? (
            <p className="text-center text-lg text-gray-700 dark:text-gray-300">No procurement requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 mb-4">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Request Name</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Quantity</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Est. Price</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Status</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Submitted By</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Team</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{req.request_name}</td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{req.quantity}</td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">${req.total_estimated_price}</td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 capitalize text-gray-800 dark:text-gray-200">{req.status.replace(/_/g, ' ')}</td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{req.profiles?.full_name || 'N/A'}</td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{req.teams?.name || 'N/A'}</td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{new Date(req.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section: Purchase Order Details */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Purchase Order Details</h2>
          {purchaseOrders.length === 0 ? (
            <p className="text-center text-lg text-gray-700 dark:text-gray-300">No purchase orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 mb-4">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">PO Number</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Request</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Vendor</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Total Amount</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Status</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{po.po_number}</td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{po.procurement_requests?.request_name || 'N/A'}</td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{po.vendors?.name || 'N/A'}</td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">${po.total_amount}</td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 capitalize text-gray-800 dark:text-gray-200">{po.status.replace(/_/g, ' ')}</td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{new Date(po.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section: Vendor Information */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Vendor Information</h2>
          {vendors.length === 0 ? (
            <p className="text-center text-lg text-gray-700 dark:text-gray-300">No vendors found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Vendor Name</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Contact Info</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{vendor.name}</td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{vendor.contact_info}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
