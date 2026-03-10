import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminSupabase } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const { sort = 'avg_roi', category, limit = '50' } = req.query;
  const admin = createAdminSupabase();

  const validSorts = ['avg_roi', 'total_profit', 'win_rate', 'subscriber_count'];
  const sortField = validSorts.includes(sort as string) ? (sort as string) : 'avg_roi';

  let query = admin.from('creator_stats').select('*');
  if (category && category !== 'all') query = query.eq('category', category);
  query = query.order(sortField, { ascending: false }).limit(parseInt(limit as string));

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return res.json({ data });
}
