export default function Dashboard() {
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Overview of your cargo operations.</p>
            </div>
            <div className="glass-panel">
                <h2>Stats Overview</h2>
                <p>Charts and metrics will go here.</p>
            </div>
        </div>
    );
}
