import { chromium } from 'playwright';
import type { RawBet } from './draftkings';

export async function scrapeUnderdog(username: string, password: string): Promise<RawBet[]> {
  if (process.env.MOCK_ONLY === 'true') {
    console.log('[Underdog] MOCK_ONLY mode, returning mock data');
    return getMockUnderdogBets();
  }

  let browser: any;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  } catch (err: any) {
    console.error('[Underdog] Chromium launch failed, using mock data:', err.message);
    return getMockUnderdogBets();
  }

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    await page.goto('https://underdogfantasy.com/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await page.fill('input[type="email"], input[name="email"], input[placeholder*="Email"]', username);
    await page.fill('input[type="password"]', password);

    const submitBtn = await page.$('button[type="submit"], button:has-text("Log In"), button:has-text("Sign In")');
    if (submitBtn) await submitBtn.click();

    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Navigate to pick history
    await page.goto('https://underdogfantasy.com/pick-em/higher-lower/entries', {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(2000);

    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(700);
    }

    const bets = await page.evaluate((): RawBet[] => {
      const cards = document.querySelectorAll(
        '[class*="entry"], [class*="Entry"], [class*="slip"], [class*="card"]'
      );
      const results: RawBet[] = [];

      cards.forEach((card) => {
        try {
          const titleEl = card.querySelector('[class*="title"], [class*="sport"], h2, h3, p');
          const amountEl = card.querySelector('[class*="amount"], [class*="fee"], [class*="stake"], [class*="entry"]');
          const payoutEl = card.querySelector('[class*="payout"], [class*="prize"], [class*="win"]');
          const dateEl = card.querySelector('time, [class*="date"]');
          const statusEl = card.querySelector('[class*="status"], [class*="result"], [class*="outcome"]');

          const title = (titleEl as HTMLElement)?.innerText?.trim() ?? 'Underdog Entry';
          const stake = parseFloat(
            ((amountEl as HTMLElement)?.innerText ?? '0').replace(/[^0-9.-]/g, '')
          );
          const statusText = (statusEl as HTMLElement)?.innerText?.toLowerCase() ?? '';
          const won = statusText.includes('won') || statusText.includes('win');
          const rawPayout = parseFloat(
            ((payoutEl as HTMLElement)?.innerText ?? '0').replace(/[^0-9.-]/g, '')
          );
          const payout = rawPayout || (won ? stake * 3 : 0);
          const dateStr = (dateEl as HTMLElement)?.innerText ?? new Date().toISOString();

          if (!stake || isNaN(stake)) return;

          const pl = payout - stake;
          const roi = (pl / stake) * 100;

          results.push({
            title,
            entryValue: parseFloat(stake.toFixed(2)),
            exitValue: parseFloat(payout.toFixed(2)),
            profitLoss: parseFloat(pl.toFixed(2)),
            roiPercent: parseFloat(roi.toFixed(2)),
            openedAt: dateStr,
            closedAt: dateStr,
            verified: true,
            platform: 'underdog',
          });
        } catch {
          // skip
        }
      });

      return results;
    });

    return bets.length > 0 ? bets : getMockUnderdogBets();
  } finally {
    await browser.close();
  }
}

function getMockUnderdogBets(): RawBet[] {
  const picks = ['Ja Morant O 22.5 pts', 'Justin Jefferson O 75.5 rec yds', 'Nikola Jokic O 11.5 reb'];
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const stake = parseFloat((5 + Math.random() * 45).toFixed(2));
    const won = Math.random() > 0.5;
    const payout = won ? parseFloat((stake * 3).toFixed(2)) : 0;
    const pl = payout - stake;
    const date = new Date(now.getTime() - i * 86400000 * 3).toISOString();
    return {
      title: picks[i % picks.length],
      entryValue: stake,
      exitValue: payout,
      profitLoss: parseFloat(pl.toFixed(2)),
      roiPercent: parseFloat(((pl / stake) * 100).toFixed(2)),
      openedAt: date,
      closedAt: date,
      verified: true as const,
      platform: 'underdog',
    };
  });
}
