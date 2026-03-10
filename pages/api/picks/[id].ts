import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  // GET — fetch a single pick
  if (req.method === 'GET') {
    const supabase = createServerSupabase(req, res);
    const { data, error } = await supabase
      .from('picks')
      .select('*, games(home_team, away_team, status, home_score, away_score)')
      .eq('id', id)
      .single();
    if (error) return res.status(404).json({ error: 'Pick not found' });
    return res.json({ data });
  }

  // Manual settle — only allowed for picks without event_id (not auto-graded)
  if (req.method === 'PATCH') {
    const supabase = createServerSupabase(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: pick } = await supabase
      .from('picks')
      .select('creator_id, event_id, creators!inner(user_id)')
      .eq('id', id)
      .single();

    if (!pick) return res.status(404).json({ error: 'Pick not found' });
    if ((pick as any).creators.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

    if (pick.event_id) {
      return res.status(400).json({ error: 'This pick is linked to a game and will be auto-graded.' });
    }

    const { result, profit_loss, settled_at } = req.body;
    const { data, error } = await supabase
      .from('picks')
      .update({ result, profit_loss, settled_at, graded_by: 'manual' })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ data });
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  res.status(405).end();
}
