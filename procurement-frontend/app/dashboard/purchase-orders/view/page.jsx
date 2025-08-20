"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useUserRole } from '@/hooks/useUserRole';

export default function ViewPOPage() {
  const { role, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loadingPOs, setLoadingPOs] = useState(true);
  const [error, setError] = useState(null);

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
    if (!roleLoading) {
      if (!role || !["procurement_officer", "admin"].includes(role)) {
        router.push("/dashboard");
      }
    }
  }, [role, roleLoading, router]);

  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      setLoadingPOs(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('purchase_orders')
        .select('*, procurement_requests(request_name, quantity, unit_price, profiles(full_name), currency), vendors(name)') // Include currency from procurement_requests
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching purchase orders:', fetchError.message);
        setError(fetchError.message);
      } else {
        setPurchaseOrders(data);
      }
      setLoadingPOs(false);
    };

    if (!roleLoading && role && ["procurement_officer", "admin"].includes(role)) {
      fetchPurchaseOrders();
    }
  }, [role, roleLoading]);

  if (roleLoading || loadingPOs) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading Purchase Orders...</div>;
  }

  if (!role || !["procurement_officer", "admin"].includes(role)) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Access Denied</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">View Purchase Orders</h1>

        {error && <p className="text-red-500 text-sm mb-4 text-center">Error: {error}</p>}

        {purchaseOrders.length === 0 ? (
          <p className="text-center text-lg text-gray-700 dark:text-gray-300">No Purchase Orders to display.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">PO Number</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Request Name</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Vendor</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Total Amount</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Status</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Payment Status</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Ordered By</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Created At</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{po.po_number}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{po.procurement_requests?.request_name || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{po.vendors?.name || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{getCurrencySymbol(po.procurement_requests?.currency)}{po.total_amount}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 capitalize text-gray-800 dark:text-gray-200">{po.status.replace(/_/g, ' ')}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        po.payment_status === 'paid' ? 'text-green-600 bg-green-100' :
                        po.payment_status === 'pending' ? 'text-yellow-600 bg-yellow-100' :
                        'text-gray-600 bg-gray-100'
                      }`}>
                        {po.payment_status || 'pending'}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{po.procurement_requests?.profiles?.full_name || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{new Date(po.created_at).toLocaleDateString()}</td>
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
