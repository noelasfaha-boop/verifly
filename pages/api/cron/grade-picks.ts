import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminSupabase } from '@/lib/supabaseServer';
import { ESPN_LEAGUES, fetchScoreboard, parseEspnEvent } from '@/lib/espn';
import { gradePick } from '@/lib/grader';

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
  let graded = 0;
  const errors: string[] = [];

  // Get all games not yet final
  const { data: activeGames } = await admin
    .from('games')
    .select('*')
    .in('status', ['scheduled', 'live']);

  if (!activeGames?.length) return res.json({ graded: 0, message: 'No active games' });

  // Group by sport to batch ESPN calls
  const bySport = activeGames.reduce<Record<string, typeof activeGames>>((acc, g) => {
    acc[g.sport] = acc[g.sport] ?? [];
    acc[g.sport].push(g);
    return acc;
  }, {});

  for (const [sportKey, games] of Object.entries(bySport)) {
    const espnLeague = ESPN_LEAGUES[sportKey];
    if (!espnLeague) continue;

    let events;
    try {
      events = await fetchScoreboard(espnLeague.sport, espnLeague.league);
    } catch (err: any) {
      errors.push(`ESPN fetch ${sportKey}: ${err.message}`);
      continue;
    }

    const eventMap = new Map(events.map(e => [e.id, e]));

    for (const game of games) {
      if (!game.espn_event_id) continue;
      const espnEvent = eventMap.get(game.espn_event_id);
      if (!espnEvent) continue;

      const parsed = parseEspnEvent(espnEvent, sportKey, espnLeague.league);

      // Update game record
      await admin.from('games').update({
        status: parsed.status,
        home_score: parsed.home_score ?? null,
        away_score: parsed.away_score ?? null,
        last_synced: new Date().toISOString(),
      }).eq('id', game.id);

      // Only grade picks when game is final
      if (parsed.status !== 'final') continue;
      if (parsed.home_score == null || parsed.away_score == null) continue;

      // Load pending picks linked to this game
      const { data: picks } = await admin
        .from('picks')
        .select('*')
        .eq('event_id', game.id)
        .eq('result', 'pending');

      if (!picks?.length) continue;

      const gameResult = {
        home_team: parsed.home_team,
        away_team: parsed.away_team,
        home_score: parsed.home_score,
        away_score: parsed.away_score,
      };

      for (const pick of picks) {
        const grade = gradePick(pick as any, gameResult);
        if (grade.result === 'pending') continue; // can't auto-grade (image/parlay/prop)

        const { error } = await admin.from('picks').update({
          result: grade.result,
          profit_loss: grade.profit_loss,
          settled_at: new Date().toISOString(),
          graded_by: 'auto',
        }).eq('id', pick.id);

        if (error) errors.push(`pick ${pick.id}: ${error.message}`);
        else graded++;
      }
    }
  }

  return res.json({ graded, errors });
}
