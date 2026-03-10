import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { Pick, Game } from '@/types';

interface Props {
  creatorId: string;
  onPosted: (pick: Pick) => void;
  onCancel: () => void;
}

const SPORTS = ['NBA', 'NFL', 'MLB', 'NHL', 'Soccer', 'Tennis', 'Crypto', 'Stocks', 'Other'];
const BET_TYPES = ['Moneyline', 'Spread', 'Over/Under', 'Parlay', 'Player Prop', 'Live Bet', 'Trade'];

type Mode = 'text' | 'image';

export default function PostPickForm({ creatorId, onPosted, onCancel }: Props) {
  const [mode, setMode] = useState<Mode>('image');
  const [sport, setSport] = useState('NBA');
  const [betType, setBetType] = useState('Moneyline');
  const [odds, setOdds] = useState('');
  const [stakeUnits, setStakeUnits] = useState('1');
  const [event, setEvent] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [gameQuery, setGameQuery] = useState('');
  const [gameResults, setGameResults] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showGameDropdown, setShowGameDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gameDebounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (gameQuery.length < 2) { setGameResults([]); setShowGameDropdown(false); return; }
    clearTimeout(gameDebounceRef.current);
    gameDebounceRef.current = setTimeout(async () => {
      const res = await fetch('/api/games/search?' + new URLSearchParams({ q: gameQuery, sport }));
      const data = await res.json();
      setGameResults(data.data ?? []);
      setShowGameDropdown(true);
    }, 300);
    return () => clearTimeout(gameDebounceRef.current);
  }, [gameQuery, sport]);

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10 MB.'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  }, [handleImageSelect]);

  async function uploadImage(pickId: string): Promise<string> {
    if (!imageFile) throw new Error('No image selected');
    const ext = imageFile.name.split('.').pop() ?? 'jpg';
    const urlRes = await fetch('/api/picks/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatorId, pickId, ext }),
    });
    const urlData = await urlRes.json();
    if (urlData.error) throw new Error(urlData.error);
    setUploadProgress(30);
    const uploadRes = await fetch(urlData.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': imageFile.type },
      body: imageFile,
    });
    if (!uploadRes.ok) throw new Error('Image upload failed');
    setUploadProgress(80);
    return urlData.publicUrl;
  }

  async function handleSubmit() {
    if (mode === 'image' && !imageFile) { toast.error('Please select a bet slip image.'); return; }
    if (mode === 'text' && !description.trim()) { toast.error('Please enter a pick description.'); return; }
    if (!stakeUnits || parseFloat(stakeUnits) <= 0) { toast.error('Please enter stake units.'); return; }
    setLoading(true);
    try {
      let imageUrl: string | null = null;
      if (mode === 'image' && imageFile) {
        imageUrl = await uploadImage(crypto.randomUUID());
      }
      setUploadProgress(90);
      const body: Record<string, any> = {
        creatorId, sport, bet_type: betType, odds: odds || null,
        stake_units: parseFloat(stakeUnits),
        event_id: selectedGame?.id || null,
        league: selectedGame?.league || null,
      };
      if (mode === 'image') {
        body.image_url = imageUrl;
        body.caption = caption || null;
        body.event = selectedGame ? selectedGame.away_team + ' vs ' + selectedGame.home_team : null;
      } else {
        body.event = event || null;
        body.pick_description = description;
      }
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); }
      else { toast.success('Pick posted!'); onPosted(data.data as Pick); }
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to post pick.');
    } finally {
      setLoading(false); setUploadProgress(0);
    }
  }

  const formatGameTime = (t: string) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <div className="rounded-2xl border border-dark-500 bg-dark-800 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-white">Post a Pick</h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors text-sm">Cancel</button>
      </div>

      <div className="flex gap-2 mb-5 p-1 rounded-xl bg-dark-700 border border-dark-600">
        {(['image', 'text'] as Mode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={"flex-1 rounded-lg py-2 text-sm font-semibold transition-all " + (mode === m ? 'bg-brand-500 text-dark-900' : 'text-gray-400 hover:text-white')}>
            {m === 'image' ? '📸 Image Pick' : '✏️ Text Pick'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Sport</label>
          <div className="flex flex-wrap gap-2">
            {SPORTS.map((s) => (
              <button key={s} onClick={() => { setSport(s); setSelectedGame(null); setGameQuery(''); }}
                className={"rounded-full px-3 py-1 text-xs font-medium transition-colors " + (sport === s ? 'bg-brand-500 text-dark-900' : 'border border-dark-500 text-gray-400 hover:text-white')}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {mode === 'image' && (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Bet Slip Screenshot</label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-dark-500">
                <img src={imagePreview} alt="Bet slip preview" className="w-full max-h-64 object-contain bg-dark-900" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 rounded-full bg-dark-800/80 p-1.5 text-gray-400 hover:text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-dark-500 bg-dark-700/50 p-8 cursor-pointer hover:border-brand-500/50 hover:bg-dark-700 transition-all">
                <span className="text-3xl">📸</span>
                <p className="text-sm text-gray-400">Drop bet slip here or <span className="text-brand-400">click to upload</span></p>
                <p className="text-xs text-gray-600">JPG, PNG, WEBP up to 10 MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0]); }} />
          </div>
        )}

        <div className="relative">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Link to Game <span className="text-gray-600">(optional — enables auto-grading)</span>
          </label>
          {selectedGame ? (
            <div className="flex items-center justify-between rounded-lg border border-brand-500/50 bg-brand-500/10 px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-white">{selectedGame.away_team} vs {selectedGame.home_team}</p>
                <p className="text-xs text-gray-500">{formatGameTime(selectedGame.start_time)}</p>
              </div>
              <button onClick={() => { setSelectedGame(null); setGameQuery(''); }} className="text-gray-500 hover:text-white ml-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <input type="text" value={gameQuery} onChange={(e) => setGameQuery(e.target.value)}
              onBlur={() => setTimeout(() => setShowGameDropdown(false), 150)}
              onFocus={() => gameResults.length > 0 && setShowGameDropdown(true)}
              placeholder={"Search " + sport + " games\u2026"}
              className="w-full rounded-lg border border-dark-400 bg-dark-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none" />
          )}
          {showGameDropdown && gameResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-dark-500 bg-dark-800 shadow-xl overflow-hidden">
              {gameResults.map((g) => (
                <button key={g.id} onMouseDown={() => { setSelectedGame(g); setGameQuery(''); setShowGameDropdown(false); }}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-dark-700 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white">{g.away_team} vs {g.home_team}</p>
                    <p className="text-xs text-gray-500">{formatGameTime(g.start_time)}</p>
                  </div>
                  {g.status === 'live' && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400">LIVE</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {mode === 'text' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Event / Game</label>
              <input type="text" value={event} onChange={(e) => setEvent(e.target.value)}
                placeholder="e.g. Lakers vs Celtics"
                className="w-full rounded-lg border border-dark-400 bg-dark-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Pick Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                placeholder="e.g. Lakers -3.5, Over 224.5"
                className="w-full rounded-lg border border-dark-400 bg-dark-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none resize-none" />
            </div>
          </>
        )}

        {mode === 'image' && (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Caption <span className="text-gray-600">(optional)</span></label>
            <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)}
              placeholder="Add context to your pick\u2026"
              className="w-full rounded-lg border border-dark-400 bg-dark-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none" />
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Bet Type</label>
            <select value={betType} onChange={(e) => setBetType(e.target.value)}
              className="w-full rounded-lg border border-dark-400 bg-dark-700 px-2 py-2 text-sm text-white focus:border-brand-500 focus:outline-none">
              {BET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Odds</label>
            <input type="text" value={odds} onChange={(e) => setOdds(e.target.value)} placeholder="-110"
              className="w-full rounded-lg border border-dark-400 bg-dark-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Units</label>
            <input type="number" min="0.1" step="0.5" value={stakeUnits} onChange={(e) => setStakeUnits(e.target.value)}
              className="w-full rounded-lg border border-dark-400 bg-dark-700 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none" />
          </div>
        </div>

        {selectedGame && (
          <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 px-3 py-2 text-xs text-brand-300">
            Auto-grading enabled — result will update when the game ends.
          </div>
        )}

        {loading && uploadProgress > 0 && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-dark-600">
            <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: uploadProgress + '%' }} />
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-dark-900 hover:bg-brand-400 disabled:opacity-50 transition-colors">
          {loading ? 'Posting\u2026' : 'Post Pick'}
        </button>
      </div>
    </div>
  );
}
