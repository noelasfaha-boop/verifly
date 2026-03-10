import type { NextApiRequest, NextApiResponse } from 'next';
import { Readable } from 'stream';

async function buffer(readable: Readable) {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}
import { stripe } from '@/lib/stripe';
import { createAdminSupabase } from '@/lib/supabaseServer';
import type Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event: Stripe.Event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig!, webhookSecret);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  const admin = createAdminSupabase();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { user_id, creator_id } = session.metadata ?? {};
      if (!user_id || !creator_id) break;

      const subscriptionId = session.subscription as string;
      const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);

      await admin.from('subscriptions').upsert({
        user_id,
        creator_id,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: session.customer as string,
        status: 'active',
        current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
      }, { onConflict: 'user_id,creator_id' });

      console.log(`[Webhook] New subscription: user=${user_id} creator=${creator_id}`);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const { user_id, creator_id } = sub.metadata;
      if (!user_id || !creator_id) break;

      await admin.from('subscriptions').update({
        status: sub.status as string,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }).eq('stripe_subscription_id', sub.id);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await admin.from('subscriptions').update({ status: 'canceled' })
        .eq('stripe_subscription_id', sub.id);
      break;
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
  }

  res.json({ received: true });
}
