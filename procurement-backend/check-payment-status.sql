-- Check current payment status and fix completed payments
-- Run this in your Supabase SQL Editor

-- 1. Check current state of the notepads PO
SELECT 
    po.id,
    po.po_number,
    po.status,
    po.payment_status,
    po.payment_terms,
    po.payment_due_date,
    po.payment_completed_at,
    po.total_amount
FROM purchase_orders po
WHERE po.po_number = 'REQ-NOTEPADS-001';

-- 2. Check if payment_transactions table has any records
SELECT 
    pt.*,
    po.po_number
FROM payment_transactions pt
JOIN purchase_orders po ON pt.purchase_order_id = po.id
WHERE po.po_number = 'REQ-NOTEPADS-001';

-- 3. Update the notepads PO to mark it as paid (since it was processed before schema updates)
UPDATE purchase_orders 
SET 
    payment_status = 'paid',
    payment_terms = 'immediate',
    payment_due_date = CURRENT_DATE,
    payment_completed_at = CURRENT_TIMESTAMP
WHERE po_number = 'REQ-NOTEPADS-001';

-- 4. Create a payment transaction record for the notepads PO
INSERT INTO payment_transactions (
    purchase_order_id,
    amount,
    currency,
    payment_method,
    payment_status,
    payment_terms,
    due_date,
    paid_at,
    created_at,
    updated_at
)
SELECT 
    po.id,
    po.total_amount,
    'USD',
    'stripe',
    'completed',
    'immediate',
    CURRENT_DATE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM purchase_orders po
WHERE po.po_number = 'REQ-NOTEPADS-001'
AND NOT EXISTS (
    SELECT 1 FROM payment_transactions pt 
    WHERE pt.purchase_order_id = po.id
);

-- 5. Verify the update worked
SELECT 
    po.id,
    po.po_number,
    po.status,
    po.payment_status,
    po.payment_terms,
    po.payment_due_date,
    po.payment_completed_at,
    po.total_amount
FROM purchase_orders po
WHERE po.po_number = 'REQ-NOTEPADS-001';

-- 6. Check payment transactions
SELECT 
    pt.*,
    po.po_number
FROM payment_transactions pt
JOIN purchase_orders po ON pt.purchase_order_id = po.id
WHERE po.po_number = 'REQ-NOTEPADS-001';
