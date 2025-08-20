"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useUserRole } from '@/hooks/useUserRole';

export default function ReceiveItemsPage() {
  const { role, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loadingPOs, setLoadingPOs] = useState(true);
  const [error, setError] = useState(null);

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
        .select('*, procurement_requests(request_name, quantity, unit_price), vendors(name)')
        .eq('status', 'Issued'); // Only fetch POs that are 'Issued' (or 'Shipped', depending on workflow)

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

  const handleReceiveItems = async (poId) => {
    setError(null);
    const newStatus = 'Received';

    const { error: updateError } = await supabase
      .from('purchase_orders')
      .update({ status: newStatus })
      .eq('id', poId);

    if (updateError) {
      console.error('Error receiving items:', updateError.message);
      setError(updateError.message);
    } else {
      // Update the status of the related procurement request to 'Completed'
      const poToUpdate = purchaseOrders.find(po => po.id === poId);
      if (poToUpdate && poToUpdate.request_id) {
        const { error: updateRequestError } = await supabase
          .from('procurement_requests')
          .update({ status: 'Completed' })
          .eq('id', poToUpdate.request_id);

        if (updateRequestError) {
          console.error('Error updating related request status to completed:', updateRequestError.message);
          setError(updateRequestError.message);
        }
      }

      // Update local state to remove the received PO
      setPurchaseOrders(purchaseOrders.filter(po => po.id !== poId));
    }
  };

  if (roleLoading || loadingPOs) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading Purchase Orders for receiving...</div>;
  }

  if (!role || !["procurement_officer", "admin"].includes(role)) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Access Denied</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Receive Items</h1>

        {error && <p className="text-red-500 text-sm mb-4 text-center">Error: {error}</p>}

        {purchaseOrders.length === 0 ? (
          <p className="text-center text-lg text-gray-700 dark:text-gray-300">No Purchase Orders awaiting receipt.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">PO Number</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Request Name</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Vendor</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Quantity</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Total Amount</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Status</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{po.po_number}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{po.procurement_requests?.request_name || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{po.vendors?.name || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{po.procurement_requests?.quantity || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">${po.total_amount}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 capitalize text-gray-800 dark:text-gray-200">{po.status.replace(/_/g, ' ')}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => handleReceiveItems(po.id)}
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs"
                      >
                        Mark as Received
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
