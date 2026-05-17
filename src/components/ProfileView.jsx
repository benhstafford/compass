import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, Download, Trash2, Pencil, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

/* ─── layout helpers ─── */

function Section({ title, description, children, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : 36, paddingBottom: 36, borderBottom: last ? 'none' : '1px solid #e8e6e0' }}>
      {description ? (
        <div style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 5px', color: '#1a1a1a' }}>
            {title}
          </h2>
          <p style={{ fontSize: 12, color: '#a8a8a4', fontStyle: 'italic', margin: 0, lineHeight: 1.4 }}>
            {description}
          </p>
        </div>
      ) : (
        <p className="label" style={{ margin: '0 0 18px' }}>{title}</p>
      )}
      {children}
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      <label className="label" style={{ display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function CardField({ label, children, style }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      <label className="label" style={{ display: 'block', marginBottom: 8 }}>{label}</label>
      <div style={{ border: '1px solid #d8d4cc', borderRadius: 6, background: '#fefcf8', padding: '12px 14px' }}>
        {children}
      </div>
    </div>
  );
}

function CardTextarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%', fontSize: 14, fontFamily: 'inherit',
        background: 'transparent', border: 'none', outline: 'none',
        resize: 'none', padding: 0, lineHeight: 1.6, color: 'inherit', display: 'block',
      }}
    />
  );
}

function CardInput({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%', fontSize: 14, fontFamily: 'inherit',
        background: 'transparent', border: 'none', outline: 'none',
        padding: 0, lineHeight: 1.6, color: 'inherit', display: 'block',
      }}
    />
  );
}

function ModeToggle({ value, onChange }) {
  return (
    <div style={{ display: 'flex', background: '#eeecea', borderRadius: 6, padding: 3 }}>
      {['work', 'personal'].map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            padding: '5px 18px', fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
            border: 'none', borderRadius: 4, cursor: 'pointer',
            background: value === m ? '#1a1a1a' : 'transparent',
            color: value === m ? '#fafaf7' : '#888581',
            transition: 'all 0.15s',
          }}
        >
          {m === 'work' ? 'Work' : 'Personal'}
        </button>
      ))}
    </div>
  );
}

/* ─── project list helpers ─── */

function ProjectRow({ name, count, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const commitRename = () => {
    const n = editName.trim();
    if (n && n !== name) onRename(name, n);
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid #e8e6e0' }}>
        <input
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditing(false); }}
          autoFocus
          style={{
            flex: 1, fontSize: 13, background: 'transparent', border: 'none',
            borderBottom: '1px solid #1a1a1a', outline: 'none',
            padding: '2px 0', fontFamily: 'inherit',
          }}
        />
        <button onClick={commitRename} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#2d5a3d', padding: '2px 6px', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}>✓</button>
        <button onClick={() => setEditing(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#888581', padding: '2px 6px', fontSize: 13, fontFamily: 'inherit' }}>✕</button>
      </div>
    );
  }

  if (confirmDelete) {
    return (
      <div style={{ padding: '10px 0', borderBottom: '1px solid #e8e6e0' }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#c45b3f', lineHeight: 1.4 }}>
          {count > 0
            ? `This project has ${count} task${count === 1 ? '' : 's'}. Deleting it will remove the project label from those tasks. Continue?`
            : 'Delete this project?'}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onDelete(name)}
            style={{
              fontSize: 12, padding: '4px 12px', borderRadius: 3, border: 'none',
              background: '#c45b3f', color: '#fafaf7', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 500,
            }}
          >
            Confirm
          </button>
          <button onClick={() => setConfirmDelete(false)} className="icn" style={{ fontSize: 12 }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid #e8e6e0' }}>
      <span style={{ flex: 1, fontSize: 13 }}>{name}</span>
      {count > 0 && (
        <span style={{ fontSize: 11, color: '#a8a8a4', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
      )}
      <button onClick={() => { setEditing(true); setEditName(name); }} className="icn" style={{ padding: '4px' }}>
        <Pencil size={12} />
      </button>
      <button onClick={() => setConfirmDelete(true)} className="icn" style={{ padding: '4px', color: '#c45b3f' }}>
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function AddProjectRow({ onAdd }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const commit = () => {
    const n = name.trim();
    if (n) onAdd(n);
    setAdding(false);
    setName('');
  };

  if (adding) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10 }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setAdding(false); setName(''); } }}
          placeholder="Project name…"
          autoFocus
          style={{
            flex: 1, fontSize: 13, background: 'transparent', border: 'none',
            borderBottom: '1px solid #1a1a1a', outline: 'none',
            padding: '2px 0', fontFamily: 'inherit',
          }}
        />
        <button
          onClick={commit}
          style={{
            fontSize: 12, padding: '5px 12px', borderRadius: 3, border: 'none',
            background: '#1a1a1a', color: '#fafaf7', cursor: 'pointer',
            fontFamily: 'inherit', fontWeight: 500, whiteSpace: 'nowrap',
          }}
        >
          Add
        </button>
        <button onClick={() => { setAdding(false); setName(''); }} className="icn" style={{ fontSize: 12 }}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setAdding(true)} className="icn" style={{ marginTop: 8, fontSize: 12 }}>
      <Plus size={13} /> Add project
    </button>
  );
}

