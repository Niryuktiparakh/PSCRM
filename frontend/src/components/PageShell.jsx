export default function PageShell({ title, children }) {
  return (
    <div className="page-shell">
      <div className="page-card">
        <h1>{title}</h1>
        {children}
      </div>
    </div>
  );
}
