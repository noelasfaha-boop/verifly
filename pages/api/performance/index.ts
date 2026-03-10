import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabase(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // Resolve creator id for the authenticated user
  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!creator) return res.status(403).json({ error: 'Not a creator' });

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('performance_entries')
      .select('*')
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ data });
  }

  if (req.method === 'POST') {
    const { title, category, entry_value, exit_value, notes, trading_account_id, opened_at, closed_at } = req.body;

    const entryVal = parseFloat(entry_value);
    const exitVal = exit_value ? parseFloat(exit_value) : null;
    const profit_loss = exitVal !== null ? exitVal - entryVal : null;
    const roi_percent = profit_loss !== null && entryVal ? (profit_loss / entryVal) * 100 : null;
    const verified = !!trading_account_id;

    const { data, error } = await supabase
      .from('performance_entries')
      .insert({
        creator_id: creator.id,
        title,
        category,
        entry_value: entryVal,
        exit_value: exitVal,
        profit_loss,
        roi_percent,
        verified,
        trading_account_id: trading_account_id || null,
        notes: notes || null,
        opened_at: opened_at ?? new Date().toISOString(),
        closed_at: closed_at || null,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ data });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
