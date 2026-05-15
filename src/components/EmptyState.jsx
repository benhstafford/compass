export default function EmptyState({ title, sub }) {
  return (
    <div style={{ padding: '70px 0', textAlign: 'center', color: '#888581' }}>
      <p style={{ fontSize: 17, fontWeight: 500, color: '#1a1a1a', marginBottom: 6, marginTop: 0 }}>{title}</p>
      {sub && <p style={{ fontSize: 13, margin: 0 }}>{sub}</p>}
    </div>
  );
}
