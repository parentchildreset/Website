/**
 * Parent Reset — Stripe Checkout Session Creator
 * Netlify Serverless Function
 *
 * Environment variables required in Netlify dashboard:
 *   STRIPE_SECRET_KEY     — your Stripe secret key (sk_live_... or sk_test_...)
 *   SESSION_PRICE_CENTS   — session price in SGD cents (e.g. 18000 = SGD 180)
 *   URL                   — set automatically by Netlify (your site URL)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ALLOWED_ORIGINS = [
  process.env.URL,
  'http://localhost:8888',  // netlify dev
  'http://localhost:3000',
].filter(Boolean);

exports.handler = async (event) => {
  // ── CORS pre-flight ──
  const origin = event.headers.origin || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // ── Guard: Stripe key must be present ──
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY environment variable is not set.');
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Payment system not configured. Please contact sharon@parentreset.com' }),
    };
  }

  try {
    const {
      parentName   = '',
      childName    = '',
      email        = '',
      phone        = '',
      childAge     = '',
      frictionPoint = '',
    } = JSON.parse(event.body || '{}');

    // Validate required fields server-side
    if (!email || !parentName) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Name and email are required.' }),
      };
    }

    const priceInCents = parseInt(process.env.SESSION_PRICE_CENTS, 10) || 18000;
    const siteUrl      = process.env.URL || 'https://parentreset.netlify.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,

      line_items: [
        {
          price_data: {
            currency: 'sgd',
            product_data: {
              name: 'Parent Reset — 60-Minute Coaching Session',
              description: 'With Sharon · Google Meet · Schedule your time after payment',
              images: [
                'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=80',
              ],
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],

      mode: 'payment',

      success_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl}/#booking`,

      // Capture custom fields in metadata (Stripe limit: 500 chars per value)
      metadata: {
        parentName:    parentName.substring(0, 200),
        childName:     childName.substring(0, 200),
        phone:         phone.substring(0, 50),
        childAge:      String(childAge),
        frictionPoint: frictionPoint.substring(0, 499),
      },

      // Pre-fill customer name on Stripe page
      billing_address_collection: 'auto',

      // Optional: send Stripe receipt email
      payment_intent_data: {
        description: `Parent Reset session — ${parentName} (child: ${childName}, age ${childAge})`,
        receipt_email: email,
      },
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ url: session.url }),
    };

  } catch (err) {
    console.error('Stripe checkout error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: err.message || 'An unexpected error occurred. Please try again.',
      }),
    };
  }
};
