import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabaseServer';
import { stripe, getOrCreateStripeCustomer, createCheckoutSession } from '@/lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const supabase = createServerSupabase(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { creatorId } = req.body;
  if (!creatorId) return res.status(400).json({ error: 'Missing creatorId' });

  const admin = createAdminSupabase();

  // Get creator + stripe price
  const { data: creator } = await admin
    .from('creators')
    .select('id, stripe_price_id, stripe_product_id, subscription_price, users(username)')
    .eq('id', creatorId)
    .single();

  if (!creator) return res.status(404).json({ error: 'Creator not found' });

  let priceId = creator.stripe_price_id;

  // Create Stripe product/price if not yet done
  if (!priceId) {
    const username = (creator as any).users?.username ?? 'Creator';
    const { product, price } = await (await import('@/lib/stripe')).createCreatorProduct(
      username,
      creator.subscription_price
    );
    priceId = price.id;
    await admin
      .from('creators')
      .update({ stripe_price_id: price.id, stripe_product_id: product.id })
      .eq('id', creatorId);
  }

  // Get or create Stripe customer
  const { data: profile } = await admin.from('users').select('email').eq('id', user.id).single();

  // Check for existing stripe customer id in subscriptions
  const { data: existingSub } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  const customerId = await getOrCreateStripeCustomer(
    user.id,
    profile?.email ?? user.email!,
    existingSub?.stripe_customer_id
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const session = await createCheckoutSession({
    customerId,
    priceId,
    successUrl: `${appUrl}/checkout/success?creator=${(creator as any).users?.username ?? creatorId}`,
    cancelUrl: `${appUrl}/creator/${(creator as any).users?.username ?? creatorId}`,
    metadata: {
      user_id: user.id,
      creator_id: creatorId,
    },
  });

  return res.json({ url: session.url });
}
