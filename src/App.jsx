import { useState, useEffect, useRef } from "react";
import * as mammoth from "mammoth";

const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

// ── CSS ──────────────────────────────────────────────────────────────────────
const buildCss = (dark) => `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: ${dark ? "#e8e4dc" : "#0d0d0f"};
    --paper: ${dark ? "#111113" : "#f7f5f0"};
    --warm: ${dark ? "#1c1c20" : "#f0ebe0"};
    --accent: #e8552e;
    --accent2: #3b6fe0;
    --accent3: #2eb87a;
    --muted: ${dark ? "#6b6760" : "#8a8680"};
    --border: ${dark ? "#2a2a2e" : "#ddd9d0"};
    --card: ${dark ? "#18181c" : "#ffffff"};
    --card2: ${dark ? "#1e1e24" : "#f9f8f5"};
    --shadow: 0 2px 12px rgba(0,0,0,${dark ? ".4" : ".08"});
    --shadow-lg: 0 8px 40px rgba(0,0,0,${dark ? ".6" : ".14"});
    --sidebar-bg: ${dark ? "#0a0a0c" : "#0d0d0f"};
    --r: 12px; --r-sm: 6px;
  }

  body { font-family: 'DM Sans', sans-serif; background: var(--paper); color: var(--ink); min-height: 100vh; transition: background .3s, color .3s; }
  h1,h2,h3,h4 { font-family: 'Syne', sans-serif; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

  .app { display: flex; height: 100vh; overflow: hidden; }
  .sidebar { width: 240px; min-width: 240px; background: var(--sidebar-bg); color: #f7f5f0; display: flex; flex-direction: column; padding: 24px 16px; gap: 4px; overflow-y: auto; }
  .main { flex: 1; overflow-y: auto; padding: 32px; }

  .logo { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; padding:8px 12px 24px; letter-spacing:-.5px; }
  .logo span { color: var(--accent); }
  .nav-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:var(--r-sm); cursor:pointer; font-size:14px; font-weight:500; color:rgba(247,245,240,.55); transition:all .18s; }
  .nav-item:hover { background:rgba(255,255,255,.08); color:#f7f5f0; }
  .nav-item.active { background:var(--accent); color:white; }
  .nav-icon { font-size:18px; width:22px; text-align:center; }
  .nav-section { font-size:10px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:rgba(247,245,240,.25); padding:16px 12px 6px; }

  .page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:32px; gap:16px; flex-wrap:wrap; }
  .page-title { font-size:32px; font-weight:800; letter-spacing:-1px; line-height:1.1; }
  .page-subtitle { font-size:14px; color:var(--muted); margin-top:4px; }

  .btn { display:inline-flex; align-items:center; gap:8px; padding:10px 18px; border-radius:var(--r-sm); font-size:14px; font-weight:500; cursor:pointer; border:none; transition:all .18s; font-family:inherit; }
  .btn-primary { background:var(--accent); color:white; }
  .btn-primary:hover { background:#c93e1e; transform:translateY(-1px); box-shadow:0 4px 14px rgba(232,85,46,.35); }
  .btn-secondary { background:var(--warm); color:var(--ink); border:1px solid var(--border); }
  .btn-secondary:hover { background:var(--border); }
  .btn-ghost { background:transparent; color:var(--ink); padding:8px 12px; }
  .btn-ghost:hover { background:var(--warm); }
  .btn-sm { padding:6px 12px; font-size:13px; }
  .btn-icon { padding:8px; }
  .btn:disabled { opacity:.45; cursor:not-allowed; transform:none !important; }

  .card { background:var(--card); border:1px solid var(--border); border-radius:var(--r); padding:24px; box-shadow:var(--shadow); }
  .card-sm { padding:16px; }
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; }
  .grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }

  .set-card { border-radius:var(--r); border:1px solid var(--border); background:var(--card); padding:20px; cursor:pointer; transition:all .2s; position:relative; overflow:hidden; }
  .set-card::before { content:''; position:absolute; top:0; left:0; right:0; height:4px; background:var(--accent); }
  .set-card:hover { transform:translateY(-3px); box-shadow:var(--shadow-lg); }
  .set-card.blue::before { background:var(--accent2); }
  .set-card.green::before { background:var(--accent3); }
  .set-name { font-family:'Syne',sans-serif; font-size:17px; font-weight:700; margin-bottom:6px; }
  .set-meta { font-size:12px; color:var(--muted); display:flex; gap:12px; flex-wrap:wrap; }
  .set-tags { display:flex; gap:6px; flex-wrap:wrap; margin-top:10px; }
  .tag { font-size:11px; padding:3px 8px; border-radius:99px; background:var(--warm); color:var(--muted); font-weight:500; border:1px solid var(--border); }

  .flashcard-scene { perspective:1000px; width:100%; max-width:640px; margin:0 auto; }
  .flashcard-wrap { position:relative; width:100%; padding-top:56%; transform-style:preserve-3d; transition:transform .5s cubic-bezier(.4,0,.2,1); cursor:pointer; }
  .flashcard-wrap.flipped { transform:rotateY(180deg); }
  .flashcard-face { position:absolute; inset:0; backface-visibility:hidden; border-radius:var(--r); display:flex; align-items:center; justify-content:center; padding:32px; font-size:22px; font-weight:500; text-align:center; line-height:1.5; box-shadow:var(--shadow-lg); }
  .flashcard-face.front { background:var(--card); border:2px solid var(--border); color:var(--ink); }
  .flashcard-face.back { background:var(--sidebar-bg); color:#f7f5f0; transform:rotateY(180deg); }
  .card-hint { font-size:12px; color:var(--muted); text-align:center; margin-top:12px; }

  .quiz-wrap { max-width:680px; margin:0 auto; }
  .quiz-q { font-family:'Syne',sans-serif; font-size:22px; font-weight:700; margin-bottom:24px; line-height:1.4; }
  .quiz-opts { display:flex; flex-direction:column; gap:10px; }
  .quiz-opt { padding:14px 18px; border-radius:var(--r-sm); border:2px solid var(--border); cursor:pointer; font-size:15px; transition:all .16s; background:var(--card); color:var(--ink); text-align:left; font-family:inherit; }
  .quiz-opt:hover:not(:disabled) { border-color:var(--accent2); background:var(--warm); }
  .quiz-opt.correct { border-color:var(--accent3)!important; background:#e6f7ee!important; color:#1a7a4a!important; }
  .quiz-opt.wrong { border-color:var(--accent)!important; background:#fef0ec!important; color:#c93e1e!important; }
  .quiz-opt:disabled { cursor:default; }

  .progress-bar { height:6px; background:var(--warm); border-radius:99px; overflow:hidden; margin-bottom:24px; }
  .progress-fill { height:100%; background:var(--accent2); border-radius:99px; transition:width .4s ease; }

  .stat-card { border-radius:var(--r); padding:20px; border:1px solid var(--border); background:var(--card); }
  .stat-value { font-family:'Syne',sans-serif; font-size:36px; font-weight:800; line-height:1; }
  .stat-label { font-size:13px; color:var(--muted); margin-top:4px; }

  .input { width:100%; padding:10px 14px; border:1px solid var(--border); border-radius:var(--r-sm); font-size:14px; font-family:inherit; background:var(--card); color:var(--ink); transition:border-color .15s; outline:none; }
  .input:focus { border-color:var(--accent2); box-shadow:0 0 0 3px rgba(59,111,224,.12); }
  .textarea { min-height:130px; resize:vertical; line-height:1.6; }
  .label { font-size:13px; font-weight:600; margin-bottom:6px; display:block; color:var(--ink); }
  .form-group { margin-bottom:16px; }

  .explain-box { border-radius:var(--r-sm); border-left:4px solid var(--accent2); background:var(--warm); padding:14px 18px; font-size:14px; line-height:1.7; margin-top:16px; color:var(--ink); }
  .explain-box.correct { border-color:var(--accent3); }
  .explain-box.wrong { border-color:var(--accent); }

  .spinner { display:inline-block; width:18px; height:18px; border:2px solid rgba(255,255,255,.3); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }
  .spinner.dark { border-color:rgba(0,0,0,.12); border-top-color:var(--accent); }
  @keyframes spin { to { transform:rotate(360deg); } }

  .badge { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:700; padding:3px 8px; border-radius:99px; }
  .badge-orange { background:#fff0e8; color:var(--accent); }
  .badge-blue { background:#eef3ff; color:var(--accent2); }
  .badge-green { background:#e6f7ee; color:#1a7a4a; }
  .badge-gold { background:#fff8e1; color:#b8860b; }

  .rec-card { border-radius:var(--r-sm); border:1px solid var(--border); padding:14px; display:flex; gap:12px; align-items:flex-start; background:var(--card); }
  .rec-icon { font-size:24px; }
  .rec-title { font-size:14px; font-weight:600; margin-bottom:3px; color:var(--ink); }
  .rec-desc { font-size:13px; color:var(--muted); line-height:1.5; }

  .tabs { display:flex; gap:0; border-bottom:2px solid var(--border); margin-bottom:24px; }
  .tab { padding:10px 20px; font-size:14px; font-weight:500; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-2px; color:var(--muted); transition:all .15s; }
  .tab.active { color:var(--ink); border-bottom-color:var(--accent); font-weight:600; }
  .tab:hover:not(.active) { color:var(--ink); }

  .empty { text-align:center; padding:60px 20px; color:var(--muted); }
  .empty-icon { font-size:48px; margin-bottom:16px; }
  .empty-text { font-size:16px; font-weight:500; margin-bottom:8px; color:var(--ink); }
  .empty-sub { font-size:14px; }

  .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:100; display:flex; align-items:center; justify-content:center; padding:24px; }
  .modal { background:var(--card); border-radius:var(--r); padding:32px; width:100%; max-width:580px; max-height:90vh; overflow-y:auto; box-shadow:var(--shadow-lg); border:1px solid var(--border); }
  .modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
  .modal-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:var(--ink); }

  .dropzone { border:2px dashed var(--border); border-radius:var(--r); padding:28px; text-align:center; cursor:pointer; transition:all .2s; background:var(--warm); }
  .dropzone:hover, .dropzone.drag { border-color:var(--accent2); background:var(--card2); }
  .dropzone-icon { font-size:32px; margin-bottom:8px; }
  .dropzone-text { font-size:14px; color:var(--muted); }
  .dropzone-text strong { color:var(--ink); }
  .file-preview { display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:var(--r-sm); background:var(--warm); border:1px solid var(--border); font-size:13px; margin-top:8px; }
  .file-preview-name { flex:1; font-weight:500; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

  .or-divider { display:flex; align-items:center; gap:12px; color:var(--muted); font-size:13px; margin:14px 0; }
  .or-divider::before, .or-divider::after { content:''; flex:1; height:1px; background:var(--border); }

  .toast { position:fixed; bottom:24px; right:24px; background:var(--sidebar-bg); color:#f7f5f0; padding:12px 20px; border-radius:var(--r-sm); font-size:14px; z-index:999; animation:slideUp .3s ease; box-shadow:var(--shadow-lg); border:1px solid var(--border); }
  @keyframes slideUp { from { transform:translateY(20px); opacity:0; } to { transform:translateY(0); opacity:1; } }

  .lb-row { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:var(--r-sm); border:1px solid var(--border); background:var(--card); margin-bottom:8px; }
  .lb-rank { font-family:'Syne',sans-serif; font-weight:800; font-size:18px; width:32px; text-align:center; }
  .lb-rank.gold { color:#f5c518; }
  .lb-rank.silver { color:#aaa; }
  .lb-rank.bronze { color:#cd7f32; }
  .lb-avatar { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:700; color:white; flex-shrink:0; }
  .lb-name { flex:1; font-weight:600; font-size:14px; color:var(--ink); }
  .lb-score { font-family:'Syne',sans-serif; font-weight:800; font-size:16px; color:var(--accent2); }
  .lb-badge-sub { font-size:11px; color:var(--muted); }

  .schedule-day { border-radius:var(--r-sm); border:1px solid var(--border); background:var(--card); overflow:hidden; margin-bottom:10px; }
  .schedule-day-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:var(--warm); border-bottom:1px solid var(--border); }
  .schedule-day-name { font-family:'Syne',sans-serif; font-weight:700; font-size:15px; color:var(--ink); }
  .schedule-task { display:flex; align-items:center; gap:10px; padding:10px 16px; border-bottom:1px solid var(--border); font-size:13px; color:var(--ink); }
  .schedule-task:last-child { border-bottom:none; }
  .schedule-task-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }

  .chart-bar-wrap { display:flex; align-items:flex-end; gap:6px; height:80px; }
  .chart-bar { flex:1; background:var(--accent2); border-radius:4px 4px 0 0; opacity:.65; min-width:16px; transition:opacity .2s; }
  .chart-bar:hover { opacity:1; }
  .streak-dots { display:flex; gap:4px; flex-wrap:wrap; }
  .streak-dot { width:12px; height:12px; border-radius:3px; background:var(--warm); border:1px solid var(--border); }
  .streak-dot.done { background:var(--accent3); border-color:var(--accent3); }

  @media (max-width:900px) {
    .grid-4 { grid-template-columns:repeat(2,1fr); }
    .grid-3 { grid-template-columns:1fr 1fr; }
    .grid-2 { grid-template-columns:1fr; }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2,9); }
const COLORS = ["red","blue","green"];

const DEMO_SETS = [
  { id:"s1", name:"AP Biology – Cell Division", subject:"Biology", color:"red",
    cards:[
      {id:"c1",front:"What is mitosis?",back:"Cell division producing 2 identical diploid daughter cells."},
      {id:"c2",front:"Phases of mitosis?",back:"Prophase → Metaphase → Anaphase → Telophase (PMAT)"},
      {id:"c3",front:"Mitosis vs Meiosis?",back:"Mitosis: 2 identical diploid cells. Meiosis: 4 haploid cells."},
      {id:"c4",front:"What is cytokinesis?",back:"Physical division of cytoplasm after nuclear division."},
      {id:"c5",front:"What is a centromere?",back:"Region linking sister chromatids; spindle fiber attachment point."},
    ],
    quizHistory:[{date:"2026-02-18",score:60},{date:"2026-02-20",score:80}], created:"2026-02-15"},
  { id:"s2", name:"Spanish – Travel Vocab", subject:"Language", color:"blue",
    cards:[
      {id:"d1",front:"el aeropuerto",back:"the airport"},
      {id:"d2",front:"el boleto",back:"the ticket"},
      {id:"d3",front:"facturar el equipaje",back:"to check luggage"},
      {id:"d4",front:"la aduana",back:"customs"},
      {id:"d5",front:"el pasaporte",back:"the passport"},
    ],
    quizHistory:[{date:"2026-02-19",score:50},{date:"2026-02-21",score:83}], created:"2026-02-17"},
  { id:"s3", name:"World History – WWII", subject:"History", color:"green",
    cards:[
      {id:"e1",front:"When did WWII begin?",back:"September 1, 1939 – Germany invaded Poland."},
      {id:"e2",front:"What was D-Day?",back:"June 6, 1944 – Allied invasion of Normandy, France."},
      {id:"e3",front:"Who were the Allied Powers?",back:"USA, UK, Soviet Union, France, and China."},
      {id:"e4",front:"When did WWII end?",back:"September 2, 1945 – Japan's formal surrender."},
    ],
    quizHistory:[{date:"2026-02-20",score:75}], created:"2026-02-19"},
];

const DEMO_LB = [
  {id:"u1",name:"Sofia M.",avatar:"🦁",color:"#e8552e",scores:[92,88,95],sets:8},
  {id:"u2",name:"James K.",avatar:"🐯",color:"#3b6fe0",scores:[85,90,87],sets:6},
  {id:"u3",name:"You",avatar:"⭐",color:"#2eb87a",scores:[80,83,75],sets:3},
  {id:"u4",name:"Priya S.",avatar:"🦊",color:"#9b59b6",scores:[78,82,70],sets:5},
  {id:"u5",name:"Luca B.",avatar:"🐻",color:"#e67e22",scores:[70,65,72],sets:4},
];

// ── Claude API ────────────────────────────────────────────────────────────────
const API_URL = typeof window !== "undefined" && window.location.hostname === "localhost"
  ? "https://api.anthropic.com/v1/messages"
  : "/.netlify/functions/claude";

async function callClaude(messages, sys="") {
  const res = await fetch(API_URL, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:ANTHROPIC_MODEL,max_tokens:1500,system:sys,messages}),
  });
  const d = await res.json();
  if(d.error) throw new Error(d.error.message);
  return d.content?.map(b=>b.text||"").join("")||"";
}

async function callClaudeWithPDF(b64, prompt) {
  const res = await fetch(API_URL, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      model:ANTHROPIC_MODEL, max_tokens:1500,
      messages:[{role:"user",content:[
        {type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},
        {type:"text",text:prompt}
      ]}]
    }),
  });
  const d = await res.json();
  if(d.error) throw new Error(d.error.message);
  return d.content?.map(b=>b.text||"").join("")||"";
}

function readAsBase64(file) {
  return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});
}
function readAsText(file) {
  return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsText(file);});
}
async function readDocx(file) {
  const ab = await file.arrayBuffer();
  const result = await mammoth.extractRawText({arrayBuffer:ab});
  return result.value;
}
function fileIcon(name="") {
  const ext=name.split(".").pop().toLowerCase();
  return ext==="pdf"?"📕":ext==="docx"||ext==="doc"?"📘":"📄";
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({msg,onDone}) {
  useEffect(()=>{const t=setTimeout(onDone,3000);return()=>clearTimeout(t);},[]);
  return <div className="toast">{msg}</div>;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({title,onClose,children}) {
  return (
    <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── File Drop Zone ────────────────────────────────────────────────────────────
function FileDropZone({file,onFile,onClear}) {
  const [drag,setDrag]=useState(false);
  const ref=useRef();
  function handle(f) {
    if(!f) return;
    const ext=f.name.split(".").pop().toLowerCase();
    if(!["pdf","txt","docx"].includes(ext)){alert("Please upload PDF, TXT, or DOCX.");return;}
    onFile(f);
  }
  return !file ? (
    <div className={`dropzone ${drag?"drag":""}`}
      onClick={()=>ref.current.click()}
      onDragOver={e=>{e.preventDefault();setDrag(true);}}
      onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);handle(e.dataTransfer.files[0]);}}>
      <div className="dropzone-icon">📎</div>
      <div className="dropzone-text"><strong>Drop a file here</strong> or click to browse</div>
      <div className="dropzone-text" style={{fontSize:12,marginTop:4}}>PDF, TXT, DOCX supported</div>
      <input ref={ref} type="file" accept=".pdf,.txt,.docx" style={{display:"none"}} onChange={e=>handle(e.target.files[0])}/>
    </div>
  ) : (
    <div className="file-preview">
      <span style={{fontSize:20}}>{fileIcon(file.name)}</span>
      <span className="file-preview-name">{file.name}</span>
      <span style={{fontSize:12,color:"var(--muted)"}}>{(file.size/1024).toFixed(0)} KB</span>
      <button className="btn btn-ghost btn-sm" onClick={onClear} style={{padding:"4px 8px"}}>✕</button>
    </div>
  );
}

// ── New Set Modal ─────────────────────────────────────────────────────────────
function NewSetModal({onClose,onCreate}) {
  const [name,setName]=useState("");
  const [subject,setSubject]=useState("");
  const [content,setContent]=useState("");
  const [file,setFile]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function handleCreate() {
    if(!name.trim()){setError("Please enter a set name.");return;}
    if(!file&&!content.trim()){setError("Please upload a file or paste text.");return;}
    setLoading(true); setError("");
    try {
      const prompt=`From the following study material, extract 6-10 key concept flashcard pairs.
