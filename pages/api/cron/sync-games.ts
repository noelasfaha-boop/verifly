import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminSupabase } from '@/lib/supabaseServer';
import { ESPN_LEAGUES, fetchScoreboard, parseEspnEvent } from '@/lib/espn';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const admin = createAdminSupabase();
  let synced = 0;
  const errors: string[] = [];

  for (const [sportKey, { sport, league }] of Object.entries(ESPN_LEAGUES)) {
    try {
      const events = await fetchScoreboard(sport, league);

      for (const event of events) {
        const parsed = parseEspnEvent(event, sportKey, league);

        const { error } = await admin
          .from('games')
          .upsert(
            {
              espn_event_id: parsed.espn_event_id,
              sport: parsed.sport,
              league: parsed.league,
              home_team: parsed.home_team,
              away_team: parsed.away_team,
              start_time: parsed.start_time,
              status: parsed.status,
              home_score: parsed.home_score ?? null,
              away_score: parsed.away_score ?? null,
              raw_espn: parsed.raw_espn,
              last_synced: new Date().toISOString(),
            },
            { onConflict: 'espn_event_id' }
          );

        if (error) errors.push(`${sportKey}/${event.id}: ${error.message}`);
        else synced++;
      }
    } catch (err: any) {
      errors.push(`${sportKey}: ${err.message}`);
    }
  }

  return res.json({ synced, errors });
}
