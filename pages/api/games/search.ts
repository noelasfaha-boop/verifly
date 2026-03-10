import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminSupabase } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const { sport, q } = req.query as { sport?: string; q?: string };
  const admin = createAdminSupabase();

  let query = admin
    .from('games')
    .select('id, sport, league, home_team, away_team, start_time, status, home_score, away_score')
    .in('status', ['scheduled', 'live'])
    .order('start_time', { ascending: true })
    .limit(10);

  if (sport && sport !== 'All') query = query.eq('sport', sport);

  if (q && q.length >= 2) {
    query = query.or(
      `home_team.ilike.%${q}%,away_team.ilike.%${q}%`
    );
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data: data ?? [] });
}
