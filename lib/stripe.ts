import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

/** Create or retrieve a Stripe customer for a user. */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  existingCustomerId?: string | null
): Promise<string> {
  if (existingCustomerId) {
    return existingCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  return customer.id;
}

/** Build a Stripe Checkout Session for a creator subscription. */
export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  metadata,
}: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: { metadata: metadata ?? {} },
  });
}

/** Create a Stripe Product + Price for a creator. */
export async function createCreatorProduct(
  creatorUsername: string,
  priceInDollars: number
) {
  const product = await stripe.products.create({
    name: `${creatorUsername} — Verifly Subscription`,
    metadata: { platform: 'verifly' },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(priceInDollars * 100),
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  return { product, price };
}
