"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useUserRole } from '@/hooks/useUserRole';
// Stripe integration will be added later
// For now, using basic payment form

export default function PaymentsPage() {
  const { role, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loadingPOs, setLoadingPOs] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPO, setSelectedPO] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (!roleLoading) {
      if (!role || !["procurement_officer", "admin"].includes(role)) {
        router.push("/dashboard");
      }
    }
  }, [role, roleLoading, router]);

  const [allPurchaseOrders, setAllPurchaseOrders] = useState([]);

  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      setLoadingPOs(true);
      setError(null);

      // Fetch all POs for the completed payments section
      const { data: allData, error: allError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          procurement_requests(request_name, quantity, unit_price, currency),
          vendors(name, email, phone)
        `)
        .in('status', ['Issued', 'Shipped', 'Delivered', 'Received'])
        .order('created_at', { ascending: false });

      if (allError) {
        console.error('Error fetching all purchase orders:', allError.message);
        setError(allError.message);
      } else {
        setAllPurchaseOrders(allData);
        
        // Filter for unpaid POs only
        const unpaidPOs = allData.filter(po => po.payment_status !== 'paid');
        setPurchaseOrders(unpaidPOs);
      }
      setLoadingPOs(false);
    };

    if (!roleLoading && role && ["procurement_officer", "admin"].includes(role)) {
      fetchPurchaseOrders();
    }
  }, [role, roleLoading]);

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
        return "";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleInitiatePayment = (po) => {
    setSelectedPO(po);
    setShowPaymentForm(true);
  };

  const handlePaymentComplete = async (paymentData) => {
    setPaymentLoading(true);
    
    try {
      // Try to create payment transaction record (if table exists)
      let transactionError = null;
      try {
        const { error } = await supabase
          .from('payment_transactions')
          .insert([{
            purchase_order_id: selectedPO.id,
            amount: selectedPO.total_amount,
            currency: selectedPO.procurement_requests?.currency || 'USD',
            payment_method: 'stripe',
            payment_status: 'completed',
            stripe_payment_intent_id: paymentData.paymentIntentId,
            payment_terms: selectedPO.payment_terms || 'immediate',
            due_date: selectedPO.payment_due_date,
            paid_at: new Date().toISOString(),
            created_by: (await supabase.auth.getUser()).data.user?.id
          }]);
        transactionError = error;
      } catch (tableError) {
        console.log('Payment transactions table not available yet:', tableError.message);
        // Continue without transaction record for now
      }

      if (transactionError) {
        console.log('Transaction record creation failed:', transactionError.message);
        // Continue without transaction record for now
      }

      // Try to update PO payment status (if column exists)
      let poError = null;
      try {
        const { error } = await supabase
          .from('purchase_orders')
          .update({ 
            payment_status: 'paid',
            payment_completed_at: new Date().toISOString()
          })
          .eq('id', selectedPO.id);
        poError = error;
      } catch (columnError) {
        console.log('Payment status column not available yet:', columnError.message);
        // Continue without updating payment status for now
      }

      if (poError) {
        console.log('PO payment status update failed:', poError.message);
        // Continue without updating payment status for now
      }

             // Refresh both lists
       setPurchaseOrders(prev => prev.filter(po => po.id !== selectedPO.id));
       setAllPurchaseOrders(prev => prev.map(po => 
         po.id === selectedPO.id 
           ? { ...po, payment_status: 'paid', payment_completed_at: new Date().toISOString() }
           : po
       ));
       setShowPaymentForm(false);
       setSelectedPO(null);
      
      // Show success message
      alert('Payment completed successfully! ✅\n\nNote: Database tables for payment tracking will be available after running the schema updates.');
      
    } catch (error) {
      console.error('Error completing payment:', error);
      setError(`Payment processing error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (roleLoading || loadingPOs) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading Payments...</div>;
  }

  if (!role || !["procurement_officer", "admin"].includes(role)) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Access Denied</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Payment Management</h1>
        
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> Purchase orders appear here based on your payment terms. 
            For immediate payments, POs can be paid right after creation. 
            For Net 30/60 terms, payments are due based on the payment schedule.
          </p>
        </div>
        
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <strong>Database Setup Required:</strong> To enable full payment tracking and status updates, 
            run the database schema updates in <code>procurement-backend/database-schema-updates.sql</code> 
            in your Supabase database. For now, payments will process but won't be tracked in the database.
          </p>
        </div>
        
        {error && <p className="text-red-500 text-sm mb-4 text-center">Error: {error}</p>}

        {purchaseOrders.length === 0 ? (
          <p className="text-center text-lg text-gray-700 dark:text-gray-300">No purchase orders awaiting payment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">PO Number</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Request Name</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Vendor</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Amount</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Payment Terms</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Due Date</th>
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
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                      {getCurrencySymbol(po.procurement_requests?.currency)}{po.total_amount}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 capitalize">
                      {po.payment_terms?.replace(/_/g, ' ') || 'Immediate'}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                      {po.payment_due_date ? new Date(po.payment_due_date).toLocaleDateString() : 'Immediate'}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(po.payment_status || 'pending')}`}>
                        {po.payment_status || 'pending'}
                      </span>
                    </td>
                                         <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600">
                       {po.payment_status === 'paid' ? (
                         <span className="text-green-600 font-medium text-sm">✓ Payment Complete</span>
                       ) : (
                         <button
                           onClick={() => handleInitiatePayment(po)}
                           className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                           disabled={paymentLoading}
                         >
                           {paymentLoading ? 'Processing...' : 'Pay Now'}
                         </button>
                       )}
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
                 )}

         {/* Completed Payments Section */}
         <div className="mt-8">
           <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Completed Payments</h2>
           <div className="overflow-x-auto">
             <table className="min-w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
               <thead>
                 <tr>
                   <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">PO Number</th>
                   <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Request Name</th>
                   <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Vendor</th>
                   <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Amount</th>
                   <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Payment Terms</th>
                   <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Completed Date</th>
                   <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Status</th>
                 </tr>
               </thead>
               <tbody>
                 {allPurchaseOrders.filter(po => po.payment_status === 'paid').map((po) => (
                   <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                     <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{po.po_number}</td>
                     <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{po.procurement_requests?.request_name || 'N/A'}</td>
                     <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{po.vendors?.name || 'N/A'}</td>
                     <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                       {getCurrencySymbol(po.procurement_requests?.currency)}{po.total_amount}
                     </td>
                     <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 capitalize">
                       {po.payment_terms?.replace(/_/g, ' ') || 'Immediate'}
                     </td>
                     <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                       {po.payment_completed_at ? new Date(po.payment_completed_at).toLocaleDateString() : 'N/A'}
                     </td>
                     <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600">
                       <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                         ✓ Paid
                       </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>

         {/* Payment Form Modal */}
        {showPaymentForm && selectedPO && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Process Payment</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Amount: {getCurrencySymbol(selectedPO.procurement_requests?.currency)}{selectedPO.total_amount}
              </p>
              
              <PaymentForm 
                purchaseOrder={selectedPO}
                onPaymentComplete={handlePaymentComplete}
                onCancel={() => setShowPaymentForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Payment Form Component
function PaymentForm({ purchaseOrder, onPaymentComplete, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch('http://localhost:5000/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchase_order_id: purchaseOrder.id,
          amount: purchaseOrder.total_amount,
          currency: purchaseOrder.procurement_requests?.currency || 'USD',
          payment_terms: purchaseOrder.payment_terms || 'immediate'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      // For demo purposes, we'll simulate payment completion
      // In production, you'd integrate with Stripe Elements here
      setTimeout(() => {
        onPaymentComplete({
          paymentIntentId: data.paymentIntentId,
          amount: data.amount,
          currency: data.currency
        });
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Payment Method
        </label>
        <select className="w-full p-2 border border-gray-300 rounded-md">
          <option value="stripe">Credit/Debit Card (Stripe)</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="check">Check</option>
        </select>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Currency
          </label>
          <select 
            className="w-full p-2 border border-gray-300 rounded-md"
            value={purchaseOrder.procurement_requests?.currency || 'USD'}
            disabled
          >
            <option value="USD">USD - US Dollar ($)</option>
            <option value="INR">INR - Indian Rupee (₹)</option>
            <option value="EUR">EUR - Euro (€)</option>
            <option value="GBP">GBP - British Pound (£)</option>
            <option value="JPY">JPY - Japanese Yen (¥)</option>
            <option value="CAD">CAD - Canadian Dollar (C$)</option>
          </select>
          <p className="text-xs text-gray-500">Currency is set from the original request</p>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Complete Payment'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
