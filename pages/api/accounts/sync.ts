import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase } from '@/lib/supabaseServer';
import { decrypt } from '@/lib/encryption';
import { syncPlatform } from '@/lib/platformSync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const supabase = createServerSupabase(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { accountId } = req.body;
  if (!accountId) return res.status(400).json({ error: 'Missing accountId' });

  // Fetch trading account (verify ownership via creator)
  const { data: account } = await supabase
    .from('trading_accounts')
    .select('*, creators!inner(user_id)')
    .eq('id', accountId)
    .single();

  if (!account) return res.status(404).json({ error: 'Account not found' });
  if ((account as any).creators.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

  // Decrypt the token
  let token = '';
  if (account.api_token_encrypted) {
    try {
      token = decrypt(account.api_token_encrypted);
    } catch {
      return res.status(500).json({ error: 'Failed to decrypt API token' });
    }
  }

  // Pull trades from platform
  const trades = await syncPlatform(account.platform_name, token);

  // Import new entries
  let imported = 0;
  for (const trade of trades) {
    const { error } = await supabase.from('performance_entries').insert({
      creator_id: account.creator_id,
      title: trade.symbol,
      category: account.platform_name === 'draftkings' ? 'bet' : 'trade',
      entry_value: trade.entryValue,
      exit_value: trade.exitValue,
      profit_loss: trade.profitLoss,
      roi_percent: trade.roiPercent,
      verified: trade.verified,
      trading_account_id: accountId,
      opened_at: trade.openedAt,
      closed_at: trade.closedAt,
    });
    if (!error) imported++;
  }

  // Update last_sync timestamp
  await supabase
    .from('trading_accounts')
    .update({ last_sync: new Date().toISOString() })
    .eq('id', accountId);

  return res.json({ imported, total: trades.length });
}