Return ONLY valid JSON array (no markdown, no extra text): [{"front":"...","back":"..."}]`;
      let raw="";
      if(file) {
        const ext=file.name.split(".").pop().toLowerCase();
        if(ext==="pdf") { const b64=await readAsBase64(file); raw=await callClaudeWithPDF(b64,prompt); }
        else if(ext==="docx") { const txt=await readDocx(file); raw=await callClaude([{role:"user",content:prompt+"\n\nMaterial:\n"+txt}]); }
        else { const txt=await readAsText(file); raw=await callClaude([{role:"user",content:prompt+"\n\nMaterial:\n"+txt}]); }
      } else {
        raw=await callClaude([{role:"user",content:prompt+"\n\nMaterial:\n"+content}]);
      }
      const cards=JSON.parse(raw.replace(/```json|```/g,"").trim()).map(p=>({id:uid(),front:p.front,back:p.back}));
      onCreate({id:uid(),name:name.trim(),subject:subject.trim()||"General",color:COLORS[Math.floor(Math.random()*3)],cards,quizHistory:[],created:new Date().toISOString().slice(0,10)});
    } catch(e){setError("Failed: "+e.message);}
    finally{setLoading(false);}
  }

  return (
    <Modal title="Create Study Set" onClose={onClose}>
      <div className="form-group"><label className="label">Set Name *</label>
        <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. AP Chemistry – Acids & Bases"/></div>
      <div className="form-group"><label className="label">Subject</label>
        <input className="input" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Chemistry, Math…"/></div>
      <div className="form-group"><label className="label">Upload File</label>
        <FileDropZone file={file} onFile={setFile} onClear={()=>setFile(null)}/></div>
      <div className="or-divider">or paste text</div>
      <div className="form-group">
        <textarea className="input textarea" value={content} onChange={e=>setContent(e.target.value)}
          placeholder="Paste notes, textbook excerpts…" disabled={!!file}/></div>
      {error&&<div style={{color:"var(--accent)",fontSize:13,marginBottom:12}}>{error}</div>}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
          {loading?<><span className="spinner"/>Processing…</>:"✨ Generate Flashcards"}</button>
      </div>
    </Modal>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({sets,onNav}) {
  const totalCards=sets.reduce((s,st)=>s+st.cards.length,0);
  const allScores=sets.flatMap(s=>s.quizHistory.map(h=>h.score));
  const avg=allScores.length?Math.round(allScores.reduce((a,b)=>a+b,0)/allScores.length):0;
  const days=["M","T","W","T","F","S","S"];
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Good morning! 👋</div><div className="page-subtitle">{sets.length} study sets · {totalCards} flashcards</div></div>
        <button className="btn btn-primary" onClick={()=>onNav("sets")}>Start Studying →</button>
      </div>
      <div className="grid-4" style={{marginBottom:24}}>
        {[{v:sets.length,l:"Study Sets"},{v:totalCards,l:"Total Cards"},{v:avg?avg+"%":"–",l:"Avg Score"},{v:"5🔥",l:"Day Streak"}].map((s,i)=>(
          <div key={i} className="stat-card"><div className="stat-value">{s.v}</div><div className="stat-label">{s.l}</div></div>
        ))}
      </div>
      <div className="grid-2" style={{marginBottom:24}}>
        <div className="card">
          <h3 style={{fontFamily:"Syne",fontWeight:700,marginBottom:16}}>Weekly Activity</h3>
          <div className="chart-bar-wrap">
            {[40,60,55,80,70,90,75].map((h,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center"}}>
                <div className="chart-bar" style={{height:h*.8+"%"}}/><div style={{fontSize:10,color:"var(--muted)",marginTop:4}}>{days[i]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 style={{fontFamily:"Syne",fontWeight:700,marginBottom:12}}>Study Streak</h3>
          <p style={{fontSize:13,color:"var(--muted)",marginBottom:12}}>5 days in a row – keep it up!</p>
          <div className="streak-dots">{Array.from({length:21},(_,i)=><div key={i} className={`streak-dot ${i<17?"done":""}`}/>)}</div>
        </div>
      </div>
      <div className="card">
        <h3 style={{fontFamily:"Syne",fontWeight:700,marginBottom:16}}>🤖 AI Recommendations</h3>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[
            {icon:"🧠",t:"Review Cell Division",d:"Last score was 80%. Reviewing phase definitions could push you to 95%+."},
            {icon:"⚡",t:"Spanish Weak Areas",d:"'facturar el equipaje' has the lowest recall. Extra flashcard practice recommended."},
            {icon:"📅",t:"Spaced Repetition Due",d:"WWII set hasn't been reviewed in 2 days. Optimal time per the Ebbinghaus curve."},
          ].map((r,i)=>(
            <div key={i} className="rec-card"><div className="rec-icon">{r.icon}</div><div><div className="rec-title">{r.t}</div><div className="rec-desc">{r.d}</div></div></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Study Sets ────────────────────────────────────────────────────────────────
function StudySetsPage({sets,onSelect,onNew}) {
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Study Sets</div><div className="page-subtitle">Your personal knowledge library</div></div>
        <button className="btn btn-primary" onClick={onNew}>＋ New Set</button>
      </div>
      {sets.length===0
        ?<div className="empty"><div className="empty-icon">📚</div><div className="empty-text">No study sets yet</div><div className="empty-sub">Create one to get started.</div></div>
        :<div className="grid-3">{sets.map(s=>(
            <div key={s.id} className={`set-card ${s.color}`} onClick={()=>onSelect(s)}>
              <div className="set-name">{s.name}</div>
              <div className="set-meta"><span>📇 {s.cards.length} cards</span><span>📅 {s.created}</span></div>
              {s.quizHistory.length>0&&<div className="set-meta" style={{marginTop:6}}>Last: <strong>{s.quizHistory.at(-1).score}%</strong></div>}
              <div className="set-tags"><span className="tag">{s.subject}</span></div>
            </div>
          ))}</div>
      }
    </div>
  );
}

// ── Set Detail ────────────────────────────────────────────────────────────────
function SetDetail({set,onBack,onUpdateSet}) {
  const [tab,setTab]=useState("flashcards");
  const [cardIdx,setCardIdx]=useState(0);
  const [flipped,setFlipped]=useState(false);
  const [quizState,setQuizState]=useState(null);
  const [quiz,setQuiz]=useState([]);
  const [qIdx,setQIdx]=useState(0);
  const [selected,setSelected]=useState(null);
  const [explanation,setExplanation]=useState("");
  const [loadingExplain,setLoadingExplain]=useState(false);
  const [results,setResults]=useState([]);
  const [loadingQuiz,setLoadingQuiz]=useState(false);
  const [recs,setRecs]=useState([]);
  const [loadingRecs,setLoadingRecs]=useState(false);

  const card=set.cards[cardIdx];
  const q=quiz[qIdx];

  function prev(){setFlipped(false);setTimeout(()=>setCardIdx(i=>Math.max(0,i-1)),150);}
  function next(){setFlipped(false);setTimeout(()=>setCardIdx(i=>Math.min(set.cards.length-1,i+1)),150);}

  async function startQuiz(){
    if(set.cards.length<2)return;
    setLoadingQuiz(true);
    try{
      const raw=await callClaude([{role:"user",content:`Create a 5-question multiple-choice quiz from these flashcards.
