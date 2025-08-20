-- Safe Payment Integration Schema Updates for Procurement System
-- This version checks for existing objects before creating them

-- 1. Add payment table to track all payment transactions (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_transactions') THEN
        CREATE TABLE payment_transactions (
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
        RAISE NOTICE 'Created payment_transactions table';
    ELSE
        RAISE NOTICE 'payment_transactions table already exists';
    END IF;
END $$;

-- 2. Add payment-related fields to purchase_orders table (only if not exist)
DO $$ 
BEGIN
    -- Check and add payment_status column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'payment_status') THEN
        ALTER TABLE purchase_orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
        RAISE NOTICE 'Added payment_status column to purchase_orders';
    ELSE
        RAISE NOTICE 'payment_status column already exists in purchase_orders';
    END IF;
    
    -- Check and add payment_terms column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'payment_terms') THEN
        ALTER TABLE purchase_orders ADD COLUMN payment_terms VARCHAR(20) DEFAULT 'immediate';
        RAISE NOTICE 'Added payment_terms column to purchase_orders';
    ELSE
        RAISE NOTICE 'payment_terms column already exists in purchase_orders';
    END IF;
    
    -- Check and add payment_due_date column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'payment_due_date') THEN
        ALTER TABLE purchase_orders ADD COLUMN payment_due_date DATE;
        RAISE NOTICE 'Added payment_due_date column to purchase_orders';
    ELSE
        RAISE NOTICE 'payment_due_date column already exists in purchase_orders';
    END IF;
    
    -- Check and add payment_completed_at column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'payment_completed_at') THEN
        ALTER TABLE purchase_orders ADD COLUMN payment_completed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added payment_completed_at column to purchase_orders';
    ELSE
        RAISE NOTICE 'payment_completed_at column already exists in purchase_orders';
    END IF;
END $$;

-- 3. Create payment_terms table for configurable terms (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_terms') THEN
        CREATE TABLE payment_terms (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(50) NOT NULL, -- 'Immediate', 'Net 30', 'Net 60'
            days INTEGER NOT NULL, -- 0 for immediate, 30 for net 30, etc.
            min_order_amount DECIMAL(10,2) DEFAULT 0, -- Minimum order amount for this term
            max_order_amount DECIMAL(10,2), -- Maximum order amount for this term
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created payment_terms table';
    ELSE
        RAISE NOTICE 'payment_terms table already exists';
    END IF;
END $$;

-- 4. Insert default payment terms (only if table is empty)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM payment_terms LIMIT 1) THEN
        INSERT INTO payment_terms (name, days, min_order_amount, max_order_amount) VALUES
        ('Immediate', 0, 0, 999.99),
        ('Net 30', 30, 1000.00, 9999.99),
        ('Net 60', 60, 10000.00, NULL);
        RAISE NOTICE 'Inserted default payment terms';
    ELSE
        RAISE NOTICE 'payment_terms table already has data';
    END IF;
END $$;

-- 5. Create indexes for better performance (only if not exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_payment_transactions_po_id') THEN
        CREATE INDEX idx_payment_transactions_po_id ON payment_transactions(purchase_order_id);
        RAISE NOTICE 'Created index idx_payment_transactions_po_id';
    ELSE
        RAISE NOTICE 'Index idx_payment_transactions_po_id already exists';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_payment_transactions_status') THEN
        CREATE INDEX idx_payment_transactions_status ON payment_transactions(payment_status);
        RAISE NOTICE 'Created index idx_payment_transactions_status';
    ELSE
        RAISE NOTICE 'Index idx_payment_transactions_status already exists';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_purchase_orders_payment_status') THEN
        CREATE INDEX idx_purchase_orders_payment_status ON purchase_orders(payment_status);
        RAISE NOTICE 'Created index idx_purchase_orders_payment_status';
    ELSE
        RAISE NOTICE 'Index idx_purchase_orders_payment_status already exists';
    END IF;
END $$;

-- 6. Enable RLS for payment tables (only if not already enabled)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'payment_transactions' AND rowsecurity = true) THEN
        ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS for payment_transactions';
    ELSE
        RAISE NOTICE 'RLS already enabled for payment_transactions';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'payment_terms' AND rowsecurity = true) THEN
        ALTER TABLE payment_terms ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS for payment_terms';
    ELSE
        RAISE NOTICE 'RLS already enabled for payment_terms';
    END IF;
END $$;

-- 7. Create function to automatically set payment terms based on order amount (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'set_payment_terms') THEN
        CREATE FUNCTION set_payment_terms()
        RETURNS TRIGGER AS $func$
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
        $func$ LANGUAGE plpgsql;
        RAISE NOTICE 'Created set_payment_terms function';
    ELSE
        RAISE NOTICE 'set_payment_terms function already exists';
    END IF;
END $$;

-- 8. Create trigger to automatically set payment terms when PO is created (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trigger_set_payment_terms') THEN
        CREATE TRIGGER trigger_set_payment_terms
            BEFORE INSERT ON purchase_orders
            FOR EACH ROW
            EXECUTE FUNCTION set_payment_terms();
        RAISE NOTICE 'Created trigger_set_payment_terms trigger';
    ELSE
        RAISE NOTICE 'trigger_set_payment_terms trigger already exists';
    END IF;
END $$;

-- 9. Create function to update payment status (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'update_payment_status') THEN
        CREATE FUNCTION update_payment_status()
        RETURNS TRIGGER AS $func2$
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
        $func2$ LANGUAGE plpgsql;
        RAISE NOTICE 'Created update_payment_status function';
    ELSE
        RAISE NOTICE 'update_payment_status function already exists';
    END IF;
END $$;

-- 10. Create trigger to update PO payment status (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trigger_update_payment_status') THEN
        CREATE TRIGGER trigger_update_payment_status
            AFTER UPDATE ON payment_transactions
            FOR EACH ROW
            EXECUTE FUNCTION update_payment_status();
        RAISE NOTICE 'Created trigger_update_payment_status trigger';
    ELSE
        RAISE NOTICE 'trigger_update_payment_status trigger already exists';
    END IF;
END $$;

-- 11. Update existing POs with payment terms (if they don't have them)
DO $$ 
BEGIN
    UPDATE purchase_orders 
    SET 
        payment_terms = CASE 
            WHEN total_amount < 1000 THEN 'immediate'
            WHEN total_amount < 10000 THEN 'net_30'
            ELSE 'net_60'
        END,
        payment_due_date = CASE 
            WHEN total_amount < 1000 THEN CURRENT_DATE
            WHEN total_amount < 10000 THEN CURRENT_DATE + INTERVAL '30 days'
            ELSE CURRENT_DATE + INTERVAL '60 days'
        END
    WHERE payment_terms IS NULL OR payment_due_date IS NULL;
    
    IF FOUND THEN
        RAISE NOTICE 'Updated existing POs with payment terms';
    ELSE
        RAISE NOTICE 'All existing POs already have payment terms';
    END IF;
END $$;

-- Final success message
DO $$ 
BEGIN
    RAISE NOTICE 'Database schema updates completed successfully!';
END $$;
