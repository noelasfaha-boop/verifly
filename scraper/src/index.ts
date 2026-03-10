import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { scrapeDraftKings } from './scrapers/draftkings';
import { scrapePrizePicks } from './scrapers/prizepicks';
import { scrapeUnderdog } from './scrapers/underdog';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 4000;
const SCRAPER_SECRET = process.env.SCRAPER_SECRET ?? 'dev-secret';

app.use(express.json());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:3000' }));

// Auth middleware — validates requests come from the Verifly Next.js backend
app.use((req, res, next) => {
  const secret = req.headers['x-scraper-secret'];
  if (secret !== SCRAPER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

/**
 * POST /scrape
 * Body: { platform: string, username: string, password: string }
 * Returns: { bets: RawBet[] }
 */
app.post('/scrape', async (req, res) => {
  const { platform, username, password } = req.body;

  if (!platform || !username || !password) {
    return res.status(400).json({ error: 'Missing platform, username, or password' });
  }

  try {
    let bets;
    switch (platform) {
      case 'draftkings':
        bets = await scrapeDraftKings(username, password);
        break;
      case 'prizepicks':
        bets = await scrapePrizePicks(username, password);
        break;
      case 'underdog':
        bets = await scrapeUnderdog(username, password);
        break;
      default:
        return res.status(400).json({ error: `Unsupported platform: ${platform}` });
    }
    return res.json({ bets });
  } catch (err: any) {
    console.error(`[Scraper] ${platform} error:`, err.message);
    return res.status(500).json({ error: err.message ?? 'Scrape failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Verifly scraper service running on port ${PORT}`);
});
