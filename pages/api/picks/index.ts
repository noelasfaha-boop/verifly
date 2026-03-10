import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET — public, fetch picks for a creator
  if (req.method === 'GET') {
    const { creatorId, sport, result, days, limit = '50' } = req.query;
    if (!creatorId) return res.status(400).json({ error: 'Missing creatorId' });

    const admin = createAdminSupabase();
    let query = admin
      .from('picks')
      .select('*, games(home_team, away_team, status, home_score, away_score)')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (sport && sport !== 'All') query = query.eq('sport', sport);
    if (result && result !== 'All') query = query.eq('result', (result as string).toLowerCase());
    if (days && Number(days) > 0) {
      const cutoff = new Date(Date.now() - Number(days) * 86400000).toISOString();
      query = query.gte('created_at', cutoff);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ data });
  }

  // POST — create a new pick (immutable after creation)
  if (req.method === 'POST') {
    const supabase = createServerSupabase(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      creatorId, sport, league, event, event_id, bet_type, odds,
      stake_units, pick_description, image_url, caption,
    } = req.body;

    if (!pick_description && !image_url) {
      return res.status(400).json({ error: 'Provide pick_description or image_url' });
    }

    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('id', creatorId)
      .eq('user_id', user.id)
      .single();
    if (!creator) return res.status(403).json({ error: 'Forbidden' });

    const { data, error } = await supabase
      .from('picks')
      .insert({
        creator_id: creatorId,
        sport,
        league: league || null,
        event: event || null,
        event_id: event_id || null,
        bet_type,
        odds: odds || null,
        stake_units,
        pick_description: pick_description || null,
        image_url: image_url || null,
        caption: caption || null,
        result: 'pending',
        graded_by: event_id ? 'auto' : 'manual',
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ data });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
