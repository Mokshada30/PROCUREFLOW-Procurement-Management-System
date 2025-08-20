const { createClient } = require('@supabase/supabase-js');

class DatabaseSetup {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );
  }

  async checkSetupStatus() {
    try {
      const { data, error } = await this.supabase
        .from('app_setup_status')
        .select('*')
        .eq('setup_name', 'payment_schema_v1')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.log('Setup status table not found, will create it');
        return false;
      }

      return data && data.completed_at;
    } catch (error) {
      console.log('Setup status check failed:', error.message);
      return false;
    }
  }

  async markSetupComplete() {
    try {
      const { error } = await this.supabase
        .from('app_setup_status')
        .upsert({
          setup_name: 'payment_schema_v1',
          completed_at: new Date().toISOString(),
          version: '1.0'
        });

      if (error) {
        console.error('Failed to mark setup complete:', error.message);
        return false;
      }

      console.log('✅ Payment schema setup marked as complete');
      return true;
    } catch (error) {
      console.error('Failed to mark setup complete:', error.message);
      return false;
    }
  }

  async checkPaymentSchema() {
    try {
      console.log('🔄 Checking payment schema status...');

      // 1. Try to create setup tracking table by inserting a record
      try {
        const { error: statusError } = await this.supabase
          .from('app_setup_status')
          .insert({
            setup_name: 'payment_schema_v1',
            completed_at: new Date().toISOString(),
            version: '1.0'
          });
        
        if (statusError && statusError.code === '42P01') {
          console.log('app_setup_status table not found - manual setup required');
          return false;
        }
      } catch (error) {
        console.log('app_setup_status table not available');
        return false;
      }

      // 2. Check if payment_transactions table exists
      try {
        const { error: transError } = await this.supabase
          .from('payment_transactions')
          .select('*')
          .limit(1);
        
        if (transError && transError.code === '42P01') {
          console.log('Payment transactions table not found - manual setup required');
          return false;
        }
      } catch (error) {
        console.log('Payment transactions table not available');
        return false;
      }

      // 3. Check if payment columns exist in purchase_orders
      try {
        const { data: poData, error: poError } = await this.supabase
          .from('purchase_orders')
          .select('payment_status, payment_terms, payment_due_date, payment_completed_at')
          .limit(1);
        
        if (poError) {
          console.log('Payment columns not found in purchase_orders - manual setup required');
          return false;
        }
      } catch (error) {
        console.log('Payment columns not available in purchase_orders');
        return false;
      }

      console.log('✅ Payment schema appears to be set up correctly');
      return true;

    } catch (error) {
      console.error('❌ Payment schema check failed:', error.message);
      return false;
    }
  }

  async setup() {
    try {
      console.log('🚀 Starting database setup...');

      // Check if setup is already complete
      const isSetupComplete = await this.checkSetupStatus();
      if (isSetupComplete) {
        console.log('✅ Database setup already completed');
        return true;
      }

      // Check the current schema status
      const schemaExists = await this.checkPaymentSchema();
      if (schemaExists) {
        // Mark setup as complete
        await this.markSetupComplete();
        console.log('🎉 Database setup completed successfully!');
        return true;
      } else {
        console.log('⚠️  Payment schema not found');
        console.log('📋 To complete setup, run the following SQL in your Supabase database:');
        console.log('   File: procurement-backend/database-schema-updates-safe.sql');
        console.log('   Or visit: https://supabase.com/dashboard/project/[YOUR_PROJECT]/sql');
        console.log('');
        console.log('🔄 The app will continue to work, but payment tracking will be limited');
        return false;
      }

    } catch (error) {
      console.error('❌ Database setup error:', error.message);
      return false;
    }
  }
}

module.exports = DatabaseSetup;
