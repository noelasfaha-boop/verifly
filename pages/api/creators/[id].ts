import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from('creator_stats')
      .select('*')
      .eq('creator_id', id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Creator not found' });
    return res.json({ data });
  }

  if (req.method === 'PATCH') {
    const supabase = createServerSupabase(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { description, subscription_price, discord_server_id, category } = req.body;
    const { data, error } = await supabase
      .from('creators')
      .update({ description, subscription_price, discord_server_id, category })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ data });
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  res.status(405).end();
}