/* ─── main component ─── */

export default function ProfileView({
  user, profile, onSave, onBack, onExport, onDeleteAccount,
  workProjectData = {}, personalProjectData = {},
  onRenameProject, onDeleteProject,
}) {
  const [local, setLocal] = useState(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (profile && !local) setLocal(profile);
  }, [profile]);

  if (!local) {
    return (
      <div className="page-wrap">
        <p style={{ fontSize: 13, color: '#888581' }}>Loading…</p>
      </div>
    );
  }

  const update = (updates) => setLocal(prev => ({ ...prev, ...updates }));

  const cp = () => ({
    work: [...(local.customProjects?.work || [])],
    personal: [...(local.customProjects?.personal || [])],
  });

  const workProjects = [...new Set([...Object.keys(workProjectData), ...(local.customProjects?.work || [])])].sort();
  const personalProjects = [...new Set([...Object.keys(personalProjectData), ...(local.customProjects?.personal || [])])].sort();

  const handleRenameProject = async (oldName, newName, mode) => {
    if ((mode === 'work' ? workProjectData : personalProjectData)[oldName] > 0) {
      await onRenameProject?.(oldName, newName, mode);
    }
    const key = mode === 'work' ? 'work' : 'personal';
    const c = cp();
    c[key] = c[key].map(p => p === oldName ? newName : p);
    const updated = { ...local, customProjects: c };
    setLocal(updated);
    await onSave(updated);
  };

  const handleDeleteProject = async (name, mode) => {
    if ((mode === 'work' ? workProjectData : personalProjectData)[name] > 0) {
      await onDeleteProject?.(name, mode);
    }
    const key = mode === 'work' ? 'work' : 'personal';
    const c = cp();
    c[key] = c[key].filter(p => p !== name);
    const updated = { ...local, customProjects: c };
    setLocal(updated);
    await onSave(updated);
  };

  const handleAddProject = (name, mode) => {
    const key = mode === 'work' ? 'work' : 'personal';
    const c = cp();
    if (!c[key].includes(name)) {
      c[key] = [...c[key], name].sort();
      update({ customProjects: c });
    }
  };

  const initials = (local.displayName || user?.email || '?')
    .trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarError('');
    setAvatarUploading(true);
    try {
      const path = `${user.id}/avatar`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      update({ avatarUrl: publicUrl });
      setAvatarVersion(Date.now());
    } catch {
      setAvatarError('Upload failed. Make sure the "avatars" storage bucket exists in Supabase.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(local);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    setShowDeleteDialog(false);
    await onDeleteAccount();
  };

  const avatarSrc = local.avatarUrl
    ? `${local.avatarUrl}${local.avatarUrl.includes('?') ? '&' : '?'}v=${avatarVersion}`
    : null;

  return (
    <div className="page-wrap">
      <header style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} className="icn" style={{ marginLeft: -6, padding: '6px 8px' }}>
            <ArrowLeft size={16} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>Profile</h1>
        </div>
      </header>

      {/* ── Account ── */}
      <Section title="Account">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 64, height: 64, borderRadius: '50%', background: '#e8e6e0',
              overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            ) : (
              <span style={{ fontSize: 20, fontWeight: 600, color: '#5a5854' }}>{initials}</span>
            )}
          </div>
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              className="icn"
              disabled={avatarUploading}
              style={{ fontSize: 12, padding: '5px 12px', border: '1px solid #d8d6d0', borderRadius: 3, marginBottom: 4 }}
            >
              <Upload size={12} /> {avatarUploading ? 'Uploading…' : 'Upload photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            {avatarError ? (
              <p style={{ fontSize: 11, color: '#c45b3f', margin: 0 }}>{avatarError}</p>
            ) : (
              <p style={{ fontSize: 11, color: '#a8a8a4', margin: 0 }}>JPG or PNG, up to 2 MB</p>
            )}
          </div>
        </div>
        <Field label="Display name">
          <input
            value={local.displayName}
            onChange={e => update({ displayName: e.target.value })}
            placeholder="Your name"
            className="field-input"
          />
        </Field>
        <Field label="Email" style={{ marginBottom: 0 }}>
          <input value={user?.email || ''} disabled className="field-input" style={{ color: '#888581' }} />
        </Field>
      </Section>

      {/* ── Work North Star ── */}
      <Section
        title="Work North Star"
        description="Shown as a reminder when scoring work tasks — keeps your Career Alignment honest."
      >
        <CardField label="Career direction">
          <CardTextarea
            value={local.workNorthStar}
            onChange={e => update({ workNorthStar: e.target.value })}
            placeholder="Where do you want to be in 2–3 years?"
          />
        </CardField>
      </Section>

      {/* ── Personal North Stars ── */}
      <Section
        title="Personal North Stars"
        description="Shown as reminders when scoring personal tasks — keeps your priorities grounded."
      >
        <CardField label="Life vision">
          <CardTextarea
            value={local.lifeVision}
            onChange={e => update({ lifeVision: e.target.value })}
            placeholder="What does a good life look like for you?"
          />
        </CardField>
        <CardField label="Current focus" style={{ marginBottom: 0 }}>
          <CardInput
            value={local.currentFocus}
            onChange={e => update({ currentFocus: e.target.value })}
            placeholder="What one thing are you actively working on right now?"
          />
        </CardField>
      </Section>

      {/* ── Projects ── */}
      <Section title="Projects">
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#888581', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 2px' }}>Work</p>
          {workProjects.length === 0 && (
            <p style={{ fontSize: 13, color: '#a8a8a4', margin: '10px 0 0', fontStyle: 'italic' }}>No work projects yet.</p>
          )}
          {workProjects.map(name => (
            <ProjectRow
              key={name}
              name={name}
              count={workProjectData[name] || 0}
              onRename={(old, n) => handleRenameProject(old, n, 'work')}
              onDelete={n => handleDeleteProject(n, 'work')}
            />
          ))}
          <AddProjectRow onAdd={name => handleAddProject(name, 'work')} />
        </div>

        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#888581', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 2px' }}>Personal</p>
          {personalProjects.length === 0 && (
            <p style={{ fontSize: 13, color: '#a8a8a4', margin: '10px 0 0', fontStyle: 'italic' }}>No personal projects yet.</p>
          )}
          {personalProjects.map(name => (
            <ProjectRow
              key={name}
              name={name}
              count={personalProjectData[name] || 0}
              onRename={(old, n) => handleRenameProject(old, n, 'personal')}
              onDelete={n => handleDeleteProject(n, 'personal')}
            />
          ))}
          <AddProjectRow onAdd={name => handleAddProject(name, 'personal')} />
        </div>
      </Section>

      {/* ── Preferences ── */}
      <Section title="Preferences">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ margin: '0 0 3px', fontSize: 14 }}>Default mode on launch</p>
            <p style={{ margin: 0, fontSize: 12, color: '#888581' }}>Which mode opens when you first load the app.</p>
          </div>
          <ModeToggle value={local.defaultMode} onChange={v => update({ defaultMode: v })} />
        </div>
      </Section>

      {/* ── Data & Privacy ── */}
      <Section title="Data &amp; Privacy" last>
        <div style={{ padding: '12px 0', borderBottom: '1px solid #e8e6e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ margin: '0 0 3px', fontSize: 14 }}>Export my data</p>
            <p style={{ margin: 0, fontSize: 12, color: '#888581' }}>Download all tasks as a CSV file.</p>
          </div>
          <button
            onClick={onExport}
            className="icn"
            style={{ fontSize: 12, padding: '6px 12px', border: '1px solid #d8d6d0', borderRadius: 3, whiteSpace: 'nowrap' }}
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
        <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ margin: '0 0 3px', fontSize: 14 }}>Delete account</p>
            <p style={{ margin: 0, fontSize: 12, color: '#888581' }}>Permanently deletes all your tasks and profile data.</p>
          </div>
          <button
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleting}
            style={{
              fontSize: 12, padding: '6px 12px', borderRadius: 3,
              border: '1px solid #c45b3f', background: 'transparent',
              color: '#c45b3f', cursor: 'pointer', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            }}
          >
            <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Section>

      <div style={{ paddingTop: 24, paddingBottom: 60 }}>
        <button onClick={handleSave} className="primary-btn" disabled={saving}>
          {saved ? 'Saved' : saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* ── Delete confirmation dialog ── */}
      {showDeleteDialog && (
        <div className="modal-bg" onClick={() => { setShowDeleteDialog(false); setDeleteConfirm(''); }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fafaf7', maxWidth: 420, width: '100%',
              padding: '28px', borderRadius: 4, margin: 'auto',
              boxShadow: '0 20px 60px rgba(26,26,26,0.25)',
            }}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 600 }}>Delete account?</h3>
            <p style={{ fontSize: 13, color: '#5a5854', margin: '0 0 18px', lineHeight: 1.5 }}>
              This will permanently delete all your tasks and cannot be undone.
              Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="field-input"
              style={{ marginBottom: 20 }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowDeleteDialog(false); setDeleteConfirm(''); }}
                className="icn"
                style={{ padding: '8px 16px', border: '1px solid #d8d6d0', borderRadius: 3, fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirm !== 'DELETE'}
                style={{
                  fontSize: 13, padding: '8px 16px', borderRadius: 3, border: 'none',
                  background: deleteConfirm === 'DELETE' ? '#c45b3f' : '#e8e6e0',
                  color: deleteConfirm === 'DELETE' ? '#fafaf7' : '#a8a8a4',
                  cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'default',
                  fontFamily: 'inherit', fontWeight: 500, transition: 'all 0.15s',
                }}
              >
                Delete everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
