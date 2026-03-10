import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const admin = createAdminSupabase();
    const { category, sort = 'avg_roi', limit = '20' } = req.query;

    let query = admin.from('creator_stats').select('*');
    if (category && category !== 'all') query = query.eq('category', category);
    query = query.order(sort as string, { ascending: false }).limit(parseInt(limit as string));

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ data });
  }

  if (req.method === 'POST') {
    const supabase = createServerSupabase(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { category, description, subscription_price, discord_server_id } = req.body;
    const { data, error } = await supabase.from('creators').insert({
      user_id: user.id,
      category,
      description,
      subscription_price,
      discord_server_id,
    }).select().single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ data });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
