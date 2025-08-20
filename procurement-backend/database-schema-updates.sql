-- Payment Integration Schema Updates for Procurement System

-- 1. Add payment table to track all payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL, -- 'stripe', 'bank_transfer', 'check', etc.
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'refunded'
    stripe_payment_intent_id VARCHAR(255), -- Store Stripe payment intent ID
    stripe_client_secret VARCHAR(255), -- Store Stripe client secret
    payment_terms VARCHAR(20) DEFAULT 'immediate', -- 'immediate', 'net_30', 'net_60'
    due_date DATE, -- When payment is due based on terms
    paid_at TIMESTAMP WITH TIME ZONE, -- When payment was actually made
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add payment-related fields to purchase_orders table
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(20) DEFAULT 'immediate',
ADD COLUMN IF NOT EXISTS payment_due_date DATE,
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP WITH TIME ZONE;

-- 3. Create payment_terms table for configurable terms
CREATE TABLE IF NOT EXISTS payment_terms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- 'Immediate', 'Net 30', 'Net 60'
    days INTEGER NOT NULL, -- 0 for immediate, 30 for net 30, etc.
    min_order_amount DECIMAL(10,2) DEFAULT 0, -- Minimum order amount for this term
    max_order_amount DECIMAL(10,2), -- Maximum order amount for this term
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert default payment terms
INSERT INTO payment_terms (name, days, min_order_amount, max_order_amount) VALUES
('Immediate', 0, 0, 999.99),
('Net 30', 30, 1000.00, 9999.99),
('Net 60', 60, 10000.00, NULL)
ON CONFLICT DO NOTHING;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_po_id ON payment_transactions(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_payment_status ON purchase_orders(payment_status);

-- 6. Add RLS policies for payment tables (adjust as needed for your security model)
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_terms ENABLE ROW LEVEL SECURITY;

-- 7. Create function to automatically set payment terms based on order amount
CREATE OR REPLACE FUNCTION set_payment_terms()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-set payment terms based on order amount
    SELECT 
        pt.name,
        pt.days,
        CASE 
            WHEN pt.days = 0 THEN CURRENT_DATE
            ELSE CURRENT_DATE + INTERVAL '1 day' * pt.days
        END
    INTO 
        NEW.payment_terms,
        NEW.payment_due_date
    FROM payment_terms pt
    WHERE NEW.total_amount >= pt.min_order_amount 
    AND (pt.max_order_amount IS NULL OR NEW.total_amount <= pt.max_order_amount)
    AND pt.is_active = true
    ORDER BY pt.days ASC
    LIMIT 1;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to automatically set payment terms when PO is created
CREATE TRIGGER trigger_set_payment_terms
    BEFORE INSERT ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION set_payment_terms();

-- 9. Create function to update payment status
CREATE OR REPLACE FUNCTION update_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update PO payment status when payment transaction is completed
    IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
        UPDATE purchase_orders 
        SET 
            payment_status = 'paid',
            payment_completed_at = NEW.paid_at
        WHERE id = NEW.purchase_order_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to update PO payment status
CREATE TRIGGER trigger_update_payment_status
    AFTER UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_status();
