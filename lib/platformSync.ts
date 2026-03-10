/**
 * Platform sync adapters.
 * Real implementations require valid API keys per creator.
 * Mock data is returned when the API is unavailable or for development.
 */

export interface RawTrade {
  symbol: string;
  entryValue: number;
  exitValue: number;
  profitLoss: number;
  roiPercent: number;
  openedAt: string;
  closedAt: string;
  verified: boolean;
}

// ---------------------------------------------------------------
// Binance
// ---------------------------------------------------------------
export async function syncBinance(apiKey: string, apiSecret: string): Promise<RawTrade[]> {
  try {
    // Real: fetch from https://api.binance.com/api/v3/myTrades
    // Requires HMAC-SHA256 signed request
    console.log('[Binance] Would sync with real API. Returning mock data.');
  } catch {
    console.error('[Binance] Sync failed — using mock data');
  }

  // Mock data
  return mockTrades('BTC/USDT');
}

// ---------------------------------------------------------------
// Coinbase
// ---------------------------------------------------------------
export async function syncCoinbase(accessToken: string): Promise<RawTrade[]> {
  try {
    // Real: GET https://api.coinbase.com/v2/accounts + /transactions
    // Bearer token auth
    console.log('[Coinbase] Would sync with real API. Returning mock data.');
  } catch {
    console.error('[Coinbase] Sync failed — using mock data');
  }

  return mockTrades('ETH/USD');
}

// ---------------------------------------------------------------
// DraftKings
// ---------------------------------------------------------------
export async function syncDraftKings(accessToken: string): Promise<RawTrade[]> {
  try {
    // Real: DraftKings does not have a public API for bet history.
    // Would require browser automation or unofficial endpoints.
    console.log('[DraftKings] No public API available. Returning mock data.');
  } catch {
    console.error('[DraftKings] Sync failed — using mock data');
  }

  return mockBets();
}

// ---------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------
export async function syncPlatform(
  platform: string,
  encryptedToken: string
): Promise<RawTrade[]> {
  // In production: decrypt token, parse key+secret, call platform
  // Here we pass the encrypted token as a placeholder
  switch (platform) {
    case 'binance':
      return syncBinance(encryptedToken, '');
    case 'coinbase':
      return syncCoinbase(encryptedToken);
    case 'draftkings':
      return syncDraftKings(encryptedToken);
    default:
      return [];
  }
}

// ---------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------
function mockTrades(symbol: string): RawTrade[] {
  const now = new Date();
  return Array.from({ length: 10 }, (_, i) => {
    const entry = 100 + Math.random() * 50;
    const exit = entry * (1 + (Math.random() * 0.3 - 0.1));
    const pl = exit - entry;
    const opened = new Date(now.getTime() - (10 - i) * 86400000).toISOString();
    const closed = new Date(now.getTime() - (9 - i) * 86400000).toISOString();
    return {
      symbol,
      entryValue: parseFloat(entry.toFixed(4)),
      exitValue: parseFloat(exit.toFixed(4)),
      profitLoss: parseFloat(pl.toFixed(4)),
      roiPercent: parseFloat(((pl / entry) * 100).toFixed(2)),
      openedAt: opened,
      closedAt: closed,
      verified: true,
    };
  });
}

function mockBets(): RawTrade[] {
  const teams = ['Lakers vs Celtics', 'Chiefs vs Eagles', 'Yankees vs Red Sox'];
  const now = new Date();
  return Array.from({ length: 8 }, (_, i) => {
    const entry = 50 + Math.random() * 200;
    const won = Math.random() > 0.4;
    const exit = won ? entry * (1 + Math.random() * 1.5) : 0;
    const pl = exit - entry;
    const opened = new Date(now.getTime() - (8 - i) * 86400000).toISOString();
    const closed = new Date(now.getTime() - (7 - i) * 86400000).toISOString();
    return {
      symbol: teams[i % teams.length],
      entryValue: parseFloat(entry.toFixed(2)),
      exitValue: parseFloat(exit.toFixed(2)),
      profitLoss: parseFloat(pl.toFixed(2)),
      roiPercent: parseFloat(((pl / entry) * 100).toFixed(2)),
      openedAt: opened,
      closedAt: closed,
      verified: true,
    };
  });
}
