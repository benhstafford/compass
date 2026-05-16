import { useState, useEffect } from 'react';
import { Trash2, TrendingUp, Zap, Clock, CalendarClock, ArrowRight } from 'lucide-react';
import { SCORING_GUIDE, PERSONAL_SCORING_GUIDE, URGENCY_LABELS, PROVENANCE_OPTIONS, calcUrgency, calcScore, scoreColors, getNudge } from '../lib/scoring';
import ScaleField from './ScaleField';

const CRITERION_ICONS = {
  careerAlignment: <TrendingUp size={14} />,
  leverage: <Zap size={14} />,
  effort: <Clock size={14} />,
};

const toDatetimeLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function EditModal({ task, allProjects, onCommit, onClose, onDelete, onTransfer, mode = 'work' }) {
  const [local, setLocal] = useState(task);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    setLocal(task);
    setDeleted(false);
  }, [task.id]);

  // Lock body scroll while modal is open; restore on close
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const update = (updates) => setLocal(prev => ({ ...prev, ...updates }));
  const updateScored = (updates) => update({ ...updates, scored: true });

  const handleClose = () => {
    if (!deleted) onCommit(local);
    onClose();
  };

  const handleDelete = () => {
    setDeleted(true);
    onDelete();
    onClose();
  };

  const handleTransfer = () => {
    onTransfer(local);
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, deleted]);

  const scoringGuide = mode === 'personal' ? PERSONAL_SCORING_GUIDE : SCORING_GUIDE;
  const score = calcScore(local);
  const c = scoreColors(score);
  const u = calcUrgency(local.dueDate);
  const nudge = mode === 'work' ? getNudge(local) : null;

  return (
    <div className="modal-bg" onClick={handleClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fafaf7', maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(26,26,26,0.25)', borderRadius: 4 }}
      >
        <div style={{ padding: '26px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, paddingBottom: 16, borderBottom: '1px solid #e8e6e0', marginBottom: 20 }}>
            <input
              value={local.title}
              onChange={(e) => update({ title: e.target.value })}
              style={{ flex: 1, fontSize: 19, fontWeight: 500, letterSpacing: '-0.01em' }}
            />
            <div className="mono" style={{ width: 60, height: 60, borderRadius: '50%', background: c.bg, color: c.fg, fontSize: 22, fontWeight: 500, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {score}
            </div>
          </div>

          <div className="edit-2col">
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 4 }}>Project</label>
              <input list="proj-list" value={local.project} onChange={(e) => update({ project: e.target.value })} placeholder="—" className="field-input" />
              <datalist id="proj-list">{allProjects.map(p => <option key={p} value={p} />)}</datalist>
            </div>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 4 }}>Due date</label>
              <input type="date" value={local.dueDate} onChange={(e) => update({ dueDate: e.target.value })} className="field-input" />
            </div>
          </div>

          {local.completed && (
            <div style={{ marginBottom: 18 }}>
              <label className="label" style={{ display: 'block', marginBottom: 4 }}>Completed at</label>
              <input
                type="datetime-local"
                value={toDatetimeLocal(local.completedAt)}
                onChange={(e) => update({ completedAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="field-input"
              />
            </div>
          )}

          <div style={{ marginBottom: 22 }}>
            <label className="label" style={{ display: 'block', marginBottom: 8 }}>Whose ask is this?</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PROVENANCE_OPTIONS.map(opt => {
                const selected = local.provenance === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => update({ provenance: selected ? '' : opt })}
                    style={{
                      padding: '5px 14px',
                      fontSize: 12,
                      fontWeight: 500,
                      fontFamily: 'inherit',
                      border: '1px solid',
                      borderColor: selected ? '#1a1a1a' : '#d8d6d0',
                      borderRadius: 20,
                      background: selected ? '#1a1a1a' : 'transparent',
                      color: selected ? '#fafaf7' : '#5a5854',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {Object.entries(scoringGuide).map(([key, guide]) => (
            <ScaleField key={key} guide={guide} value={local[key]} onChange={(v) => updateScored({ [key]: v })} icon={CRITERION_ICONS[key]} />
          ))}

          <div style={{ paddingTop: 14, paddingBottom: 14, borderTop: '1px solid #e8e6e0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ color: '#888581', display: 'flex' }}><CalendarClock size={14} /></span>
              <h4 style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
                Urgency <span className="label" style={{ marginLeft: 8 }}>auto · ×3</span>
              </h4>
              <span className="mono" style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 500 }}>
                {u} <span style={{ color: '#888581', fontWeight: 400 }}>· {URGENCY_LABELS[u]}</span>
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#6b6b68', margin: 0 }}>Calculated from due date. Counts triple in the score.</p>
          </div>

          {nudge && (
            <div style={{ paddingTop: 14, paddingBottom: 14, borderTop: '1px solid #e8e6e0' }}>
              <p style={{ fontSize: 12, fontStyle: 'italic', color: '#888581', margin: 0, paddingLeft: 12, borderLeft: '2px solid #c45b3f' }}>
                {nudge}
              </p>
            </div>
          )}

          <div style={{ paddingTop: 16, paddingBottom: 4, borderTop: '1px solid #1a1a1a' }}>
            <p className="mono" style={{ fontSize: 11, color: '#5a5854', margin: 0 }}>
              {mode === 'personal' ? (
                <>{local.careerAlignment} <span style={{ color: '#888581' }}>relationship</span> + {local.leverage} <span style={{ color: '#888581' }}>consequence</span> + 3×{u} <span style={{ color: '#888581' }}>urgency</span> − {local.effort} <span style={{ color: '#888581' }}>effort to start</span> = <strong>{score}</strong></>
              ) : (
                <>{local.careerAlignment} <span style={{ color: '#888581' }}>career</span> + {local.leverage} <span style={{ color: '#888581' }}>leverage</span> + 3×{u} <span style={{ color: '#888581' }}>urgency</span> − {local.effort} <span style={{ color: '#888581' }}>effort</span> = <strong>{score}</strong></>
              )}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, marginTop: 8, borderTop: '1px solid #e8e6e0' }}>
            <button onClick={handleDelete} className="icn" style={{ color: '#c45b3f', fontSize: 12 }}>
              <Trash2 size={13} /> Delete
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {onTransfer && (
                <button onClick={handleTransfer} className="icn" style={{ fontSize: 12 }}>
                  <ArrowRight size={13} /> Personal
                </button>
              )}
              <button onClick={handleClose} className="primary-btn">Done</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
