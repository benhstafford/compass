import { CheckCircle2, Undo2, Trash2, Pencil } from 'lucide-react';
import EmptyState from './EmptyState';

export default function DoneView({ tasks, onUndo, onDelete, onEdit }) {
  if (tasks.length === 0) return <EmptyState title="Nothing checked off yet." />;

  const grouped = tasks.reduce((acc, t) => {
    const date = new Date(t.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    (acc[date] = acc[date] || []).push(t);
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} style={{ marginBottom: 24 }}>
          <h3 className="label" style={{ marginBottom: 8, marginTop: 0 }}>{date}</h3>
          {items.map(t => {
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid #e8e6e0' }}>
                <CheckCircle2 size={18} style={{ color: '#2d5a3d', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, textDecoration: 'line-through', color: '#888581', margin: 0 }}>{t.title}</p>
                  {t.project && (
                    <div style={{ fontSize: 11, color: '#a8a8a4', marginTop: 2 }}>
                      {t.project}
                    </div>
                  )}
                </div>
                <button onClick={() => onEdit(t.id)} className="icn" title="Edit"><Pencil size={13} /></button>
                <button onClick={() => onUndo(t.id)} className="icn" title="Mark incomplete"><Undo2 size={14} /></button>
                <button onClick={() => onDelete(t.id)} className="icn" title="Delete"><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
