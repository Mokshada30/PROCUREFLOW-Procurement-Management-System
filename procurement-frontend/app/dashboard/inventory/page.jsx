"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useUserRole } from '@/hooks/useUserRole';

export default function InventoryPage() {
  const { role, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roleLoading) {
      if (!role || !["procurement_officer", "admin"].includes(role)) {
        router.push("/dashboard");
      }
    }
  }, [role, roleLoading, router]);

  useEffect(() => {
    const fetchInventory = async () => {
      setLoadingInventory(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .order('item_name', { ascending: true });

      if (fetchError) {
        console.error('Error fetching inventory:', fetchError.message);
        setError(fetchError.message);
      } else {
        setInventoryItems(data);
      }
      setLoadingInventory(false);
    };

    if (!roleLoading && role && ["procurement_officer", "admin"].includes(role)) {
      fetchInventory();
    }
  }, [role, roleLoading]);

  if (roleLoading || loadingInventory) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading Inventory...</div>;
  }

  if (!role || !["procurement_officer", "admin"].includes(role)) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Access Denied</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Inventory Management</h1>

        {error && <p className="text-red-500 text-sm mb-4 text-center">Error: {error}</p>}

        {inventoryItems.length === 0 ? (
          <p className="text-center text-lg text-gray-700 dark:text-gray-300">No inventory items found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Item Name</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Current Stock</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Unit of Measure</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Last Received</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{item.item_name}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{item.current_stock}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{item.unit_of_measure}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{item.last_received_at ? new Date(item.last_received_at).toLocaleDateString() : 'N/A'}</td>
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
