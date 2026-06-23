import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import {
  aiHealth, listJobs, createJob, analyzeCvFile, listCandidates, candidateDetail,
  generateInterview, rematch,
} from '../services/recruitmentService';

// ============================================================================
//  Recrutement IA — embedded dashboard panel (modern UI, no own sidebar)
// ============================================================================

const C = {
  navy: '#0b2147', navy2: '#15347a', cyan: '#06b6d4', cyanD: '#0e7490',
  amber: '#f59e0b', green: '#16a34a', red: '#dc2626',
  bg: '#f5f7fb', card: '#ffffff', border: '#e7ecf4', text: '#0f172a', muted: '#6b7a90',
};

function scoreColor(s) {
  if (s == null) return '#cbd5e1';
  if (s >= 75) return C.green;
  if (s >= 50) return C.amber;
  return C.red;
}

function Gauge({ value, label, size = 84 }) {
  const v = value == null ? 0 : Math.max(0, Math.min(100, value));
  const col = scoreColor(value);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `conic-gradient(${col} ${v * 3.6}deg, #eef2f7 0deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: size - 16, height: size - 16, borderRadius: '50%', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.28, fontWeight: 800, color: col,
        }}>{value == null ? '—' : value}</div>
      </div>
      {label && <div style={{ color: C.muted, fontSize: 12, marginTop: 6, fontWeight: 600 }}>{label}</div>}
    </div>
  );
}

const STATUS_STYLE = {
  new: { bg: '#e0f2fe', fg: '#0369a1', label: 'Nouveau' },
  shortlisted: { bg: '#dcfce7', fg: '#15803d', label: 'Présélectionné' },
  interview: { bg: '#fef9c3', fg: '#a16207', label: 'Entretien' },
  rejected: { bg: '#fee2e2', fg: '#b91c1c', label: 'Rejeté' },
  hired: { bg: '#ddd6fe', fg: '#6d28d9', label: 'Embauché' },
};

export default function RecrutementPanel({ currentUser, companyId }) {
  const [user, setUser] = useState(currentUser || null);
  const cid = companyId || currentUser?.company_id || user?.company_id;

  const [health, setHealth] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [detail, setDetail] = useState(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', description: '', location: '', seniority: 'Confirmé' });
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { init(); /* eslint-disable-next-line */ }, []);

  async function init() {
    let resolved = cid;
    if (!resolved) {
      const email = localStorage.getItem('email');
      if (email) {
        const { data } = await supabase.from('users').select('*').eq('email', email);
        if (data && data.length) { setUser(data[0]); resolved = data[0].company_id; }
      }
    }
    try { setHealth(await aiHealth()); } catch (e) { setHealth({ ok: false, reason: e.message }); }
    await refresh(resolved);
  }

  async function refresh(companyIdArg) {
    const c = companyIdArg || cid;
    try {
      setJobs((await listJobs(c)).jobs || []);
      setCandidates((await listCandidates({ companyId: c })).candidates || []);
    } catch (e) { setError(e.message); }
  }

  async function doUpload(file) {
    if (!file) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await analyzeCvFile(file, { companyId: cid, jobOfferId: selectedJob || undefined });
      setResult(res);
      await refresh();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function submitJob(e) {
    e.preventDefault();
    try {
      await createJob({ ...jobForm, company_id: cid, created_by: user?.id });
      setJobForm({ title: '', description: '', location: '', seniority: 'Confirmé' });
      setShowJobForm(false);
      await refresh();
    } catch (err) { setError(err.message); }
  }

  async function openCandidate(id) {
    try { setDetail(await candidateDetail(id)); } catch (e) { setError(e.message); }
  }

  const topCount = candidates.filter(c => (c.match_score ?? c.overall_score ?? 0) >= 75).length;

  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      {/* ===== HERO ===== */}
      <div style={hero}>
        <div style={{ position: 'absolute', right: -50, top: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
        <div style={{ position: 'absolute', right: 90, bottom: -70, width: 160, height: 160, borderRadius: '50%', background: 'rgba(6,182,212,.18)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 30 }}>🤖</span>
            <h1 style={{ margin: 0, fontSize: 27, fontWeight: 800, letterSpacing: -.5 }}>Recrutement IA</h1>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 999,
              background: health?.ok ? 'rgba(34,197,94,.22)' : 'rgba(239,68,68,.22)',
              border: `1px solid ${health?.ok ? 'rgba(134,239,172,.5)' : 'rgba(252,165,165,.5)'}`,
            }}>{health?.ok ? `● Connectée · ${health.model}` : '● IA indisponible'}</span>
          </div>
          <p style={{ margin: '8px 0 0', opacity: .82, fontSize: 14.5 }}>
            Analysez, classez et comparez des CV automatiquement — propulsé par Groq (Llama 3.3).
          </p>
          <div style={{ display: 'flex', gap: 14, marginTop: 20, flexWrap: 'wrap' }}>
            <HeroStat n={candidates.length} l="Candidats" />
            <HeroStat n={jobs.length} l="Offres ouvertes" />
            <HeroStat n={topCount} l="Top profils (≥75)" />
          </div>
        </div>
      </div>

      {error && <Banner color={C.red}>{error}</Banner>}
      {health && !health.ok && <Banner color={C.amber}>IA non connectée — {health.reason}. Vérifiez GROQ_API_KEY dans .env puis redémarrez le serveur.</Banner>}

      {/* ===== UPLOAD + OPTIONS ===== */}
      <Card>
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'stretch' }}>
          <label
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); doUpload(e.dataTransfer.files?.[0]); }}
            style={{
              flex: 2, minWidth: 290, cursor: 'pointer', borderRadius: 16, padding: '34px 22px',
              border: `2px dashed ${dragOver ? C.cyan : '#cdd7e6'}`,
              background: dragOver ? 'rgba(6,182,212,.07)' : 'linear-gradient(180deg,#fbfcff,#f4f7fc)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', transition: 'all .15s',
            }}>
            <div style={{ fontSize: 40 }}>{loading ? '⏳' : '📤'}</div>
            <div style={{ fontWeight: 800, color: C.navy2, marginTop: 10, fontSize: 16 }}>
              {loading ? 'Analyse du CV en cours…' : 'Glissez un CV ici ou cliquez pour importer'}
            </div>
            <div style={{ color: C.muted, fontSize: 13, marginTop: 5 }}>Formats acceptés : PDF · DOCX · TXT</div>
            <input type="file" accept=".pdf,.docx,.txt" disabled={loading}
              onChange={e => { doUpload(e.target.files?.[0]); e.target.value = ''; }}
              style={{ display: 'none' }} />
          </label>

          <div style={{ flex: 1, minWidth: 250, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={lbl}>Comparer le CV importé à une offre</label>
              <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)} style={input}>
                <option value="">— Analyse simple (sans matching) —</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
                Sélectionnez une offre puis importez un CV pour obtenir un score de matching.
              </div>
            </div>
            <button onClick={() => setShowJobForm(s => !s)} style={btnGhost}>
              {showJobForm ? '✕ Annuler' : '＋ Créer une offre d\'emploi'}
            </button>
            {showJobForm && (
              <form onSubmit={submitJob} style={{ display: 'grid', gap: 9, background: '#f8fafd', padding: 14, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <input required placeholder="Titre du poste" value={jobForm.title}
                  onChange={e => setJobForm({ ...jobForm, title: e.target.value })} style={input} />
                <textarea required placeholder="Description et compétences requises…" rows={3} value={jobForm.description}
                  onChange={e => setJobForm({ ...jobForm, description: e.target.value })} style={{ ...input, resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder="Lieu" value={jobForm.location}
                    onChange={e => setJobForm({ ...jobForm, location: e.target.value })} style={{ ...input, flex: 1 }} />
                  <select value={jobForm.seniority} onChange={e => setJobForm({ ...jobForm, seniority: e.target.value })} style={input}>
                    {['Stagiaire', 'Junior', 'Confirmé', 'Senior', 'Lead', 'Manager'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <button type="submit" style={btnPrimary}>Enregistrer l'offre</button>
              </form>
            )}
          </div>
        </div>
      </Card>

      {/* ===== LAST RESULT ===== */}
      {result && <AnalysisResult result={result} />}

      {/* ===== CANDIDATES ===== */}
      <Card>
        <Row>
          <H2>👥 Candidats <span style={{ color: C.muted, fontWeight: 600 }}>({candidates.length})</span></H2>
        </Row>
        {candidates.length === 0 ? (
          <Empty>Aucun candidat pour le moment. Importez un CV pour démarrer.</Empty>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))', gap: 16, marginTop: 14 }}>
            {candidates.map(c => {
              const st = STATUS_STYLE[c.status] || STATUS_STYLE.new;
              const top = c.match_score ?? c.overall_score;
              return (
                <div key={c.id} onClick={() => openCandidate(c.id)} style={candCard}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 30px -16px rgba(15,52,122,.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px -7px rgba(15,52,122,.35)'; }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={avatar}>{(c.full_name || '?').trim()[0]?.toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: C.navy2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.full_name || '—'}</div>
                      <div style={{ color: C.muted, fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.current_title || c.job_category || '—'}</div>
                    </div>
                    <Gauge value={top} size={54} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 13, alignItems: 'center' }}>
                    {c.job_category && <Tag>{c.job_category}</Tag>}
                    {c.seniority_level && <Tag>{c.seniority_level}</Tag>}
                    <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: st.bg, color: st.fg }}>{st.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 13, paddingTop: 12, borderTop: `1px solid ${C.border}`, fontSize: 12.5, color: C.muted }}>
                    <span>Qualité CV <b style={{ color: scoreColor(c.overall_score) }}>{c.overall_score ?? '—'}</b></span>
                    <span>Match <b style={{ color: scoreColor(c.match_score) }}>{c.match_score ?? '—'}</b></span>
                    <span style={{ marginLeft: 'auto', color: C.cyanD, fontWeight: 700 }}>Détails →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {detail && (
        <CandidateModal
          detail={detail}
          jobs={jobs}
          onClose={() => setDetail(null)}
          onUpdated={async (id) => { await refresh(); try { setDetail(await candidateDetail(id)); } catch { /* keep */ } }}
        />
      )}

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

// ─────────────── sub-components ───────────────
function HeroStat({ n, l }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 14, padding: '12px 18px', minWidth: 120 }}>
      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 12, opacity: .85, marginTop: 5 }}>{l}</div>
    </div>
  );
}
function Banner({ color, children }) {
  return <div style={{ background: `${color}15`, color, padding: '13px 16px', borderRadius: 12, margin: '0 0 18px', fontWeight: 600, border: `1px solid ${color}33` }}>{children}</div>;
}
function Card({ children }) {
  return <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, margin: '0 0 22px', boxShadow: '0 8px 26px -20px rgba(15,52,122,.45)' }}>{children}</section>;
}
function Row({ children }) { return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>{children}</div>; }
function H2({ children }) { return <h2 style={{ color: C.navy2, margin: 0, fontSize: 20, fontWeight: 800 }}>{children}</h2>; }
function Tag({ children }) { return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: '#eef2f8', color: C.muted }}>{children}</span>; }
function Empty({ children }) { return <div style={{ textAlign: 'center', color: C.muted, padding: '34px 0', fontSize: 14 }}>{children}</div>; }
function Col({ title, items, color }) {
  if (!items || !items.length) return null;
  return (
    <div>
      <b style={{ color: color || C.navy2 }}>{title}</b>
      <ul style={{ margin: '6px 0', paddingLeft: 18 }}>{items.map((x, i) => <li key={i} style={{ marginBottom: 4, color: color || C.text }}>{x}</li>)}</ul>
    </div>
  );
}

function AnalysisResult({ result }) {
  const a = result.analysis || {}, cl = result.classification || {}, m = result.match;
  return (
    <Card>
      <Row><H2>✨ Dernière analyse — {a.full_name || 'Candidat'}</H2></Row>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 22, marginTop: 14 }}>
        <div style={{ color: C.text }}>
          <p style={{ color: C.muted, margin: '2px 0 10px' }}>{[a.email, a.phone, a.location].filter(Boolean).join(' · ')}</p>
          <p><b>Résumé.</b> {a.summary}</p>
          <p style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {cl.job_category && <Tag>{cl.job_category}</Tag>}{cl.seniority_level && <Tag>{cl.seniority_level}</Tag>}
            <span style={{ color: C.muted, fontSize: 12 }}>confiance {Math.round((cl.confidence || 0) * 100)}%</span>
          </p>
          <p><b>Compétences.</b> {(a.skills || []).slice(0, 14).join(' · ')}</p>
          {(a.red_flags || []).length > 0 && <p style={{ color: C.red }}><b>⚠️ Attention.</b> {a.red_flags.join(' · ')}</p>}
        </div>
        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Gauge value={a.overall_score} label="Qualité CV" />
          {m && <Gauge value={m.match_score} label="Match poste" />}
        </div>
      </div>
      {m && (
        <div style={{ marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 14, color: C.text }}>
          <p><b>Recommandation.</b> {m.recommendation}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <p style={{ color: C.green }}><b>✓ Atouts.</b> {(m.matching_skills || []).join(', ')}</p>
            <p style={{ color: C.red }}><b>✗ Manques.</b> {(m.missing_skills || []).join(', ') || 'aucun'}</p>
          </div>
          <p style={{ color: C.muted }}>{m.summary}</p>
        </div>
      )}
    </Card>
  );
}

function CandidateModal({ detail, jobs, onClose, onUpdated }) {
  const c = detail.candidate || {};
  const a = detail.analysis?.analysis_json || {};
  const m = detail.analysis?.match_json;
  const [questions, setQuestions] = useState(detail.analysis?.interview_json || null);
  const [genLoading, setGenLoading] = useState(false);
  const [genErr, setGenErr] = useState('');
  const [cmpJob, setCmpJob] = useState(c.job_offer_id || '');
  const [cmpLoading, setCmpLoading] = useState(false);
  const [cmpResult, setCmpResult] = useState(m || null);
  const [cmpErr, setCmpErr] = useState('');

  async function genInterview() {
    setGenLoading(true); setGenErr('');
    try { setQuestions((await generateInterview(c.id, cmpJob || c.job_offer_id)).questions); }
    catch (e) { setGenErr(e.message); }
    finally { setGenLoading(false); }
  }

  async function compare() {
    if (!cmpJob) { setCmpErr('Choisissez une offre à comparer.'); return; }
    setCmpLoading(true); setCmpErr('');
    try {
      const res = await rematch(c.id, cmpJob);
      setCmpResult(res.match);
      onUpdated && onUpdated(c.id);
    } catch (e) { setCmpErr(e.message); }
    finally { setCmpLoading(false); }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,15,35,.55)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 22, maxWidth: 740, width: '100%', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 30px 80px -20px rgba(0,0,0,.5)' }}>
        <div style={{ padding: '24px 28px', color: '#fff', background: `linear-gradient(120deg, ${C.navy} 0%, ${C.cyanD} 135%)`, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ ...avatar, width: 54, height: 54, fontSize: 23, background: 'rgba(255,255,255,.18)' }}>{(c.full_name || '?')[0]?.toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 21, fontWeight: 800 }}>{c.full_name || 'Candidat'}</div>
            <div style={{ opacity: .85, fontSize: 13 }}>{[c.current_title, c.email, c.phone].filter(Boolean).join(' · ')}</div>
          </div>
          {(cmpResult?.match_score ?? c.overall_score) != null && <Gauge value={cmpResult?.match_score ?? c.overall_score} size={62} />}
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 16, alignSelf: 'flex-start' }}>✕</button>
        </div>

        <div style={{ padding: 28, color: C.text }}>
          {a.summary && <p><b>Résumé.</b> {a.summary}</p>}

          {/* ===== COMPARE TO A JOB ===== */}
          <div style={{ background: '#f6f9fd', border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, margin: '14px 0' }}>
            <H2>🎯 Comparer à une offre</H2>
            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <select value={cmpJob} onChange={e => setCmpJob(e.target.value)} style={{ ...input, flex: 1, minWidth: 200 }}>
                <option value="">— Choisir une offre —</option>
                {(jobs || []).map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
              <button onClick={compare} disabled={cmpLoading} style={btnPrimary}>
                {cmpLoading ? '⏳ Comparaison…' : '🔍 Comparer'}
              </button>
            </div>
            {cmpErr && <p style={{ color: C.red, marginBottom: 0 }}>{cmpErr}</p>}
            {cmpResult && (
              <div style={{ marginTop: 14, display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <Gauge value={cmpResult.match_score} label="Match" size={76} />
                <div style={{ flex: 1, minWidth: 220 }}>
                  <p style={{ margin: '0 0 6px' }}><b>{cmpResult.recommendation}</b></p>
                  <p style={{ color: C.green, margin: '0 0 4px' }}>✓ {(cmpResult.matching_skills || []).join(', ') || '—'}</p>
                  <p style={{ color: C.red, margin: 0 }}>✗ {(cmpResult.missing_skills || []).join(', ') || 'aucun manque'}</p>
                  {cmpResult.summary && <p style={{ color: C.muted, marginBottom: 0 }}>{cmpResult.summary}</p>}
                </div>
              </div>
            )}
          </div>

          {(a.experience || []).length > 0 && (<>
            <H2>Expérience</H2>
            {a.experience.map((x, i) => (
              <div key={i} style={{ margin: '8px 0' }}>
                <b>{x.title}</b> — {x.company} <span style={{ color: C.muted }}>({x.duration || '—'})</span>
                <ul style={{ margin: '4px 0' }}>{(x.highlights || []).map((h, k) => <li key={k}>{h}</li>)}</ul>
              </div>
            ))}
          </>)}
          {(a.education || []).length > 0 && (<>
            <H2>Formation</H2>
            <ul>{a.education.map((e, i) => <li key={i}>{e.degree} — {e.institution} {e.year ? `(${e.year})` : ''}</li>)}</ul>
          </>)}

          {/* ===== INTERVIEW ===== */}
          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 18, paddingTop: 16 }}>
            <Row>
              <H2>🎤 Questions d'entretien (IA)</H2>
              <button onClick={genInterview} disabled={genLoading} style={btnPrimary}>
                {genLoading ? '⏳…' : questions ? 'Régénérer' : 'Générer'}
              </button>
            </Row>
            {genErr && <p style={{ color: C.red }}>{genErr}</p>}
            {questions && (
              <div style={{ marginTop: 10 }}>
                <Col title="Techniques" items={questions.technical} />
                <Col title="Parcours" items={questions.experience} />
                <Col title="Comportementales" items={questions.behavioral} />
                <Col title="À clarifier" items={questions.to_clarify} color={C.amber} />
                <Col title="Conseils recruteur" items={questions.tips} color={C.muted} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────── style tokens ───────────────
const hero = {
  borderRadius: 22, padding: '28px 32px', marginBottom: 22, color: '#fff',
  background: `linear-gradient(120deg, ${C.navy} 0%, ${C.navy2} 52%, ${C.cyanD} 135%)`,
  boxShadow: '0 18px 44px -18px rgba(11,33,71,.65)', position: 'relative', overflow: 'hidden',
};
// inputs: force dark text on white so typed text is always visible
const input = {
  padding: '11px 13px', border: `1px solid #d6deeb`, borderRadius: 11, fontSize: 14,
  fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', outline: 'none',
  background: '#ffffff', color: C.text, WebkitTextFillColor: C.text,
};
const lbl = { fontSize: 12.5, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 7 };
const btnPrimary = { background: `linear-gradient(120deg,${C.navy2},${C.cyanD})`, color: '#fff', border: 'none', borderRadius: 11, padding: '11px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' };
const btnGhost = { background: '#fff', color: C.cyanD, border: `1.5px solid ${C.cyan}`, borderRadius: 11, padding: '10px 15px', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const candCard = { background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, cursor: 'pointer', transition: 'transform .14s, box-shadow .14s', boxShadow: '0 2px 12px -7px rgba(15,52,122,.35)' };
const avatar = { width: 46, height: 46, borderRadius: 13, background: `linear-gradient(135deg, ${C.navy2}, ${C.cyanD})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 19, flexShrink: 0 };
