export default function ScaleField({ guide, value, onChange, icon }) {
  const current = guide.levels.find(l => l.v === value);
  const pct = ((value - 1) / 4) * 100;

  return (
    <div style={{ paddingTop: 14, paddingBottom: 14, borderTop: '1px solid #e8e6e0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {icon && <span style={{ color: '#888581', display: 'flex', flexShrink: 0 }}>{icon}</span>}
        <h4 style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{guide.label}</h4>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 12, whiteSpace: 'nowrap' }}>
          <strong>{value}</strong> <span style={{ color: '#888581' }}>· {current?.l}</span>
        </span>
      </div>
      <p style={{ fontSize: 12, color: '#6b6b68', marginBottom: 12, marginTop: 0 }}>{guide.description}</p>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          cursor: 'pointer',
          background: `linear-gradient(to right, #1a1a1a ${pct}%, #e8e6e0 ${pct}%)`,
        }}
      />
      {/* Labels positioned to match thumb centres: thumb is 16px wide, so centres sit 8px in from each edge */}
      <div style={{ position: 'relative', height: 16, marginTop: 3 }}>
        {guide.levels.map((l, i) => (
          <span
            key={l.v}
            style={{
              position: 'absolute',
              left: `calc(8px + ${i / 4} * (100% - 16px))`,
              transform: 'translateX(-50%)',
              fontSize: 10,
              fontFamily: 'IBM Plex Mono, monospace',
              fontWeight: value === l.v ? 600 : 400,
              color: value === l.v ? '#1a1a1a' : '#c8c5be',
              transition: 'color 0.15s',
            }}
          >
            {l.v}
          </span>
        ))}
      </div>
    </div>
  );
}
