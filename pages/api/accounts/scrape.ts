import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const supabase = createServerSupabase(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { creatorId, platform, username, password } = req.body;
  if (!creatorId || !platform || !username || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Verify ownership
  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('id', creatorId)
    .eq('user_id', user.id)
    .single();
  if (!creator) return res.status(403).json({ error: 'Forbidden' });

  const scraperUrl = process.env.SCRAPER_SERVICE_URL;
  const scraperSecret = process.env.SCRAPER_SECRET;

  if (!scraperUrl) {
    return res.status(503).json({ error: 'Scraper service not configured. Set SCRAPER_SERVICE_URL in env.' });
  }

  // Call the scraper service
  let bets: any[] = [];
  try {
    const scraperRes = await fetch(`${scraperUrl}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-scraper-secret': scraperSecret ?? '',
      },
      body: JSON.stringify({ platform, username, password }),
    });

    if (!scraperRes.ok) {
      const err = await scraperRes.json();
      return res.status(scraperRes.status).json({ error: err.error ?? 'Scraper failed' });
    }

    const data = await scraperRes.json();
    bets = data.bets ?? [];
  } catch (err: any) {
    return res.status(500).json({ error: `Could not reach scraper service: ${err.message}` });
  }

  if (bets.length === 0) {
    return res.json({ imported: 0, message: 'No bets found' });
  }

  // Create or find the trading account record
  const { data: existingAccount } = await supabase
    .from('trading_accounts')
    .select('id')
    .eq('creator_id', creatorId)
    .eq('platform_name', platform)
    .single();

  let accountId = existingAccount?.id;
  if (!accountId) {
    const { data: newAccount } = await supabase
      .from('trading_accounts')
      .insert({
        creator_id: creatorId,
        platform_name: platform,
        account_identifier: username,
        is_active: true,
      })
      .select()
      .single();
    accountId = newAccount?.id;
  }

  // Import bets as performance entries
  let imported = 0;
  for (const bet of bets) {
    const { error } = await supabase.from('performance_entries').insert({
      creator_id: creatorId,
      title: bet.title,
      category: 'bet',
      entry_value: bet.entryValue,
      exit_value: bet.exitValue,
      profit_loss: bet.profitLoss,
      roi_percent: bet.roiPercent,
      verified: true,
      trading_account_id: accountId ?? null,
      opened_at: bet.openedAt,
      closed_at: bet.closedAt,
    });
    if (!error) imported++;
  }

  // Update last_sync
  if (accountId) {
    await supabase
      .from('trading_accounts')
      .update({ last_sync: new Date().toISOString(), account_identifier: username })
      .eq('id', accountId);
  }

  return res.json({ imported, total: bets.length });
}
