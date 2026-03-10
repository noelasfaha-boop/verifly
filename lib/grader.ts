// Pure pick grading logic — no Supabase dependencies
import type { Pick, PickResult } from '@/types';

export interface GameResult {
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
}

export interface GradeOutput {
  result: PickResult;
  profit_loss: number | null;
}

export function gradePick(pick: Pick, game: GameResult): GradeOutput {
  const desc = (pick.pick_description ?? '').toLowerCase();
  const { home_score, away_score, home_team, away_team } = game;
  const total = home_score + away_score;
  const diff = home_score - away_score; // positive = home wins

  if (pick.bet_type === 'Moneyline') {
    const homeTeamLower = home_team.toLowerCase();
    const awayTeamLower = away_team.toLowerCase();
    const pickedHome = desc.includes(homeTeamLower) ||
      homeTeamLower.split(' ').some(w => w.length > 3 && desc.includes(w));
    const pickedAway = !pickedHome && (desc.includes(awayTeamLower) ||
      awayTeamLower.split(' ').some(w => w.length > 3 && desc.includes(w)));

    if (!pickedHome && !pickedAway) return { result: 'pending', profit_loss: null };
    if (diff === 0) return { result: 'push', profit_loss: 0 };
    const pickedWon = pickedHome ? diff > 0 : diff < 0;
    return pickedWon
      ? { result: 'win', profit_loss: calculateWinPL(pick.odds, pick.stake_units) }
      : { result: 'loss', profit_loss: -pick.stake_units };
  }

  if (pick.bet_type === 'Over/Under') {
    const overMatch  = desc.match(/over\s+([\d.]+)/);
    const underMatch = desc.match(/under\s+([\d.]+)/);
    if (!overMatch && !underMatch) return { result: 'pending', profit_loss: null };
    const line = parseFloat((overMatch ?? underMatch)![1]);
    if (isNaN(line)) return { result: 'pending', profit_loss: null };
    if (total === line) return { result: 'push', profit_loss: 0 };
    const won = overMatch ? total > line : total < line;
    return won
      ? { result: 'win', profit_loss: calculateWinPL(pick.odds, pick.stake_units) }
      : { result: 'loss', profit_loss: -pick.stake_units };
  }

  if (pick.bet_type === 'Spread') {
    const spreadMatch = desc.match(/([+-][\d.]+)/);
    if (!spreadMatch) return { result: 'pending', profit_loss: null };
    const spread = parseFloat(spreadMatch[1]);
    if (isNaN(spread)) return { result: 'pending', profit_loss: null };

    const homeTeamLower = home_team.toLowerCase();
    const pickedHome = homeTeamLower.split(' ').some(w => w.length > 3 && desc.includes(w));
    const adjustedDiff = pickedHome ? diff + spread : -diff + spread;
    if (adjustedDiff === 0) return { result: 'push', profit_loss: 0 };
    return adjustedDiff > 0
      ? { result: 'win', profit_loss: calculateWinPL(pick.odds, pick.stake_units) }
      : { result: 'loss', profit_loss: -pick.stake_units };
  }

  // Parlay, Player Prop, image-only, Live Bet → cannot auto-grade
  return { result: 'pending', profit_loss: null };
}

function calculateWinPL(odds: string | undefined, stake: number): number {
  if (!odds) return parseFloat(stake.toFixed(2));
  const cleaned = odds.replace(/[^0-9.+-]/g, '');
  const n = parseFloat(cleaned);
  if (isNaN(n)) return parseFloat(stake.toFixed(2));
  const pl = n > 0 ? (n / 100) * stake : (100 / Math.abs(n)) * stake;
  return parseFloat(pl.toFixed(2));
}
