// ESPN public API client — no API key required

export const ESPN_LEAGUES: Record<string, { sport: string; league: string }> = {
  NBA:    { sport: 'basketball', league: 'nba' },
  NFL:    { sport: 'football',   league: 'nfl' },
  MLB:    { sport: 'baseball',   league: 'mlb' },
  NHL:    { sport: 'hockey',     league: 'nhl' },
  Soccer: { sport: 'soccer',     league: 'usa.1' },
};

export interface EspnEvent {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: {
    type: { name: string; completed: boolean };
  };
  competitions: Array<{
    competitors: Array<{
      homeAway: 'home' | 'away';
      team: { displayName: string; abbreviation: string };
      score: string;
    }>;
  }>;
}

export interface ParsedGame {
  espn_event_id: string;
  sport: string;
  league: string;
  home_team: string;
  away_team: string;
  start_time: string;
  status: 'scheduled' | 'live' | 'final';
  home_score?: number;
  away_score?: number;
  raw_espn: EspnEvent;
}

export async function fetchScoreboard(sport: string, league: string): Promise<EspnEvent[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`ESPN fetch failed for ${sport}/${league}: ${res.status}`);
  const data = await res.json();
  return data.events ?? [];
}

export function parseGameStatus(espnStatusName: string): 'scheduled' | 'live' | 'final' {
  if (espnStatusName === 'STATUS_FINAL' || espnStatusName === 'STATUS_FULL_TIME') return 'final';
  if (espnStatusName === 'STATUS_IN_PROGRESS' || espnStatusName === 'STATUS_HALFTIME') return 'live';
  return 'scheduled';
}

export function parseEspnEvent(event: EspnEvent, sport: string, leagueKey: string): ParsedGame {
  const comp = event.competitions[0];
  const home = comp.competitors.find(c => c.homeAway === 'home')!;
  const away = comp.competitors.find(c => c.homeAway === 'away')!;
  const status = parseGameStatus(event.status.type.name);

  return {
    espn_event_id: event.id,
    sport,
    league: leagueKey,
    home_team: home.team.displayName,
    away_team: away.team.displayName,
    start_time: event.date,
    status,
    home_score: status !== 'scheduled' ? parseInt(home.score) || 0 : undefined,
    away_score: status !== 'scheduled' ? parseInt(away.score) || 0 : undefined,
    raw_espn: event,
  };
}
