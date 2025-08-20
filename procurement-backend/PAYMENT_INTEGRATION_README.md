# Payment Integration for Procurement System

## Overview
This document explains the payment integration system that has been added to your procurement backend. The system integrates with Stripe to handle payments for purchase orders after goods/services are received.

## Architecture

### Payment Flow
1. **Employee submits request** → **Team Lead approves** → **Procurement Officer processes** → **Purchase Order created** → **Items received** → **Payment initiated** → **Payment completed**

### Key Components
- **Payment Transactions Table**: Tracks all payment activities
- **Payment Terms**: Configurable terms based on order size (Immediate, Net 30, Net 60)
- **Stripe Integration**: Handles credit/debit card payments
- **Payment Status Tracking**: Monitors payment status throughout the process

## Database Schema Updates

### New Tables
1. **`payment_transactions`**: Stores payment transaction details
2. **`payment_terms`**: Configurable payment terms based on order amounts

### Updated Tables
1. **`purchase_orders`**: Added payment-related fields

### Automatic Triggers
- **Payment Terms**: Automatically set based on order amount
- **Payment Status**: Automatically updated when payments are completed

## API Endpoints

### Stripe Payment Endpoints
- `POST /api/stripe/create-payment-intent`: Creates Stripe payment intent
- `POST /api/stripe/confirm-payment`: Confirms payment completion
- `GET /api/stripe/payment-methods/:customerId`: Gets saved payment methods

## Setup Instructions

### 1. Environment Variables
Add these to your `.env` file:
```env
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
```

### 2. Database Setup
Run the SQL commands in `database-schema-updates.sql` to create the necessary tables and triggers.

### 3. Frontend Integration
The payment interface is available at `/dashboard/payments` for procurement officers and admins.

## Payment Terms Logic

### Automatic Assignment
- **$0 - $999.99**: Immediate payment
- **$1,000 - $9,999.99**: Net 30 days
- **$10,000+**: Net 60 days

### Customization
You can modify the `payment_terms` table to adjust these thresholds and add new terms.

## Security Features

### Role-Based Access
- Only **Procurement Officers** and **Admins** can access payment functions
- Row-level security enabled on payment tables

### Stripe Security
- Payment intents created server-side
- Client secrets never exposed in frontend
- All payment data encrypted through Stripe

## Usage

### For Procurement Officers

1. **Navigate to Payments**: Go to `/dashboard/payments`
2. **View Pending Payments**: See all purchase orders awaiting payment
3. **Initiate Payment**: Click "Pay Now" for any order
4. **Select Payment Method**: Choose from available options
5. **Complete Payment**: Process through Stripe

### Payment Status Tracking

- **Pending**: Payment not yet initiated
- **Processing**: Payment in progress
- **Completed**: Payment successful
- **Failed**: Payment failed
- **Refunded**: Payment refunded

## Testing

### Test Payment Flow
1. Create a test purchase order
2. Mark items as received
3. Navigate to payments page
4. Initiate test payment
5. Verify payment completion

### Stripe Test Mode
Use Stripe test cards for development:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002

## Monitoring and Reporting

### Payment Analytics
- Track payment completion rates
- Monitor payment terms compliance
- Generate payment reports

### Error Handling
- Failed payment notifications
- Retry mechanisms for failed payments
- Comprehensive error logging

## Future Enhancements

### Planned Features
1. **Recurring Payments**: For subscription-based services
2. **Multi-Currency Support**: Enhanced international payment handling
3. **Payment Scheduling**: Automated payment scheduling
4. **Vendor Portal**: Self-service payment status for vendors
5. **Advanced Analytics**: Payment performance metrics

### Integration Possibilities
1. **Accounting Systems**: QuickBooks, Xero integration
2. **Bank APIs**: Direct bank transfer integration
3. **Mobile Payments**: Apple Pay, Google Pay support

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS middleware is enabled
2. **Stripe Key Issues**: Verify environment variables are set correctly
3. **Database Errors**: Check if schema updates were applied
4. **Payment Failures**: Review Stripe dashboard for error details

### Support
- Check Stripe dashboard for payment status
- Review server logs for backend errors
- Verify database connections and permissions

## Security Best Practices

1. **Never expose Stripe secret keys** in frontend code
2. **Always validate payment amounts** server-side
3. **Implement proper error handling** for failed payments
4. **Log all payment activities** for audit purposes
5. **Use HTTPS** for all payment communications

## Compliance

### PCI DSS
- Stripe handles PCI compliance for card data
- No sensitive payment data stored in your database
- Secure payment processing through Stripe's infrastructure

### Audit Trail
- Complete payment transaction history
- User activity logging
- Payment status tracking throughout the process
