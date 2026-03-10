import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  const supabase = createServerSupabase(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!creator) return res.status(403).json({ error: 'Not a creator' });

  if (req.method === 'PATCH') {
    const { exit_value, closed_at, notes } = req.body;
    const exitVal = exit_value ? parseFloat(exit_value) : null;

    // Fetch current entry to compute P&L
    const { data: existing } = await supabase
      .from('performance_entries')
      .select('entry_value')
      .eq('id', id)
      .eq('creator_id', creator.id)
      .single();

    const profit_loss = exitVal !== null && existing ? exitVal - existing.entry_value : null;
    const roi_percent = profit_loss !== null && existing?.entry_value
      ? (profit_loss / existing.entry_value) * 100
      : null;

    const { data, error } = await supabase
      .from('performance_entries')
      .update({ exit_value: exitVal, closed_at, notes, profit_loss, roi_percent })
      .eq('id', id)
      .eq('creator_id', creator.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ data });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('performance_entries')
      .delete()
      .eq('id', id)
      .eq('creator_id', creator.id);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', ['PATCH', 'DELETE']);
  res.status(405).end();
}
