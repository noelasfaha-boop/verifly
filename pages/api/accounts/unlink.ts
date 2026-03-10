import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end();
  }

  const supabase = createServerSupabase(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { accountId } = req.body;
  if (!accountId) return res.status(400).json({ error: 'Missing accountId' });

  const { data: account } = await supabase
    .from('trading_accounts')
    .select('*, creators!inner(user_id)')
    .eq('id', accountId)
    .single();

  if (!account) return res.status(404).json({ error: 'Not found' });
  if ((account as any).creators.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

  // Soft-delete: mark as inactive and wipe the token
  const { error } = await supabase
    .from('trading_accounts')
    .update({ is_active: false, api_token_encrypted: null })
    .eq('id', accountId);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(204).end();
}
