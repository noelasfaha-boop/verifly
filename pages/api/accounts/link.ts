import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase } from '@/lib/supabaseServer';
import { encrypt } from '@/lib/encryption';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const supabase = createServerSupabase(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { creatorId, platform, apiKey, apiSecret, accountIdentifier } = req.body;
  if (!creatorId || !platform) return res.status(400).json({ error: 'Missing creatorId or platform' });

  // Verify the creator belongs to the authenticated user
  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('id', creatorId)
    .eq('user_id', user.id)
    .single();
  if (!creator) return res.status(403).json({ error: 'Forbidden' });

  // Encrypt the token before storage
  let encryptedToken: string | null = null;
  if (apiKey) {
    const combined = apiSecret ? `${apiKey}:${apiSecret}` : apiKey;
    encryptedToken = encrypt(combined);
  }

  const { data, error } = await supabase
    .from('trading_accounts')
    .insert({
      creator_id: creatorId,
      platform_name: platform,
      api_token_encrypted: encryptedToken,
      account_identifier: accountIdentifier || platform,
      is_active: true,
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json({ data: { ...data, api_token_encrypted: undefined } });
}
