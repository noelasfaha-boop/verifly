import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  const supabase = createServerSupabase(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // Verify creator owns this pick
  const { data: pick } = await supabase
    .from('picks')
    .select('creator_id, creators!inner(user_id)')
    .eq('id', id)
    .single();

  if (!pick) return res.status(404).json({ error: 'Pick not found' });
  if ((pick as any).creators.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'PATCH') {
    const { result, profit_loss, settled_at } = req.body;
    const { data, error } = await supabase
      .from('picks')
      .update({ result, profit_loss, settled_at })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ data });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('picks').delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', ['PATCH', 'DELETE']);
  res.status(405).end();
}