Return ONLY JSON array (no markdown): [{"question":"...","options":["A","B","C","D"],"answer":"exact option string"}]
Flashcards:\n${set.cards.map(c=>`Q: ${c.front}\nA: ${c.back}`).join("\n---\n")}`}]);
      const qs=JSON.parse(raw.replace(/```json|```/g,"").trim());
      setQuiz(qs);setQIdx(0);setResults([]);setSelected(null);setExplanation("");setQuizState("active");
    }catch{alert("Quiz generation failed.");}
    finally{setLoadingQuiz(false);}
  }

  async function handleAnswer(opt){
    if(selected)return;
    setSelected(opt);
    const correct=opt===q.answer;
    const newEntry={question:q.question,selected:opt,answer:q.answer,correct};
    const updated=[...results,newEntry];
    setResults(updated);
    setLoadingExplain(true);
    try{
      const exp=await callClaude([{role:"user",content:`Q: ${q.question}\nCorrect: ${q.answer}\nChose: ${opt}\nWas ${correct?"CORRECT":"WRONG"}.\nGive 2-sentence explanation starting with "${correct?"✅ Correct!":"❌ Incorrect."}"`}]);
      setExplanation(exp);
    }catch{setExplanation("");}
    finally{setLoadingExplain(false);}
  }

  function nextQuestion(){
    setSelected(null);setExplanation("");
    if(qIdx+1>=quiz.length)finishQuiz(results);
    else setQIdx(i=>i+1);
  }

  function finishQuiz(res){
    const score=Math.round(res.filter(r=>r.correct).length/res.length*100);
    const upd={...set,quizHistory:[...set.quizHistory,{date:new Date().toISOString().slice(0,10),score}]};
    onUpdateSet(upd);setQuizState("done");generateRecs(res,set);
  }

  async function generateRecs(res,st){
    setLoadingRecs(true);
    try{
      const wrong=res.filter(r=>!r.correct).map(r=>r.question).join("; ");
      const raw=await callClaude([{role:"user",content:`Quiz on "${st.name}". Missed: ${wrong||"none"}. Score: ${Math.round(res.filter(r=>r.correct).length/res.length*100)}%.
