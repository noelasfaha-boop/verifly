import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const supabase = createServerSupabase(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { creatorId, pickId, ext = 'jpg' } = req.body;
  if (!creatorId || !pickId) return res.status(400).json({ error: 'Missing creatorId or pickId' });

  // Verify creator owns the creatorId
  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('id', creatorId)
    .eq('user_id', user.id)
    .single();
  if (!creator) return res.status(403).json({ error: 'Forbidden' });

  const admin = createAdminSupabase();
  const path = `${creatorId}/${pickId}.${ext}`;

  const { data, error } = await admin.storage
    .from('pick-images')
    .createSignedUploadUrl(path);

  if (error) return res.status(500).json({ error: error.message });

  const { data: { publicUrl } } = admin.storage
    .from('pick-images')
    .getPublicUrl(path);

  return res.json({ signedUrl: data.signedUrl, publicUrl, path });
}
