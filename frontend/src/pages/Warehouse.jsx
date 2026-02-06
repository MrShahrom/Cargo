import { useState, useEffect } from 'react';
import { Package, Scale, Scan, User, CheckCircle, Trash2, Edit2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Warehouse() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        id: null,
        trackingCode: '',
        clientHumanId: '',
        weight: '',
        volume: '',
        price: ''
    });
    const [recentPackages, setRecentPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const response = await api.get('/packages');
            setRecentPackages(response.data.slice(0, 10)); // Last 10
        } catch (error) {
            console.error('Failed to fetch packages');
        }
    };

    const handleEdit = (pkg) => {
        setIsEditing(true);
        setFormData({
            id: pkg.id,
            trackingCode: pkg.trackingCode,
            clientHumanId: pkg.client?.humanId || '',
            weight: pkg.weight,
            volume: pkg.volume,
            price: pkg.price
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this parcel?')) return;
        try {
            await api.delete(`/packages/${id}`);
            fetchPackages();
        } catch (error) {
            alert('Failed to delete parcel');
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setFormData({ id: null, trackingCode: '', clientHumanId: '', weight: '', volume: '', price: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg('');

        try {
            const payload = {
                trackingCode: formData.trackingCode,
                // For update, we might not need ClientID if backend doesn't update it, but let's keep it consistent
                clientId: isEditing ? undefined : undefined, // Handled by backend logic or kept same
                clientHumanId: formData.clientHumanId,
                weight: parseFloat(formData.weight),
                volume: parseFloat(formData.volume),
                price: parseFloat(formData.price || 0)
            };

            if (isEditing) {
                await api.put(`/packages/${formData.id}`, payload);
                setSuccessMsg(`Parcel ${formData.trackingCode} updated!`);
                setIsEditing(false);
            } else {
                await api.post('/packages', payload);
                setSuccessMsg(`Parcel ${formData.trackingCode} received!`);
            }

            setFormData({ id: null, trackingCode: '', clientHumanId: '', weight: '', volume: '', price: '' });
            fetchPackages();
        } catch (error) {
            console.error(error);
            let msg = isEditing ? 'Failed to update package.' : 'Failed to register package.';

            if (error.response) {
                // Backend returned a response
                if (typeof error.response.data === 'string') {
                    msg += ` ${error.response.data}`;
                } else if (error.response.data?.title) {
                    msg += ` ${error.response.data.title}`;
                } else if (error.response.data?.message) {
                    msg += ` ${error.response.data.message}`;
                }
            }

            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '350px' }}>
                <div className="page-header">
                    <h1 className="page-title">{isEditing ? 'Edit Parcel' : 'Parcel Receipt'}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{isEditing ? 'Update parcel details.' : 'Receive arriving parcels (Step 1).'}</p>
                </div>

                <div className="glass-panel">
                    {successMsg && (
                        <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#86efac' }}>
                            <CheckCircle size={18} /> {successMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                Tracking Code
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Scan size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    autoFocus
                                    required
                                    className="input-field"
                                    style={{ paddingLeft: '2.5rem', fontSize: '1.2rem', fontFamily: 'monospace' }}
                                    placeholder="SCAN-12345"
                                    value={formData.trackingCode}
                                    onChange={e => setFormData({ ...formData, trackingCode: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Client ID (e.g. A00001)</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    required
                                    className="input-field"
                                    style={{ paddingLeft: '2.5rem', textTransform: 'uppercase' }}
                                    placeholder="A00001"
                                    value={formData.clientHumanId}
                                    onChange={e => setFormData({ ...formData, clientHumanId: e.target.value.toUpperCase() })}
                                    disabled={isEditing} // Prevent changing client for now to keep it simple, or allow if backend supports
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Weight (kg)</label>
                                <div style={{ position: 'relative' }}>
                                    <Scale size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="number" step="0.1" required
                                        className="input-field"
                                        style={{ paddingLeft: '2.5rem' }}
                                        value={formData.weight}
                                        onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Volume (m³)</label>
                                <input
                                    type="number" step="0.01" required
                                    className="input-field"
                                    value={formData.volume}
                                    onChange={e => setFormData({ ...formData, volume: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Price (Cost)</label>
                            <input
                                type="number" step="0.1"
                                className="input-field"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {isEditing && (
                                <button type="button" className="btn" style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'white' }} onClick={handleCancelEdit}>
                                    Cancel
                                </button>
                            )}
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                                {loading ? 'Processing...' : (isEditing ? 'Update Parcel' : 'Receive Parcel')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div style={{ flex: '1', minWidth: '350px' }}>
                <div className="page-header">
                    <h2 className="page-title" style={{ fontSize: '1.5rem' }}>Recent Scans</h2>
                </div>
                <div className="glass-panel" style={{ padding: '0' }}>
                    {recentPackages.length === 0 ? (
                        <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No recent parcels.</p>
                    ) : (
                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            {recentPackages.map(pkg => (
                                <div key={pkg.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{pkg.trackingCode}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--primary)' }}>{pkg.client?.humanId}</span> •
                                            <span>{pkg.weight}kg</span> •
                                            <span>{pkg.volume}m³</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <button
                                            className="btn"
                                            style={{ padding: '0.25rem', background: 'transparent', color: 'var(--text-muted)' }}
                                            onClick={() => handleEdit(pkg)}
                                        >
                                            <Edit2 size={16} />
                                        </button>

                                        {user?.role === 'Admin' && (
                                            <button
                                                className="btn"
                                                style={{ padding: '0.25rem', background: 'transparent', color: 'red' }}
                                                onClick={() => handleDelete(pkg.id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
