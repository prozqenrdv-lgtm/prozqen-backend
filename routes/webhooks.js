import express from 'express';
import logger from '../utils/logger.js';
import { query } from '../config/database.js';

const router = express.Router();

// ==========================================
// POST /webhook/stripe
// Stripe payment webhook
// ==========================================

router.post('/stripe', async (req, res) => {
  try {
    const event = req.body;

    logger.info('Stripe webhook received', { eventType: event.type });

    // TODO: Verify Stripe signature
    // For MVP: skip verification

    switch (event.type) {
      case 'charge.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;

      case 'charge.failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;

      default:
        logger.info('Unhandled event type:', event.type);
    }

    res.json({ received: true });

  } catch (error) {
    logger.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ==========================================
// POST /webhook/calendly
// Calendly event webhook
// ==========================================

router.post('/calendly', async (req, res) => {
  try {
    const event = req.body;

    logger.info('Calendly webhook received', { eventType: event.event });

    // TODO: Implement Calendly webhook handling
    // For MVP: placeholder

    res.json({ received: true });

  } catch (error) {
    logger.error('Calendly webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ==========================================
// HELPERS
// ==========================================

async function handlePaymentSuccess(charge) {
  try {
    logger.info('✅ Payment successful', {
      chargeId: charge.id,
      amount: charge.amount
    });

    // TODO: Update user subscription in database
    // UPDATE users SET subscription_active = true WHERE stripe_customer_id = $1
  } catch (error) {
    logger.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(charge) {
  try {
    logger.error('❌ Payment failed', {
      chargeId: charge.id,
      amount: charge.amount,
      reason: charge.failure_message
    });

    // TODO: Notify user of failed payment
  } catch (error) {
    logger.error('Error handling payment failure:', error);
  }
}

async function handleSubscriptionUpdate(subscription) {
  try {
    logger.info('Subscription updated', {
      customerId: subscription.customer,
      status: subscription.status
    });

    // TODO: Update subscription status in database
  } catch (error) {
    logger.error('Error handling subscription update:', error);
  }
}

export default router;
