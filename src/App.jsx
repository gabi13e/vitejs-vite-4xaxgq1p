import { useState, useEffect, useRef, useCallback } from 'react';

const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

// ── Palette & tokens ────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0d0d0f;
    --paper: #f7f5f0;
    --warm: #f0ebe0;
    --accent: #e8552e;
    --accent2: #3b6fe0;
    --accent3: #2eb87a;
    --muted: #8a8680;
    --border: #ddd9d0;
    --card: #ffffff;
    --shadow: 0 2px 12px rgba(0,0,0,.08);
    --shadow-lg: 0 8px 40px rgba(0,0,0,.14);
    --r: 12px;
    --r-sm: 6px;
  }

  body { font-family: 'DM Sans', sans-serif; background: var(--paper); color: var(--ink); min-height: 100vh; }
  h1,h2,h3,h4 { font-family: 'Syne', sans-serif; }
  code, .mono { font-family: 'DM Mono', monospace; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

  /* Layout */
  .app { display: flex; height: 100vh; overflow: hidden; }
  .sidebar { width: 240px; min-width: 240px; background: var(--ink); color: var(--paper); display: flex; flex-direction: column; padding: 24px 16px; gap: 4px; overflow-y: auto; }
  .main { flex: 1; overflow-y: auto; padding: 32px; }

  /* Sidebar */
  .logo { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; padding: 8px 12px 24px; letter-spacing: -0.5px; }
  .logo span { color: var(--accent); }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--r-sm); cursor: pointer; font-size: 14px; font-weight: 500; color: rgba(247,245,240,.6); transition: all .18s; }
  .nav-item:hover, .nav-item.active { background: rgba(255,255,255,.1); color: var(--paper); }
  .nav-item.active { background: var(--accent); color: white; }
  .nav-icon { font-size: 18px; width: 22px; text-align: center; }
  .nav-section { font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(247,245,240,.3); padding: 16px 12px 6px; }

  /* Header */
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; gap: 16px; }
  .page-title { font-size: 32px; font-weight: 800; letter-spacing: -1px; line-height: 1.1; }
  .page-subtitle { font-size: 14px; color: var(--muted); margin-top: 4px; }

  /* Buttons */
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: var(--r-sm); font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all .18s; font-family: inherit; }
  .btn-primary { background: var(--accent); color: white; }
  .btn-primary:hover { background: #c93e1e; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(232,85,46,.35); }
  .btn-secondary { background: var(--warm); color: var(--ink); border: 1px solid var(--border); }
  .btn-secondary:hover { background: var(--border); }
  .btn-ghost { background: transparent; color: var(--ink); padding: 8px 12px; }
  .btn-ghost:hover { background: var(--warm); }
  .btn-sm { padding: 6px 12px; font-size: 13px; }
  .btn-icon { padding: 8px; }
  .btn:disabled { opacity: .5; cursor: not-allowed; transform: none !important; }

  /* Cards */
  .card { background: var(--card); border: 1px solid var(--border); border-radius: var(--r); padding: 24px; box-shadow: var(--shadow); }
  .card-sm { padding: 16px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }

  /* Study Sets */
  .set-card { border-radius: var(--r); border: 1px solid var(--border); background: white; padding: 20px; cursor: pointer; transition: all .2s; position: relative; overflow: hidden; }
  .set-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--accent); }
  .set-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
  .set-card.blue::before { background: var(--accent2); }
  .set-card.green::before { background: var(--accent3); }
  .set-name { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; margin-bottom: 6px; }
  .set-meta { font-size: 12px; color: var(--muted); display: flex; gap: 12px; flex-wrap: wrap; }
  .set-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
  .tag { font-size: 11px; padding: 3px 8px; border-radius: 99px; background: var(--warm); color: var(--muted); font-weight: 500; }

  /* Flashcard */
  .flashcard-scene { perspective: 1000px; width: 100%; max-width: 640px; margin: 0 auto; }
  .flashcard-wrap { position: relative; width: 100%; padding-top: 56%; transform-style: preserve-3d; transition: transform .5s cubic-bezier(.4,0,.2,1); cursor: pointer; }
  .flashcard-wrap.flipped { transform: rotateY(180deg); }
  .flashcard-face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: var(--r); display: flex; align-items: center; justify-content: center; padding: 32px; font-size: 22px; font-weight: 500; text-align: center; line-height: 1.5; box-shadow: var(--shadow-lg); }
  .flashcard-face.front { background: white; border: 2px solid var(--border); }
  .flashcard-face.back { background: var(--ink); color: var(--paper); transform: rotateY(180deg); }
  .card-hint { font-size: 12px; color: var(--muted); text-align: center; margin-top: 12px; }

  /* Quiz */
  .quiz-wrap { max-width: 680px; margin: 0 auto; }
  .quiz-q { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; margin-bottom: 24px; line-height: 1.4; }
  .quiz-opts { display: flex; flex-direction: column; gap: 10px; }
  .quiz-opt { padding: 14px 18px; border-radius: var(--r-sm); border: 2px solid var(--border); cursor: pointer; font-size: 15px; transition: all .16s; background: white; text-align: left; font-family: inherit; }
  .quiz-opt:hover:not(:disabled) { border-color: var(--accent2); background: #eef3ff; }
  .quiz-opt.correct { border-color: var(--accent3); background: #e6f7ee; color: #1a7a4a; }
  .quiz-opt.wrong { border-color: var(--accent); background: #fef0ec; color: #c93e1e; }
  .quiz-opt:disabled { cursor: default; }

  /* Progress bar */
  .progress-bar { height: 6px; background: var(--warm); border-radius: 99px; overflow: hidden; margin-bottom: 24px; }
  .progress-fill { height: 100%; background: var(--accent2); border-radius: 99px; transition: width .4s ease; }

  /* Stats */
  .stat-card { border-radius: var(--r); padding: 20px; border: 1px solid var(--border); background: white; }
  .stat-value { font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800; line-height: 1; }
  .stat-label { font-size: 13px; color: var(--muted); margin-top: 4px; }
  .stat-delta { font-size: 12px; font-weight: 600; margin-top: 8px; }
  .stat-delta.up { color: var(--accent3); }
  .stat-delta.down { color: var(--accent); }

  /* Input / Textarea */
  .input { width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--r-sm); font-size: 14px; font-family: inherit; background: white; transition: border-color .15s; outline: none; }
  .input:focus { border-color: var(--accent2); box-shadow: 0 0 0 3px rgba(59,111,224,.12); }
  .textarea { min-height: 160px; resize: vertical; line-height: 1.6; }
  .label { font-size: 13px; font-weight: 600; margin-bottom: 6px; display: block; }
  .form-group { margin-bottom: 16px; }

  /* Explanation box */
  .explain-box { border-radius: var(--r-sm); border-left: 4px solid var(--accent2); background: #eef3ff; padding: 14px 18px; font-size: 14px; line-height: 1.7; margin-top: 16px; color: #1e3a8a; }
  .explain-box.correct { border-color: var(--accent3); background: #e6f7ee; color: #1a7a4a; }
  .explain-box.wrong { border-color: var(--accent); background: #fef0ec; color: #7f2012; }

  /* Loader */
  .spinner { display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(255,255,255,.3); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }
  .spinner.dark { border-color: rgba(0,0,0,.15); border-top-color: var(--accent); }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Badges */
  .badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 99px; }
  .badge-orange { background: #fff0e8; color: var(--accent); }
  .badge-blue { background: #eef3ff; color: var(--accent2); }
  .badge-green { background: #e6f7ee; color: var(--accent3); }

  /* Recommendations */
  .rec-card { border-radius: var(--r-sm); border: 1px solid var(--border); padding: 14px; display: flex; gap: 12px; align-items: flex-start; background: white; }
  .rec-icon { font-size: 24px; }
  .rec-title { font-size: 14px; font-weight: 600; margin-bottom: 3px; }
  .rec-desc { font-size: 13px; color: var(--muted); line-height: 1.5; }

  /* Chart bars */
  .chart-bar-wrap { display: flex; align-items: flex-end; gap: 6px; height: 80px; }
  .chart-bar { flex: 1; background: var(--accent2); border-radius: 4px 4px 0 0; opacity: .7; transition: opacity .2s; min-width: 16px; }
  .chart-bar:hover { opacity: 1; }
  .chart-label { font-size: 10px; color: var(--muted); text-align: center; margin-top: 4px; }

  /* Streak dots */
  .streak-dots { display: flex; gap: 4px; flex-wrap: wrap; }
  .streak-dot { width: 12px; height: 12px; border-radius: 3px; background: var(--warm); border: 1px solid var(--border); }
  .streak-dot.done { background: var(--accent3); border-color: var(--accent3); }

  /* Toast */
  .toast { position: fixed; bottom: 24px; right: 24px; background: var(--ink); color: white; padding: 12px 20px; border-radius: var(--r-sm); font-size: 14px; z-index: 999; animation: slideUp .3s ease; box-shadow: var(--shadow-lg); }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  /* Divider */
  .divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }

  /* Tabs */
  .tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); margin-bottom: 24px; }
  .tab { padding: 10px 20px; font-size: 14px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; color: var(--muted); transition: all .15s; }
  .tab.active { color: var(--ink); border-bottom-color: var(--accent); font-weight: 600; }
  .tab:hover:not(.active) { color: var(--ink); }

  /* Empty state */
  .empty { text-align: center; padding: 60px 20px; color: var(--muted); }
  .empty-icon { font-size: 48px; margin-bottom: 16px; }
  .empty-text { font-size: 16px; font-weight: 500; margin-bottom: 8px; color: var(--ink); }
  .empty-sub { font-size: 14px; }

  /* Modal */
  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .modal { background: white; border-radius: var(--r); padding: 32px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .modal-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; }

  /* Responsive tweaks */
  @media (max-width: 900px) {
    .grid-4 { grid-template-columns: repeat(2,1fr); }
    .grid-3 { grid-template-columns: 1fr 1fr; }
  }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 9);
}
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

const COLORS = ['red', 'blue', 'green'];

// ── Initial demo data ────────────────────────────────────────────────────────
const DEMO_SETS = [
  {
    id: 's1',
    name: 'AP Biology – Cell Division',
    subject: 'Biology',
    color: 'red',
    cards: [
      {
        id: 'c1',
        front: 'What is mitosis?',
        back: 'Mitosis is a type of cell division resulting in two daughter cells each having the same number and kind of chromosomes as the parent nucleus.',
      },
      {
        id: 'c2',
        front: 'What are the phases of mitosis?',
        back: 'Prophase → Metaphase → Anaphase → Telophase (PMAT)',
      },
      {
        id: 'c3',
        front: 'What is the difference between mitosis and meiosis?',
        back: 'Mitosis produces 2 identical diploid cells; Meiosis produces 4 genetically diverse haploid cells.',
      },
      {
        id: 'c4',
        front: 'What is cytokinesis?',
        back: 'The physical division of the cytoplasm following nuclear division (karyokinesis).',
      },
      {
        id: 'c5',
        front: 'What is a centromere?',
        back: 'The region of a chromosome that links sister chromatids; where spindle fibers attach during cell division.',
      },
    ],
    quizHistory: [
      { date: '2026-02-18', score: 60 },
      { date: '2026-02-20', score: 80 },
    ],
    created: '2026-02-15',
  },
  {
    id: 's2',
    name: 'Spanish Vocabulary – Travel',
    subject: 'Language',
    color: 'blue',
    cards: [
      { id: 'd1', front: 'el aeropuerto', back: 'the airport' },
      { id: 'd2', front: 'el boleto / billete', back: 'the ticket' },
      { id: 'd3', front: 'facturar el equipaje', back: 'to check luggage' },
      { id: 'd4', front: 'la aduana', back: 'customs' },
      { id: 'd5', front: 'el pasaporte', back: 'the passport' },
      { id: 'd6', front: '¿Dónde está la salida?', back: 'Where is the exit?' },
    ],
    quizHistory: [
      { date: '2026-02-19', score: 50 },
      { date: '2026-02-21', score: 83 },
    ],
    created: '2026-02-17',
  },
  {
    id: 's3',
    name: 'World History – WWII',
    subject: 'History',
    color: 'green',
    cards: [
      {
        id: 'e1',
        front: 'When did WWII begin?',
        back: 'September 1, 1939, when Germany invaded Poland.',
      },
      {
        id: 'e2',
        front: 'What was D-Day?',
        back: 'June 6, 1944 – Allied invasion of Normandy, France. Largest seaborne invasion in history.',
      },
      {
        id: 'e3',
        front: 'What was the Holocaust?',
        back: "Nazi Germany's systematic genocide of six million Jews and millions of others.",
      },
      {
        id: 'e4',
        front: 'Who were the Allied Powers?',
        back: 'Primarily USA, UK, Soviet Union, France, and China.',
      },
    ],
    quizHistory: [{ date: '2026-02-20', score: 75 }],
    created: '2026-02-19',
  },
];

// ── Claude API call ──────────────────────────────────────────────────────────
async function callClaude(messages, systemPrompt = '') {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.map((b) => b.text || '').join('') || '';
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, []);
  return <div className="toast">{msg}</div>;
}

// ── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ sets, onNav }) {
  const totalCards = sets.reduce((s, st) => s + st.cards.length, 0);
  const avgScore = sets.length
    ? Math.round(
        sets
          .flatMap((s) => s.quizHistory.map((h) => h.score))
          .reduce((a, b) => a + b, 0) /
          Math.max(1, sets.flatMap((s) => s.quizHistory).length)
      )
    : 0;

  const recentSet = sets.reduce(
    (a, b) => (b.created > a.created ? b : a),
    sets[0] || {}
  );
  const streakDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const doneIdx = [0, 1, 2, 3, 4]; // simulated streak

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Good morning! 👋</div>
          <div className="page-subtitle">
            You have {sets.length} study sets · {totalCards} flashcards
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => onNav('sets')}>
          Start Studying →
        </button>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-value">{sets.length}</div>
          <div className="stat-label">Study Sets</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalCards}</div>
          <div className="stat-label">Total Cards</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {avgScore}
            <span style={{ fontSize: 18 }}>%</span>
          </div>
          <div className="stat-label">Avg Quiz Score</div>
          <div className="stat-delta up">↑ improving</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">5🔥</div>
          <div className="stat-label">Day Streak</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 16 }}>
            Weekly Activity
          </h3>
          <div className="chart-bar-wrap">
            {[40, 60, 55, 80, 70, 90, 75].map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  className="chart-bar"
                  style={{ height: h * 0.8 + '%' }}
                  title={`${h}%`}
                />
                <div className="chart-label">{streakDays[i]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 12 }}>
            Study Streak
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
            5 days in a row – keep it up!
          </p>
          <div className="streak-dots">
            {Array.from({ length: 21 }, (_, i) => (
              <div key={i} className={`streak-dot ${i < 17 ? 'done' : ''}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 16 }}>
          AI Recommendations
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="rec-card">
            <div className="rec-icon">🧠</div>
            <div>
              <div className="rec-title">Review Cell Division</div>
              <div className="rec-desc">
                Your last quiz score was 80%. A quick review of Phase
                definitions could push you to 95%+.
              </div>
            </div>
          </div>
          <div className="rec-card">
            <div className="rec-icon">⚡</div>
            <div>
              <div className="rec-title">Spanish Vocab – Weak Areas</div>
              <div className="rec-desc">
                "facturar el equipaje" and "la aduana" have the lowest recall
                rate. Focus flashcard practice there.
              </div>
            </div>
          </div>
          <div className="rec-card">
            <div className="rec-icon">📅</div>
            <div>
              <div className="rec-title">Spaced Repetition Due</div>
              <div className="rec-desc">
                WWII set hasn't been reviewed in 2 days. Best time to revisit
                according to the Ebbinghaus curve.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Study Sets List ───────────────────────────────────────────────────────────
function StudySetsPage({ sets, onSelect, onNew }) {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Study Sets</div>
          <div className="page-subtitle">Your personal knowledge library</div>
        </div>
        <button className="btn btn-primary" onClick={onNew}>
          ＋ New Set
        </button>
      </div>
      {sets.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📚</div>
          <div className="empty-text">No study sets yet</div>
          <div className="empty-sub">Create your first set to get started.</div>
        </div>
      ) : (
        <div className="grid-3">
          {sets.map((s) => (
            <div
              key={s.id}
              className={`set-card ${s.color}`}
              onClick={() => onSelect(s)}
            >
              <div className="set-name">{s.name}</div>
              <div className="set-meta">
                <span>📇 {s.cards.length} cards</span>
                <span>📅 {s.created}</span>
              </div>
              {s.quizHistory.length > 0 && (
                <div className="set-meta" style={{ marginTop: 6 }}>
                  Last score: <strong>{s.quizHistory.at(-1).score}%</strong>
                </div>
              )}
              <div className="set-tags">
                <span className="tag">{s.subject}</span>
                {s.quizHistory.length > 0 && (
                  <span className="tag">Quiz taken</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── New Set Modal ─────────────────────────────────────────────────────────────
function NewSetModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!name.trim()) {
      setError('Please enter a set name.');
      return;
    }
    if (!content.trim()) {
      setError('Please paste some study material.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const raw = await callClaude([
        {
          role: 'user',
          content: `From the following study material, extract 6-10 key concept flashcard pairs. 
Return ONLY valid JSON array: [{"front":"...", "back":"..."}]
No markdown, no explanation.

Material:
${content}`,
        },
      ]);
      const json = raw.replace(/```json|```/g, '').trim();
      const pairs = JSON.parse(json);
      const cards = pairs.map((p) => ({
        id: uid(),
        front: p.front,
        back: p.back,
      }));
      onCreate({
        id: uid(),
        name: name.trim(),
        subject: subject.trim() || 'General',
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        cards,
        quizHistory: [],
        created: new Date().toISOString().slice(0, 10),
      });
    } catch (e) {
      setError('AI parsing failed. Try again or simplify your text.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Create Study Set" onClose={onClose}>
      <div className="form-group">
        <label className="label">Set Name *</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. AP Chemistry – Acids & Bases"
        />
      </div>
      <div className="form-group">
        <label className="label">Subject</label>
        <input
          className="input"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Chemistry, Math, History…"
        />
      </div>
      <div className="form-group">
        <label className="label">Study Material *</label>
        <textarea
          className="input textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your notes, textbook excerpts, or any study material here. The AI will extract flashcards automatically…"
        />
      </div>
      {error && (
        <div style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Generating cards…
            </>
          ) : (
            '✨ Generate Flashcards'
          )}
        </button>
      </div>
    </Modal>
  );
}

// ── Set Detail: Flashcards + Quiz + Analytics ─────────────────────────────────
function SetDetail({ set, onBack, onUpdateSet }) {
  const [tab, setTab] = useState('flashcards');
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quizState, setQuizState] = useState(null); // null | "active" | "done"
  const [quiz, setQuiz] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [results, setResults] = useState([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [recs, setRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const card = set.cards[cardIdx];
  const q = quiz[qIdx];

  // ── Flashcard navigation ──
  function prev() {
    setFlipped(false);
    setTimeout(() => setCardIdx((i) => Math.max(0, i - 1)), 150);
  }
  function next() {
    setFlipped(false);
    setTimeout(
      () => setCardIdx((i) => Math.min(set.cards.length - 1, i + 1)),
      150
    );
  }

  // ── Quiz generation ──
  async function startQuiz() {
    if (set.cards.length < 2) return;
    setLoadingQuiz(true);
    try {
      const raw = await callClaude([
        {
          role: 'user',
          content: `Create a 5-question multiple-choice quiz from these flashcard pairs. 
Return ONLY a JSON array with no markdown:
[{"question":"...","options":["A","B","C","D"],"answer":"exact correct option string"}]

Flashcards:
${set.cards.map((c) => `Q: ${c.front}\nA: ${c.back}`).join('\n---\n')}`,
        },
      ]);
      const json = raw.replace(/```json|```/g, '').trim();
      const qs = JSON.parse(json);
      setQuiz(qs);
      setQIdx(0);
      setResults([]);
      setSelected(null);
      setExplanation('');
      setQuizState('active');
    } catch {
      alert('Quiz generation failed. Try again.');
    } finally {
      setLoadingQuiz(false);
    }
  }

  // ── Answer selection ──
  async function handleAnswer(opt) {
    if (selected) return;
    setSelected(opt);
    const correct = opt === q.answer;
    const newEntry = {
      question: q.question,
      selected: opt,
      answer: q.answer,
      correct,
    };
    // Build the full updated results array synchronously so finishQuiz has accurate data
    const updatedResults = [...results, newEntry];
    setResults(updatedResults);

    // get explanation
    setLoadingExplain(true);
    try {
      const exp = await callClaude([
        {
          role: 'user',
          content: `Question: ${q.question}
Correct answer: ${q.answer}
Student chose: ${opt}
The student was ${correct ? 'CORRECT' : 'WRONG'}.
Give a concise 2-3 sentence explanation for why the correct answer is right. Start with "${
            correct ? '✅ Correct!' : '❌ Incorrect.'
          }"`,
        },
      ]);
      setExplanation(exp);
    } catch {
      setExplanation('');
    } finally {
      setLoadingExplain(false);
    }
  }

  function nextQuestion() {
    setSelected(null);
    setExplanation('');
    if (qIdx + 1 >= quiz.length) {
      finishQuiz(results); // pass current results since last answer already appended
    } else {
      setQIdx((i) => i + 1);
    }
  }

  function finishQuiz(finalResults) {
    // finalResults passed explicitly to avoid stale closure over `results` state
    const res = finalResults ?? results;
    const score = Math.round(
      (res.filter((r) => r.correct).length / res.length) * 100
    );
    const updated = {
      ...set,
      quizHistory: [
        ...set.quizHistory,
        { date: new Date().toISOString().slice(0, 10), score },
      ],
    };
    onUpdateSet(updated);
    setQuizState('done');
    generateRecs(res, set);
  }

  async function generateRecs(res, st) {
    setLoadingRecs(true);
    try {
      const wrong = res
        .filter((r) => !r.correct)
        .map((r) => r.question)
        .join('; ');
      const raw = await callClaude([
        {
          role: 'user',
          content: `Student just took a quiz on "${st.name}". 
Missed questions: ${wrong || 'none'}.
Score: ${Math.round((res.filter((r) => r.correct).length / res.length) * 100)}%.
Give 3 specific, actionable personalized study recommendations as JSON array (no markdown):
[{"icon":"emoji","title":"short title","desc":"1-2 sentence advice"}]`,
        },
      ]);
      const json = raw.replace(/```json|```/g, '').trim();
      setRecs(JSON.parse(json));
    } catch {
      setRecs([]);
    } finally {
      setLoadingRecs(false);
    }
  }

  const score = results.length
    ? Math.round(
        (results.filter((r) => r.correct).length / results.length) * 100
      )
    : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onBack}
            style={{ marginBottom: 8 }}
          >
            ← Back
          </button>
          <div className="page-title">{set.name}</div>
          <div className="page-subtitle">
            {set.cards.length} cards · {set.subject}
          </div>
        </div>
      </div>

      <div className="tabs">
        {['flashcards', 'quiz', 'analytics'].map((t) => (
          <div
            key={t}
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => {
              setTab(t);
              setQuizState(null);
            }}
          >
            {t === 'flashcards'
              ? '📇 Flashcards'
              : t === 'quiz'
              ? '📝 Quiz'
              : '📊 Analytics'}
          </div>
        ))}
      </div>

      {/* ── FLASHCARDS ── */}
      {tab === 'flashcards' && (
        <div>
          <div
            style={{
              textAlign: 'center',
              marginBottom: 12,
              color: 'var(--muted)',
              fontSize: 13,
            }}
          >
            {cardIdx + 1} / {set.cards.length}
          </div>
          <div className="flashcard-scene">
            <div
              className={`flashcard-wrap ${flipped ? 'flipped' : ''}`}
              onClick={() => setFlipped((f) => !f)}
            >
              <div className="flashcard-face front">
                <div>{card.front}</div>
              </div>
              <div className="flashcard-face back">
                <div>{card.back}</div>
              </div>
            </div>
          </div>
          <div className="card-hint">Click card to flip</div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              marginTop: 20,
            }}
          >
            <button
              className="btn btn-secondary"
              onClick={prev}
              disabled={cardIdx === 0}
            >
              ← Prev
            </button>
            <button
              className="btn btn-secondary"
              onClick={next}
              disabled={cardIdx === set.cards.length - 1}
            >
              Next →
            </button>
          </div>
          <div style={{ marginTop: 32 }}>
            <h3
              style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 12 }}
            >
              All Cards
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {set.cards.map((c, i) => (
                <div
                  key={c.id}
                  className="card card-sm"
                  style={{
                    cursor: 'pointer',
                    borderLeft:
                      i === cardIdx
                        ? '4px solid var(--accent)'
                        : '4px solid transparent',
                  }}
                  onClick={() => {
                    setCardIdx(i);
                    setFlipped(false);
                    setTab('flashcards');
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.front}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      marginTop: 3,
                    }}
                  >
                    {c.back}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── QUIZ ── */}
      {tab === 'quiz' && (
        <div className="quiz-wrap">
          {!quizState && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
              <h2
                style={{
                  fontFamily: 'Syne',
                  fontWeight: 800,
                  fontSize: 26,
                  marginBottom: 8,
                }}
              >
                Take a Quiz
              </h2>
              <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
                AI will generate a 5-question multiple-choice quiz from your
                flashcards.
              </p>
              <button
                className="btn btn-primary"
                onClick={startQuiz}
                disabled={loadingQuiz || set.cards.length < 2}
              >
                {loadingQuiz ? (
                  <>
                    <span className="spinner" />
                    Generating…
                  </>
                ) : (
                  '⚡ Start Quiz'
                )}
              </button>
              {set.quizHistory.length > 0 && (
                <p
                  style={{ marginTop: 16, color: 'var(--muted)', fontSize: 13 }}
                >
                  Last attempt: {set.quizHistory.at(-1).score}% on{' '}
                  {set.quizHistory.at(-1).date}
                </p>
              )}
            </div>
          )}

          {quizState === 'active' && q && (
            <div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(qIdx / quiz.length) * 100}%` }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: 'var(--muted)',
                  marginBottom: 20,
                }}
              >
                <span>
                  Question {qIdx + 1} of {quiz.length}
                </span>
                <span>
                  {results.filter((r) => r.correct).length} correct so far
                </span>
              </div>
              <div className="quiz-q">{q.question}</div>
              <div className="quiz-opts">
                {q.options.map((opt) => {
                  let cls = '';
                  if (selected) {
                    if (opt === q.answer) cls = 'correct';
                    else if (opt === selected) cls = 'wrong';
                  }
                  return (
                    <button
                      key={opt}
                      className={`quiz-opt ${cls}`}
                      onClick={() => handleAnswer(opt)}
                      disabled={!!selected}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {selected && (
                <div>
                  {loadingExplain ? (
                    <div
                      style={{
                        marginTop: 16,
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        color: 'var(--muted)',
                        fontSize: 14,
                      }}
                    >
                      <span className="spinner dark" />
                      Getting explanation…
                    </div>
                  ) : (
                    explanation && (
                      <div
                        className={`explain-box ${
                          selected === q.answer ? 'correct' : 'wrong'
                        }`}
                      >
                        {explanation}
                      </div>
                    )
                  )}
                  <div style={{ marginTop: 20, textAlign: 'right' }}>
                    <button className="btn btn-primary" onClick={nextQuestion}>
                      {qIdx + 1 < quiz.length
                        ? 'Next Question →'
                        : 'See Results'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {quizState === 'done' && (
            <div>
              <div
                className="card"
                style={{ textAlign: 'center', marginBottom: 24 }}
              >
                <div style={{ fontSize: 56, marginBottom: 8 }}>
                  {score >= 80 ? '🏆' : score >= 60 ? '👍' : '💪'}
                </div>
                <div
                  style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 48 }}
                >
                  {score}%
                </div>
                <div style={{ color: 'var(--muted)', marginTop: 4 }}>
                  {results.filter((r) => r.correct).length}/{results.length}{' '}
                  correct
                </div>
              </div>

              <h3
                style={{
                  fontFamily: 'Syne',
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                Review
              </h3>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginBottom: 24,
                }}
              >
                {results.map((r, i) => (
                  <div
                    key={i}
                    className="card card-sm"
                    style={{
                      borderLeft: `4px solid ${
                        r.correct ? 'var(--accent3)' : 'var(--accent)'
                      }`,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {r.question}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: r.correct ? 'var(--accent3)' : 'var(--accent)',
                        marginTop: 4,
                      }}
                    >
                      {r.correct ? '✅' : '❌'} You chose: {r.selected}
                      {!r.correct && (
                        <span style={{ color: 'var(--muted)' }}>
                          {' '}
                          · Correct: {r.answer}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {recs.length > 0 && (
                <div>
                  <h3
                    style={{
                      fontFamily: 'Syne',
                      fontWeight: 700,
                      marginBottom: 12,
                    }}
                  >
                    🤖 AI Recommendations
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      marginBottom: 24,
                    }}
                  >
                    {recs.map((r, i) => (
                      <div key={i} className="rec-card">
                        <div className="rec-icon">{r.icon}</div>
                        <div>
                          <div className="rec-title">{r.title}</div>
                          <div className="rec-desc">{r.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {loadingRecs && (
                <div
                  style={{
                    color: 'var(--muted)',
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  <span className="spinner dark" style={{ marginRight: 8 }} />
                  Generating personalized recommendations…
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={startQuiz}
                disabled={loadingQuiz}
              >
                {loadingQuiz ? (
                  <>
                    <span className="spinner" />
                    Generating…
                  </>
                ) : (
                  '🔄 Retake Quiz'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS ── */}
      {tab === 'analytics' && (
        <div>
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-value">{set.cards.length}</div>
              <div className="stat-label">Total Cards</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{set.quizHistory.length}</div>
              <div className="stat-label">Quizzes Taken</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {set.quizHistory.length
                  ? Math.round(
                      set.quizHistory.reduce((a, h) => a + h.score, 0) /
                        set.quizHistory.length
                    )
                  : '–'}
                {set.quizHistory.length ? '%' : ''}
              </div>
              <div className="stat-label">Average Score</div>
            </div>
          </div>

          {set.quizHistory.length > 0 ? (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3
                style={{
                  fontFamily: 'Syne',
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                Score Trend
              </h3>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 12,
                  height: 100,
                }}
              >
                {set.quizHistory.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--ink)',
                      }}
                    >
                      {h.score}%
                    </div>
                    <div
                      style={{
                        width: '100%',
                        background:
                          h.score >= 80
                            ? 'var(--accent3)'
                            : h.score >= 60
                            ? 'var(--accent2)'
                            : 'var(--accent)',
                        borderRadius: '4px 4px 0 0',
                        height: h.score * 0.7,
                      }}
                    />
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h.date.slice(5)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty" style={{ padding: '40px 0' }}>
              <div className="empty-icon">📊</div>
              <div className="empty-text">No quiz data yet</div>
              <div className="empty-sub">
                Take a quiz to see your performance analytics.
              </div>
            </div>
          )}

          {set.quizHistory.length >= 2 && (
            <div
              className="explain-box"
              style={{
                borderColor: 'var(--accent2)',
                background: '#eef3ff',
                color: 'var(--ink)',
              }}
            >
              <strong>🔍 AI Insight:</strong> Your scores have improved by{' '}
              {set.quizHistory.at(-1).score - set.quizHistory[0].score} points
              since you started.
              {set.quizHistory.at(-1).score >= 80
                ? " Excellent progress! You're approaching mastery. Try adding harder cards."
                : ' Keep practicing! Consistent daily review is the fastest path to improvement.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Progress Page ─────────────────────────────────────────────────────────────
function ProgressPage({ sets }) {
  const allHistory = sets
    .flatMap((s) =>
      s.quizHistory.map((h) => ({ ...h, set: s.name, subject: s.subject }))
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Progress</div>
          <div className="page-subtitle">Your complete learning history</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 16 }}>
            Performance by Subject
          </h3>
          {sets.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>No data yet</p>
          ) : (
            sets.map((s) => {
              const avg = s.quizHistory.length
                ? Math.round(
                    s.quizHistory.reduce((a, h) => a + h.score, 0) /
                      s.quizHistory.length
                  )
                : null;
              return (
                <div key={s.id} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{s.name}</span>
                    <span
                      style={{
                        color:
                          avg == null
                            ? 'var(--muted)'
                            : avg >= 80
                            ? 'var(--accent3)'
                            : 'var(--accent2)',
                      }}
                    >
                      {avg != null ? avg + '%' : 'No quizzes'}
                    </span>
                  </div>
                  {avg != null && (
                    <div
                      style={{
                        height: 6,
                        background: 'var(--warm)',
                        borderRadius: 99,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: avg + '%',
                          background:
                            avg >= 80 ? 'var(--accent3)' : 'var(--accent2)',
                          borderRadius: 99,
                          transition: 'width .5s',
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="card">
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 16 }}>
            Recent Activity
          </h3>
          {allHistory.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              No quiz history yet. Take a quiz!
            </p>
          ) : (
            allHistory.slice(0, 8).map((h, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 13,
                }}
              >
                <div>
                  <span style={{ fontWeight: 600 }}>{h.set}</span>
                  <span style={{ color: 'var(--muted)', marginLeft: 8 }}>
                    {h.date}
                  </span>
                </div>
                <span
                  className={`badge ${
                    h.score >= 80
                      ? 'badge-green'
                      : h.score >= 60
                      ? 'badge-blue'
                      : 'badge-orange'
                  }`}
                >
                  {h.score}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState('dashboard');
  const [sets, setSets] = useState(DEMO_SETS);
  const [activeSet, setActiveSet] = useState(null);
  const [showNewSet, setShowNewSet] = useState(false);
  const [toast, setToast] = useState(null);

  function showToast(msg) {
    setToast(msg);
  }

  function handleCreateSet(newSet) {
    setSets((s) => [...s, newSet]);
    setShowNewSet(false);
    showToast(`✨ "${newSet.name}" created with ${newSet.cards.length} cards!`);
  }

  function handleUpdateSet(updated) {
    setSets((s) => s.map((st) => (st.id === updated.id ? updated : st)));
    if (activeSet?.id === updated.id) setActiveSet(updated);
  }

  function handleSelectSet(s) {
    setActiveSet(s);
    setPage('setDetail');
  }

  const NAV = [
    { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
    { id: 'sets', icon: '📚', label: 'Study Sets' },
    { id: 'progress', icon: '📈', label: 'Progress' },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <nav className="sidebar">
          <div className="logo">
            learn<span>AI</span>
          </div>
          <div className="nav-section">Menu</div>
          {NAV.map((n) => (
            <div
              key={n.id}
              className={`nav-item ${page === n.id ? 'active' : ''}`}
              onClick={() => {
                setPage(n.id);
                setActiveSet(null);
              }}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div
            style={{
              fontSize: 12,
              color: 'rgba(247,245,240,.3)',
              padding: '0 12px',
            }}
          >
            Powered by Claude AI
          </div>
        </nav>

        <main className="main">
          {page === 'dashboard' && (
            <Dashboard sets={sets} onNav={(p) => setPage(p)} />
          )}
          {page === 'sets' && !activeSet && (
            <StudySetsPage
              sets={sets}
              onSelect={handleSelectSet}
              onNew={() => setShowNewSet(true)}
            />
          )}
          {page === 'setDetail' && activeSet && (
            <SetDetail
              set={activeSet}
              onBack={() => {
                setPage('sets');
                setActiveSet(null);
              }}
              onUpdateSet={handleUpdateSet}
            />
          )}
          {page === 'progress' && <ProgressPage sets={sets} />}
        </main>
      </div>

      {showNewSet && (
        <NewSetModal
          onClose={() => setShowNewSet(false)}
          onCreate={handleCreateSet}
        />
      )}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </>
  );
}
