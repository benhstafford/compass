import { calcScore, scoreColors, rankColor } from '../lib/scoring';

export default function TaskRow({ task, onEdit, onComplete, rank, total }) {
  const score = calcScore(task);
  const c = rank !== undefined ? rankColor(rank, total) : scoreColors(score);
  const isOverdue = task.dueDate && new Date(task.dueDate + 'T00:00:00') < new Date(new Date().setHours(0, 0, 0, 0));
  const dueText = task.dueDate
    ? new Date(task.dueDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid #e8e6e0' }}>
      <button onClick={onComplete} className="icn" style={{ flexShrink: 0, padding: 0 }} aria-label="Mark complete">
        <div className="check-circle" />
      </button>
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onEdit}>
        <div style={{ fontSize: 14.5, lineHeight: 1.4, marginBottom: 3 }}>
          {task.title}
          {!task.scored && (
            <span style={{ fontSize: 10, color: '#c45b3f', marginLeft: 10, verticalAlign: '1px' }}>
              · unscored
            </span>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: '#888581', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {task.project && <span>{task.project}</span>}
          {task.project && dueText && <span style={{ color: '#c8c5be' }}>·</span>}
          {dueText && (
            <span style={{ color: isOverdue ? '#c45b3f' : '#888581' }}>
              {isOverdue ? `Overdue (${dueText})` : `Due ${dueText}`}
            </span>
          )}
          {task.provenance && task.provenance !== 'Me' && (task.project || dueText) && (
            <span style={{ color: '#c8c5be' }}>·</span>
          )}
          {task.provenance && task.provenance !== 'Me' && (
            <span style={{ color: '#a8a8a4' }}>{task.provenance}</span>
          )}
        </div>
      </div>
      <div
        onClick={onEdit}
        className="mono"
        style={{ width: 44, height: 44, borderRadius: '50%', background: c.bg, color: c.fg, fontSize: 16, fontWeight: 500, flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s' }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {score}
      </div>
    </div>
  );
}