Give 3 personalized study recommendations as JSON array (no markdown): [{"icon":"emoji","title":"short title","desc":"1-2 sentence advice"}]`}]);
      setRecs(JSON.parse(raw.replace(/```json|```/g,"").trim()));
    }catch{setRecs([]);}
    finally{setLoadingRecs(false);}
  }

  const doneScore=results.length?Math.round(results.filter(r=>r.correct).length/results.length*100):0;

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={onBack} style={{marginBottom:8}}>← Back</button>
          <div className="page-title">{set.name}</div>
          <div className="page-subtitle">{set.cards.length} cards · {set.subject}</div>
        </div>
      </div>
      <div className="tabs">
        {["flashcards","quiz","analytics"].map(t=>(
          <div key={t} className={`tab ${tab===t?"active":""}`} onClick={()=>{setTab(t);setQuizState(null);}}>
            {t==="flashcards"?"📇 Flashcards":t==="quiz"?"📝 Quiz":"📊 Analytics"}
          </div>
        ))}
      </div>

      {tab==="flashcards"&&(
        <div>
          <div style={{textAlign:"center",marginBottom:12,color:"var(--muted)",fontSize:13}}>{cardIdx+1} / {set.cards.length}</div>
          <div className="flashcard-scene">
            <div className={`flashcard-wrap ${flipped?"flipped":""}`} onClick={()=>setFlipped(f=>!f)}>
              <div className="flashcard-face front">{card.front}</div>
              <div className="flashcard-face back">{card.back}</div>
            </div>
          </div>
          <div className="card-hint">Click card to flip</div>
          <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:20}}>
            <button className="btn btn-secondary" onClick={prev} disabled={cardIdx===0}>← Prev</button>
            <button className="btn btn-secondary" onClick={next} disabled={cardIdx===set.cards.length-1}>Next →</button>
          </div>
          <div style={{marginTop:32}}>
            <h3 style={{fontFamily:"Syne",fontWeight:700,marginBottom:12}}>All Cards</h3>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {set.cards.map((c,i)=>(
                <div key={c.id} className="card card-sm" style={{cursor:"pointer",borderLeft:`4px solid ${i===cardIdx?"var(--accent)":"var(--border)"}`}} onClick={()=>{setCardIdx(i);setFlipped(false);}}>
                  <div style={{fontSize:13,fontWeight:600}}>{c.front}</div>
                  <div style={{fontSize:12,color:"var(--muted)",marginTop:3}}>{c.back}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==="quiz"&&(
        <div className="quiz-wrap">
          {!quizState&&(
            <div style={{textAlign:"center",padding:"40px 0"}}>
              <div style={{fontSize:48,marginBottom:16}}>🎯</div>
              <h2 style={{fontFamily:"Syne",fontWeight:800,fontSize:26,marginBottom:8}}>Take a Quiz</h2>
              <p style={{color:"var(--muted)",marginBottom:24}}>AI generates a 5-question multiple-choice quiz from your flashcards.</p>
              <button className="btn btn-primary" onClick={startQuiz} disabled={loadingQuiz||set.cards.length<2}>
                {loadingQuiz?<><span className="spinner"/>Generating…</>:"⚡ Start Quiz"}</button>
              {set.quizHistory.length>0&&<p style={{marginTop:16,color:"var(--muted)",fontSize:13}}>Last: {set.quizHistory.at(-1).score}% on {set.quizHistory.at(-1).date}</p>}
            </div>
          )}
          {quizState==="active"&&q&&(
            <div>
              <div className="progress-bar"><div className="progress-fill" style={{width:`${(qIdx/quiz.length)*100}%`}}/></div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"var(--muted)",marginBottom:20}}>
                <span>Question {qIdx+1} of {quiz.length}</span><span>{results.filter(r=>r.correct).length} correct</span>
              </div>
              <div className="quiz-q">{q.question}</div>
              <div className="quiz-opts">
                {q.options.map(opt=>{
                  let cls="";
                  if(selected){if(opt===q.answer)cls="correct";else if(opt===selected)cls="wrong";}
                  return <button key={opt} className={`quiz-opt ${cls}`} onClick={()=>handleAnswer(opt)} disabled={!!selected}>{opt}</button>;
                })}
              </div>
              {selected&&(
                <div>
                  {loadingExplain?<div style={{marginTop:16,display:"flex",gap:8,alignItems:"center",color:"var(--muted)",fontSize:14}}><span className="spinner dark"/>Getting explanation…</div>
                    :explanation&&<div className={`explain-box ${selected===q.answer?"correct":"wrong"}`}>{explanation}</div>}
                  <div style={{marginTop:20,textAlign:"right"}}>
                    <button className="btn btn-primary" onClick={nextQuestion}>{qIdx+1<quiz.length?"Next Question →":"See Results"}</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {quizState==="done"&&(
            <div>
              <div className="card" style={{textAlign:"center",marginBottom:24}}>
                <div style={{fontSize:56,marginBottom:8}}>{doneScore>=80?"🏆":doneScore>=60?"👍":"💪"}</div>
                <div style={{fontFamily:"Syne",fontWeight:800,fontSize:48}}>{doneScore}%</div>
                <div style={{color:"var(--muted)",marginTop:4}}>{results.filter(r=>r.correct).length}/{results.length} correct</div>
              </div>
              <h3 style={{fontFamily:"Syne",fontWeight:700,marginBottom:12}}>Review</h3>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
                {results.map((r,i)=>(
                  <div key={i} className="card card-sm" style={{borderLeft:`4px solid ${r.correct?"var(--accent3)":"var(--accent)"}`}}>
                    <div style={{fontSize:13,fontWeight:600}}>{r.question}</div>
                    <div style={{fontSize:12,color:r.correct?"var(--accent3)":"var(--accent)",marginTop:4}}>
                      {r.correct?"✅":"❌"} You: {r.selected}{!r.correct&&<span style={{color:"var(--muted)"}}> · Correct: {r.answer}</span>}
                    </div>
                  </div>
                ))}
              </div>
              {loadingRecs&&<div style={{display:"flex",gap:8,alignItems:"center",color:"var(--muted)",fontSize:13,marginBottom:12}}><span className="spinner dark"/>Generating recommendations…</div>}
              {recs.length>0&&(
                <div style={{marginBottom:24}}>
                  <h3 style={{fontFamily:"Syne",fontWeight:700,marginBottom:12}}>🤖 Personalized Recommendations</h3>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {recs.map((r,i)=>(
                      <div key={i} className="rec-card"><div className="rec-icon">{r.icon}</div><div><div className="rec-title">{r.title}</div><div className="rec-desc">{r.desc}</div></div></div>
                    ))}
                  </div>
                </div>
              )}
              <button className="btn btn-primary" onClick={startQuiz} disabled={loadingQuiz}>🔄 Retake Quiz</button>
            </div>
          )}
        </div>
      )}

      {tab==="analytics"&&(
        <div>
          <div className="grid-3" style={{marginBottom:24}}>
            <div className="stat-card"><div className="stat-value">{set.cards.length}</div><div className="stat-label">Total Cards</div></div>
            <div className="stat-card"><div className="stat-value">{set.quizHistory.length}</div><div className="stat-label">Quizzes Taken</div></div>
            <div className="stat-card">
              <div className="stat-value">{set.quizHistory.length?Math.round(set.quizHistory.reduce((a,h)=>a+h.score,0)/set.quizHistory.length)+"%":"–"}</div>
              <div className="stat-label">Average Score</div>
            </div>
          </div>
          {set.quizHistory.length>0
            ?<div className="card">
                <h3 style={{fontFamily:"Syne",fontWeight:700,marginBottom:16}}>Score Trend</h3>
                <div style={{display:"flex",alignItems:"flex-end",gap:12,height:100}}>
                  {set.quizHistory.map((h,i)=>(
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <div style={{fontSize:11,fontWeight:600}}>{h.score}%</div>
                      <div style={{width:"100%",background:h.score>=80?"var(--accent3)":h.score>=60?"var(--accent2)":"var(--accent)",borderRadius:"4px 4px 0 0",height:h.score*.7}}/>
                      <div style={{fontSize:10,color:"var(--muted)",whiteSpace:"nowrap"}}>{h.date.slice(5)}</div>
                    </div>
                  ))}
                </div>
              </div>
            :<div className="empty" style={{padding:"40px 0"}}><div className="empty-icon">📊</div><div className="empty-text">No quiz data yet</div></div>
          }
        </div>
      )}
    </div>
  );
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
function LeaderboardPage({sets}) {
  const [shareModal,setShareModal]=useState(false);
  const [shareCode]=useState("LEARN-"+Math.random().toString(36).slice(2,7).toUpperCase());
  const lb=DEMO_LB.map(u=>{const avg=Math.round(u.scores.reduce((a,b)=>a+b,0)/u.scores.length);return {...u,avg};}).sort((a,b)=>b.avg-a.avg);
  const rankLabel=(i)=>{if(i===0)return{label:"🥇",cls:"gold"};if(i===1)return{label:"🥈",cls:"silver"};if(i===2)return{label:"🥉",cls:"bronze"};return{label:`#${i+1}`,cls:""};};
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Leaderboard</div><div className="page-subtitle">Compete with classmates</div></div>
        <button className="btn btn-primary" onClick={()=>setShareModal(true)}>📤 Share My Scores</button>
      </div>
      <div className="card" style={{marginBottom:24}}>
        <h3 style={{fontFamily:"Syne",fontWeight:700,marginBottom:16}}>🏆 Top Learners This Week</h3>
        {lb.map((u,i)=>{const r=rankLabel(i);return(
          <div key={u.id} className="lb-row" style={{background:u.name==="You"?"var(--warm)":"var(--card)"}}>
            <div className={`lb-rank ${r.cls}`}>{r.label}</div>
            <div className="lb-avatar" style={{background:u.color}}>{u.avatar}</div>
            <div style={{flex:1}}>
              <div className="lb-name">{u.name}{u.name==="You"&&<span className="badge badge-green" style={{marginLeft:8}}>You</span>}</div>
              <div className="lb-badge-sub">{u.sets} sets · {u.scores.length} quizzes</div>
            </div>
            <div className="lb-score">{u.avg}%</div>
          </div>
        );})}
      </div>
      <div className="grid-2">
        <div className="card">
          <h3 style={{fontFamily:"Syne",fontWeight:700,marginBottom:12}}>Your Stats vs Average</h3>
          {[{l:"Avg Quiz Score",you:79,avg:72,max:100},{l:"Sets Studied",you:3,avg:5,max:8},{l:"Streak Days",you:5,avg:3,max:7}].map((s,i)=>(
            <div key={i} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                <span style={{fontWeight:600}}>{s.l}</span>
                <span style={{color:"var(--muted)"}}>You: <strong style={{color:"var(--ink)"}}>{s.you}{s.l.includes("Score")?"%":""}</strong> · Avg: {s.avg}{s.l.includes("Score")?"%":""}</span>
              </div>
              <div style={{height:6,background:"var(--warm)",borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(s.you/s.max)*100}%`,background:"var(--accent2)",borderRadius:99}}/>
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <h3 style={{fontFamily:"Syne",fontWeight:700,marginBottom:12}}>Subject Rankings</h3>
          {[{sub:"Biology",rank:2,total:5,em:"🧬"},{sub:"Language",rank:3,total:5,em:"🌐"},{sub:"History",rank:1,total:4,em:"📜"}].map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<2?"1px solid var(--border)":"none"}}>
              <span style={{fontSize:20}}>{s.em}</span>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{s.sub}</div><div style={{fontSize:12,color:"var(--muted)"}}>Rank {s.rank} of {s.total}</div></div>
              <span className={`badge ${s.rank===1?"badge-gold":s.rank===2?"badge-blue":"badge-orange"}`}>#{s.rank}</span>
            </div>
          ))}
        </div>
      </div>
      {shareModal&&(
        <Modal title="📤 Share Your Scores" onClose={()=>setShareModal(false)}>
          <p style={{color:"var(--muted)",fontSize:14,marginBottom:20}}>Share this code with classmates so they can compete with you.</p>
          <div style={{background:"var(--warm)",border:"1px solid var(--border)",borderRadius:"var(--r-sm)",padding:"16px 20px",textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:6,letterSpacing:1}}>YOUR SHARE CODE</div>
            <div style={{fontFamily:"DM Mono",fontSize:28,fontWeight:700,letterSpacing:4}}>{shareCode}</div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={()=>{navigator.clipboard?.writeText(shareCode);setShareModal(false);}}>📋 Copy Code</button>
            <button className="btn btn-secondary" onClick={()=>setShareModal(false)}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── AI Schedule ───────────────────────────────────────────────────────────────
function SchedulePage({sets}) {
  const [schedule,setSchedule]=useState(null);
  const [loading,setLoading]=useState(false);
  const [goal,setGoal]=useState("");
  const [hours,setHours]=useState("1");
  const [examDate,setExamDate]=useState("");

  async function generate(){
    setLoading(true);
    try{
      const info=sets.map(s=>`"${s.name}" (${s.cards.length} cards, last: ${s.quizHistory.at(-1)?.score??"none"}%)`).join(", ");
      const raw=await callClaude([{role:"user",content:`Create a 7-day personalized study schedule.
Study sets: ${info||"none yet"}
Goal: ${goal||"General review"}
Hours/day: ${hours}
Exam date: ${examDate||"none"}
Return ONLY JSON (no markdown):
{"days":[{"day":"Monday","load":"light|medium|heavy","tasks":[{"set":"name","activity":"Flashcards|Quiz|Review","duration":"20 min","color":"#hex","icon":"emoji"}]}],"tips":["tip1","tip2","tip3"]}`}]);
      setSchedule(JSON.parse(raw.replace(/```json|```/g,"").trim()));
    }catch{alert("Generation failed. Try again.");}
    finally{setLoading(false);}
  }

  const loadColor=l=>l==="heavy"?"var(--accent)":l==="medium"?"var(--accent2)":"var(--accent3)";

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">AI Schedule</div><div className="page-subtitle">Personalized weekly study plan</div></div>
      </div>
      {!schedule&&(
        <div className="card" style={{maxWidth:560,margin:"0 auto"}}>
          <h3 style={{fontFamily:"Syne",fontWeight:700,marginBottom:20}}>🗓️ Generate My Schedule</h3>
          <div className="form-group"><label className="label">Study Goal</label>
            <input className="input" value={goal} onChange={e=>setGoal(e.target.value)} placeholder="e.g. Pass AP Biology, improve Spanish vocab…"/></div>
          <div className="grid-2">
            <div className="form-group"><label className="label">Hours Per Day</label>
              <select className="input" value={hours} onChange={e=>setHours(e.target.value)}>
                {["0.5","1","1.5","2","3"].map(h=><option key={h} value={h}>{h} hr{h!=="1"?"s":""}</option>)}
              </select></div>
            <div className="form-group"><label className="label">Exam / Target Date</label>
              <input className="input" type="date" value={examDate} onChange={e=>setExamDate(e.target.value)}/></div>
          </div>
          <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={generate} disabled={loading||sets.length===0}>
            {loading?<><span className="spinner"/>Building schedule…</>:sets.length===0?"Create study sets first":"✨ Generate Schedule"}</button>
          {sets.length===0&&<p style={{fontSize:12,color:"var(--muted)",textAlign:"center",marginTop:8}}>You need at least one study set first.</p>}
        </div>
      )}
      {schedule&&(
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
            <button className="btn btn-secondary btn-sm" onClick={()=>setSchedule(null)}>↩ Regenerate</button>
          </div>
          {schedule.days?.map((day,i)=>(
            <div key={i} className="schedule-day">
              <div className="schedule-day-header">
                <div className="schedule-day-name">{day.day}</div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:loadColor(day.load)}}/>
                  <span style={{fontSize:12,color:"var(--muted)"}}>{day.load}</span>
                </div>
              </div>
              {day.tasks?.map((task,j)=>(
                <div key={j} className="schedule-task">
                  <div className="schedule-task-dot" style={{background:task.color||"var(--accent2)"}}/>
                  <span style={{fontSize:16}}>{task.icon}</span>
                  <div style={{flex:1}}><span style={{fontWeight:600}}>{task.set}</span><span style={{color:"var(--muted)",marginLeft:8}}>{task.activity}</span></div>
                  <span style={{fontSize:12,color:"var(--muted)"}}>{task.duration}</span>
                </div>
              ))}
            </div>
          ))}
          {schedule.tips?.length>0&&(
            <div className="card" style={{marginTop:16}}>
              <h3 style={{fontFamily:"Syne",fontWeight:700,marginBottom:12}}>💡 AI Study Tips</h3>
              {schedule.tips.map((tip,i)=>(
                <div key={i} style={{display:"flex",gap:10,fontSize:14,padding:"8px 0",borderBottom:i<schedule.tips.length-1?"1px solid var(--border)":"none"}}>
                  <span>✦</span><span style={{color:"var(--muted)"}}>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Progress ──────────────────────────────────────────────────────────────────
function ProgressPage({sets}) {
  const all=sets.flatMap(s=>s.quizHistory.map(h=>({...h,set:s.name}))).sort((a,b)=>b.date.localeCompare(a.date));
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Progress</div><div className="page-subtitle">Your complete learning history</div></div>
      </div>
      <div className="grid-2">
        <div className="card">
          <h3 style={{fontFamily:"Syne",fontWeight:700,marginBottom:16}}>Performance by Set</h3>
          {sets.length===0?<p style={{color:"var(--muted)",fontSize:14}}>No data yet</p>:sets.map(s=>{
            const avg=s.quizHistory.length?Math.round(s.quizHistory.reduce((a,h)=>a+h.score,0)/s.quizHistory.length):null;
            return(<div key={s.id} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                <span style={{fontWeight:600}}>{s.name}</span>
                <span style={{color:avg==null?"var(--muted)":avg>=80?"var(--accent3)":"var(--accent2)"}}>{avg!=null?avg+"%":"No quizzes"}</span>
              </div>
              {avg!=null&&<div style={{height:6,background:"var(--warm)",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:avg+"%",background:avg>=80?"var(--accent3)":"var(--accent2)",borderRadius:99}}/></div>}
            </div>);
          })}
        </div>
        <div className="card">
          <h3 style={{fontFamily:"Syne",fontWeight:700,marginBottom:16}}>Recent Activity</h3>
          {all.length===0?<p style={{color:"var(--muted)",fontSize:14}}>No quiz history yet.</p>:all.slice(0,8).map((h,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)",fontSize:13}}>
              <div><span style={{fontWeight:600}}>{h.set}</span><span style={{color:"var(--muted)",marginLeft:8}}>{h.date}</span></div>
              <span className={`badge ${h.score>=80?"badge-green":h.score>=60?"badge-blue":"badge-orange"}`}>{h.score}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [dark,setDark]=useState(false);
  const [page,setPage]=useState("dashboard");
  const [sets,setSets]=useState(DEMO_SETS);
  const [activeSet,setActiveSet]=useState(null);
  const [showNewSet,setShowNewSet]=useState(false);
  const [toast,setToast]=useState(null);

  useEffect(()=>{
    let el=document.getElementById("lai-css");
    if(!el){el=document.createElement("style");el.id="lai-css";document.head.appendChild(el);}
    el.textContent=buildCss(dark);
  },[dark]);

  function handleCreate(s){setSets(p=>[...p,s]);setShowNewSet(false);setToast(`✨ "${s.name}" created with ${s.cards.length} cards!`);}
  function handleUpdate(u){setSets(p=>p.map(s=>s.id===u.id?u:s));if(activeSet?.id===u.id)setActiveSet(u);}

  const NAV=[
    {id:"dashboard",icon:"⊞",label:"Dashboard"},
    {id:"sets",icon:"📚",label:"Study Sets"},
    {id:"leaderboard",icon:"🏆",label:"Leaderboard"},
    {id:"schedule",icon:"🗓️",label:"AI Schedule"},
    {id:"progress",icon:"📈",label:"Progress"},
  ];

  return (
    <>
      <div className="app">
        <nav className="sidebar">
          <div className="logo">learn<span>AI</span></div>
          <div className="nav-section">Menu</div>
          {NAV.map(n=>(
            <div key={n.id} className={`nav-item ${page===n.id&&!activeSet?"active":""}`} onClick={()=>{setPage(n.id);setActiveSet(null);}}>
              <span className="nav-icon">{n.icon}</span>{n.label}
            </div>
          ))}
          <div style={{flex:1}}/>
          <div className="nav-item" onClick={()=>setDark(d=>!d)}>
            <span className="nav-icon">{dark?"☀️":"🌙"}</span>{dark?"Light Mode":"Dark Mode"}
          </div>
          <div style={{fontSize:11,color:"rgba(247,245,240,.2)",padding:"8px 12px"}}>Powered by Claude AI</div>
        </nav>
        <main className="main">
          {page==="dashboard"&&<Dashboard sets={sets} onNav={p=>setPage(p)}/>}
          {page==="sets"&&!activeSet&&<StudySetsPage sets={sets} onSelect={s=>{setActiveSet(s);setPage("setDetail");}} onNew={()=>setShowNewSet(true)}/>}
          {page==="setDetail"&&activeSet&&<SetDetail set={activeSet} onBack={()=>{setPage("sets");setActiveSet(null);}} onUpdateSet={handleUpdate}/>}
          {page==="leaderboard"&&<LeaderboardPage sets={sets}/>}
          {page==="schedule"&&<SchedulePage sets={sets}/>}
          {page==="progress"&&<ProgressPage sets={sets}/>}
        </main>
      </div>
      {showNewSet&&<NewSetModal onClose={()=>setShowNewSet(false)} onCreate={handleCreate}/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
    </>
  );
}