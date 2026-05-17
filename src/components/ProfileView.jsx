import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, Download, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

function Section({ title, children, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : 32, paddingBottom: 32, borderBottom: last ? 'none' : '1px solid #e8e6e0' }}>
      <p className="label" style={{ margin: '0 0 16px' }}>{title}</p>
      {children}
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      <label className="label" style={{ display: 'block', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%',
        fontSize: 14,
        fontFamily: 'inherit',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid #d8d6d0',
        outline: 'none',
        resize: 'none',
        padding: '6px 0',
        lineHeight: 1.5,
        color: 'inherit',
        display: 'block',
        transition: 'border-color 0.15s',
      }}
      onFocus={e => (e.target.style.borderBottomColor = '#1a1a1a')}
      onBlur={e => (e.target.style.borderBottomColor = '#d8d6d0')}
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
            padding: '5px 18px',
            fontSize: 12,
            fontWeight: 500,
            fontFamily: 'inherit',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
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

export default function ProfileView({ user, profile, onSave, onBack, onExport, onDeleteAccount }) {
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

  const initials = (local.displayName || user?.email || '?')
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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

      <Section title="Account">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#e8e6e0', overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
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
          <input
            value={user?.email || ''}
            disabled
            className="field-input"
            style={{ color: '#888581' }}
          />
        </Field>
      </Section>

      <Section title="Work North Star">
        <Field label="Career direction" style={{ marginBottom: 4 }}>
          <Textarea
            value={local.workNorthStar}
            onChange={e => update({ workNorthStar: e.target.value })}
            placeholder="Where do you want to be in 2–3 years?"
          />
        </Field>
        <p style={{ fontSize: 12, color: '#a8a8a4', margin: 0 }}>
          Shown as a reminder while scoring work tasks.
        </p>
      </Section>

      <Section title="Personal North Stars">
        <Field label="Life vision">
          <Textarea
            value={local.lifeVision}
            onChange={e => update({ lifeVision: e.target.value })}
            placeholder="What does a good life look like for you?"
          />
        </Field>
        <Field label="Current focus" style={{ marginBottom: 4 }}>
          <input
            value={local.currentFocus}
            onChange={e => update({ currentFocus: e.target.value })}
            placeholder="What one thing are you actively working on right now?"
            className="field-input"
          />
        </Field>
        <p style={{ fontSize: 12, color: '#a8a8a4', margin: 0 }}>
          Shown as reminders while scoring personal tasks.
        </p>
      </Section>

      <Section title="Preferences">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ margin: '0 0 3px', fontSize: 14 }}>Default mode on launch</p>
            <p style={{ margin: 0, fontSize: 12, color: '#888581' }}>Which mode opens when you first load the app.</p>
          </div>
          <ModeToggle value={local.defaultMode} onChange={v => update({ defaultMode: v })} />
        </div>
      </Section>

      <Section title="Data &amp; Privacy">
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

      <div style={{ paddingTop: 8, paddingBottom: 60 }}>
        <button onClick={handleSave} className="primary-btn" disabled={saving}>
          {saved ? 'Saved' : saving ? 'Saving…' : 'Save'}
        </button>
      </div>

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
