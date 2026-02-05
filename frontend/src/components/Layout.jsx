import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Truck, Box, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const location = useLocation();
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/clients', label: 'Clients', icon: Users },
        { path: '/warehouse', label: 'Warehouse', icon: Package },
        { path: '/shipments', label: 'Shipments', icon: Truck },
    ];

    if (user?.role === 'Admin') {
        navItems.push({ path: '/users', label: 'Users', icon: Shield });
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app-container">
            <aside className="sidebar glass" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Box color="var(--primary)" size={32} />
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Cargo<span style={{ color: 'var(--primary)' }}>Admin</span></h1>
                    </div>
                </div>

                <nav style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-sm)',
                                    textDecoration: 'none',
                                    color: isActive ? '#fff' : 'var(--text-muted)',
                                    background: isActive ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)' : 'transparent',
                                    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Icon size={20} color={isActive ? 'var(--primary)' : 'currentColor'} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ marginBottom: '1rem', padding: '0 1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Signed in as <strong style={{ color: 'var(--primary)' }}>{user?.username}</strong>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            borderRadius: 'var(--radius-sm)',
                        }}
                        className="btn-logout"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
