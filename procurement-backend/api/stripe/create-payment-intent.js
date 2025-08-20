const express = require('express');
const Stripe = require('stripe');
const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

// Create payment intent for a specific purchase order
router.post('/create-payment-intent', async (req, res) => {
  const { purchase_order_id, amount, currency, payment_terms } = req.body;

  if (!purchase_order_id || !amount || !currency) {
    return res.status(400).json({ 
      error: 'Purchase order ID, amount, and currency are required.' 
    });
  }

  try {
    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        purchase_order_id: purchase_order_id,
        payment_terms: payment_terms || 'immediate'
      }
    });

    res.status(200).json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: currency
    });
  } catch (error) {
    console.error("Error creating Payment Intent:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment completion
router.post('/confirm-payment', async (req, res) => {
  const { payment_intent_id, purchase_order_id, amount, currency } = req.body;

  if (!payment_intent_id || !purchase_order_id) {
    return res.status(400).json({ 
      error: 'Payment intent ID and purchase order ID are required.' 
    });
  }

  try {
    // Retrieve the payment intent from Stripe to confirm status
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    if (paymentIntent.status === 'succeeded') {
      res.status(200).json({ 
        success: true,
        message: 'Payment confirmed successfully',
        paymentIntent: paymentIntent
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: `Payment not completed. Status: ${paymentIntent.status}`,
        paymentIntent: paymentIntent
      });
    }
  } catch (error) {
    console.error("Error confirming payment:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get payment methods for a customer (if you implement customer management)
router.get('/payment-methods/:customerId', async (req, res) => {
  const { customerId } = req.params;

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    res.status(200).json({ paymentMethods: paymentMethods.data });
  } catch (error) {
    console.error("Error fetching payment methods:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
