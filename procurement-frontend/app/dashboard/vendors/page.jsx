"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useUserRole } from '@/hooks/useUserRole';

export default function VendorsPage() {
  const { role, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [error, setError] = useState(null);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorContact, setNewVendorContact] = useState(""); // This is now for contact_info, which is a combined field for general contact info
  const [newVendorContactPerson, setNewVendorContactPerson] = useState("");
  const [newVendorEmail, setNewVendorEmail] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");
  const [newVendorAddress, setNewVendorAddress] = useState("");

  useEffect(() => {
    if (!roleLoading) {
      if (!role || !["procurement_officer", "admin"].includes(role)) {
        router.push("/dashboard");
      }
    }
  }, [role, roleLoading, router]);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoadingVendors(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('vendors')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) {
        console.error('Error fetching vendors:', fetchError.message);
        setError(fetchError.message);
      } else {
        setVendors(data);
      }
      setLoadingVendors(false);
    };

    if (!roleLoading && role && ["procurement_officer", "admin"].includes(role)) {
      fetchVendors();
    }
  }, [role, roleLoading]);

  const handleAddVendor = async (e) => {
    e.preventDefault();
    setError(null);

    if (!newVendorName || !newVendorContact) {
      setError("Please fill in all fields for the new vendor.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from('vendors')
      .insert([{ 
        name: newVendorName,
        contact_info: newVendorContact,
        contact_person: newVendorContactPerson,
        email: newVendorEmail,
        phone: newVendorPhone,
        address: newVendorAddress,
      }]);

    if (insertError) {
      console.error('Error adding vendor:', insertError.message);
      setError(insertError.message);
    } else {
      setNewVendorName("");
      setNewVendorContact("");
      setNewVendorContactPerson(""); // Clear new state variables
      setNewVendorEmail("");
      setNewVendorPhone("");
      setNewVendorAddress("");
      // Re-fetch vendors to show the updated list
      const { data: updatedVendors, error: fetchError } = await supabase
        .from('vendors')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) {
        console.error('Error refetching vendors:', fetchError.message);
        setError(fetchError.message);
      } else {
        setVendors(updatedVendors);
      }
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    setError(null);
    const { error: deleteError } = await supabase
      .from('vendors')
      .delete()
      .eq('id', vendorId);

    if (deleteError) {
      console.error('Error deleting vendor:', deleteError.message);
      setError(deleteError.message);
    } else {
      setVendors(vendors.filter(vendor => vendor.id !== vendorId));
    }
  };

  if (roleLoading || loadingVendors) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading Vendors...</div>;
  }

  if (!role || !["procurement_officer", "admin"].includes(role)) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Access Denied</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Vendor Management</h1>

        {error && <p className="text-red-500 text-sm mb-4 text-center">Error: {error}</p>}

        <div className="mb-8 p-6 border rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Add New Vendor</h2>
          <form onSubmit={handleAddVendor} className="space-y-4">
            <div>
              <label htmlFor="newVendorName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vendor Name</label>
              <input
                type="text"
                id="newVendorName"
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="newVendorContact" className="block text-sm font-medium text-gray-700 dark:text-gray-300">General Contact Info</label>
              <input
                type="text"
                id="newVendorContact"
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={newVendorContact}
                onChange={(e) => setNewVendorContact(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="newVendorContactPerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Person</label>
              <input
                type="text"
                id="newVendorContactPerson"
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={newVendorContactPerson}
                onChange={(e) => setNewVendorContactPerson(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="newVendorEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                id="newVendorEmail"
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={newVendorEmail}
                onChange={(e) => setNewVendorEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="newVendorPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
              <input
                type="tel"
                id="newVendorPhone"
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={newVendorPhone}
                onChange={(e) => setNewVendorPhone(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="newVendorAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
              <textarea
                id="newVendorAddress"
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows="3"
                value={newVendorAddress}
                onChange={(e) => setNewVendorAddress(e.target.value)}
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Vendor
            </button>
          </form>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Existing Vendors</h2>
        {vendors.length === 0 ? (
          <p className="text-center text-lg text-gray-700 dark:text-gray-300">No vendors found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Vendor Name</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Contact Person</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Email</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Phone</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Address</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">General Contact Info</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{vendor.name}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{vendor.contact_person || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{vendor.email || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{vendor.phone || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{vendor.address || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{vendor.contact_info || 'N/A'}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => handleDeleteVendor(vendor.id)}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs"
                      >
                        Delete
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
