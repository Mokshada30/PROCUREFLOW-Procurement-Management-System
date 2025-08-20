# Procurement Backend

A Node.js/Express.js backend for the procurement system with integrated Stripe payment processing.

## Features

- ✅ **Stripe Payment Integration** - Process payments for purchase orders
- ✅ **Automated Database Setup** - Schema updates run automatically on startup
- ✅ **Payment Terms Management** - Automatic assignment based on order amounts
- ✅ **RESTful API** - Clean endpoints for payment processing
- ✅ **CORS Enabled** - Frontend-backend communication ready

## Quick Start

### 1. Environment Setup

Create a `.env` file in the root directory:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Server

```bash
npm start
# or
node index.js
```

## Automated Database Setup

The backend automatically checks and sets up the required database schema on startup:

### What Happens Automatically:

1. **Startup Check** - Server checks if payment schema exists
2. **Status Tracking** - Uses `app_setup_status` table to track setup completion
3. **Schema Validation** - Verifies all required tables and columns exist
4. **User Guidance** - Provides clear instructions if manual setup is needed

### Setup Status Messages:

```
🚀 Starting database setup...
🔄 Checking payment schema status...
✅ Payment schema appears to be set up correctly
🎉 Database setup completed successfully!
```

### If Manual Setup Required:

```
⚠️  Payment schema not found
📋 To complete setup, run the following SQL in your Supabase database:
   File: procurement-backend/database-schema-updates-safe.sql
   Or visit: https://supabase.com/dashboard/project/[YOUR_PROJECT]/sql

🔄 The app will continue to work, but payment tracking will be limited
```

## API Endpoints

### Stripe Payment Endpoints

- `POST /api/stripe/create-payment-intent` - Create payment intent
- `POST /api/stripe/confirm-payment` - Confirm payment completion
- `GET /api/stripe/payment-methods` - Get available payment methods

### Payment Intent Request Body

```json
{
  "purchase_order_id": "uuid-here",
  "amount": 199.99,
  "currency": "USD",
  "payment_terms": "immediate"
}
```

## Database Schema

The system automatically creates/checks for:

- **`payment_transactions`** - Payment history and tracking
- **`payment_terms`** - Configurable payment terms (Immediate, Net 30, Net 60)
- **Payment columns** in `purchase_orders` table
- **Indexes** for optimal performance

## Payment Terms Logic

- **Immediate** (< $1,000): Pay immediately
- **Net 30** ($1,000 - $9,999): Pay within 30 days
- **Net 60** ($10,000+): Pay within 60 days

## Deployment

### Environment Variables

For production, ensure these are set:

```bash
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
STRIPE_SECRET_KEY=sk_live_...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup

1. **First deployment**: Run `database-schema-updates-safe.sql` manually
2. **Subsequent deployments**: Schema updates run automatically
3. **Status tracking**: Prevents duplicate setup runs

## Troubleshooting

### Common Issues

1. **"Payment schema not found"**
   - Run the SQL schema updates manually
   - Check Supabase connection and permissions

2. **"Setup status table not found"**
   - This is normal for first-time setup
   - Run schema updates to create required tables

3. **Stripe integration errors**
   - Verify `STRIPE_SECRET_KEY` is correct
   - Check Stripe account status and webhook configuration

### Manual Schema Update

If automated setup fails, run this in Supabase SQL Editor:

```sql
-- Copy content from database-schema-updates-safe.sql
-- This will create all required tables and columns
```

## Development

### Local Development

```bash
npm run dev  # If you have nodemon installed
# or
node index.js
```

### Testing

Use the included `test-payment.html` file to test payment endpoints:

```bash
# Open in browser
open test-payment.html
```

## Security Notes

- ✅ **Environment variables** for sensitive data
- ✅ **CORS configuration** for frontend communication
- ✅ **Input validation** on payment endpoints
- ✅ **Supabase RLS** for database security

## Support

For issues or questions:
1. Check the console logs for setup status
2. Verify environment variables are correct
3. Run manual schema updates if needed
4. Check Supabase dashboard for database status
